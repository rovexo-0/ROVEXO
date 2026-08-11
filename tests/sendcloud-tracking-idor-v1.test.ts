import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireApiAuth,
  assertSendcloudTrackingRefreshAccess,
  isSendcloudConfigured,
  getTracking,
  updateShippingRecordStatus,
  onShippingRecordStatusChanged,
} = vi.hoisted(() => ({
  requireApiAuth: vi.fn(),
  assertSendcloudTrackingRefreshAccess: vi.fn(),
  isSendcloudConfigured: vi.fn(),
  getTracking: vi.fn(),
  updateShippingRecordStatus: vi.fn(),
  onShippingRecordStatusChanged: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireApiAuth,
}));

vi.mock("@/lib/shipping/assert-order-shipping-access.server", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/shipping/assert-order-shipping-access.server")
  >("@/lib/shipping/assert-order-shipping-access.server");
  return {
    ...actual,
    assertSendcloudTrackingRefreshAccess,
  };
});

vi.mock("@/lib/shipping/env", () => ({
  isSendcloudConfigured,
}));

vi.mock("@/lib/shipping/sendcloud/service", () => ({
  SendcloudService: {
    getTracking,
  },
}));

vi.mock("@/lib/shipping/store", () => ({
  updateShippingRecordStatus,
  getShippingRecord: vi.fn(),
  findShippingRecordByTrackingNumber: vi.fn(),
}));

vi.mock("@/lib/commerce-engine/shipping-hooks.server", () => ({
  onShippingRecordStatusChanged,
}));

import { GET } from "@/app/api/shipping/sendcloud/tracking/route";
import { NextResponse } from "next/server";

describe("GET /api/shipping/sendcloud/tracking — IDOR protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSendcloudConfigured.mockReturnValue(true);
    updateShippingRecordStatus.mockResolvedValue(null);
    onShippingRecordStatusChanged.mockResolvedValue(undefined);
  });

  it("rejects unauthenticated requests without calling Sendcloud", async () => {
    requireApiAuth.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await GET(
      new Request("http://localhost/api/shipping/sendcloud/tracking?trackingNumber=SC1"),
    );

    expect(response.status).toBe(401);
    expect(assertSendcloudTrackingRefreshAccess).not.toHaveBeenCalled();
    expect(getTracking).not.toHaveBeenCalled();
    expect(updateShippingRecordStatus).not.toHaveBeenCalled();
  });

  it("rejects unauthorized trackingNumber without calling Sendcloud", async () => {
    requireApiAuth.mockResolvedValue({ user: { id: "user-a" } });
    assertSendcloudTrackingRefreshAccess.mockResolvedValue({ ok: false });

    const response = await GET(
      new Request(
        "http://localhost/api/shipping/sendcloud/tracking?trackingNumber=USER-B-TRACK",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Tracking not found.");
    expect(getTracking).not.toHaveBeenCalled();
    expect(updateShippingRecordStatus).not.toHaveBeenCalled();
  });

  it("rejects unauthorized orderId without calling Sendcloud", async () => {
    requireApiAuth.mockResolvedValue({ user: { id: "user-a" } });
    assertSendcloudTrackingRefreshAccess.mockResolvedValue({ ok: false });

    const response = await GET(
      new Request(
        "http://localhost/api/shipping/sendcloud/tracking?orderId=order-b&trackingNumber=SC-B",
      ),
    );

    expect(response.status).toBe(404);
    expect(getTracking).not.toHaveBeenCalled();
    expect(updateShippingRecordStatus).not.toHaveBeenCalled();
  });

  it("rejects mismatched orderId + trackingNumber without calling Sendcloud or mutating", async () => {
    requireApiAuth.mockResolvedValue({ user: { id: "user-a" } });
    assertSendcloudTrackingRefreshAccess.mockResolvedValue({ ok: false });

    const response = await GET(
      new Request(
        "http://localhost/api/shipping/sendcloud/tracking?orderId=order-a&trackingNumber=SC-B",
      ),
    );

    expect(response.status).toBe(404);
    expect(getTracking).not.toHaveBeenCalled();
    expect(updateShippingRecordStatus).not.toHaveBeenCalled();
    expect(onShippingRecordStatusChanged).not.toHaveBeenCalled();
  });

  it("allows authorized buyer and calls Sendcloud with canonical tracking", async () => {
    requireApiAuth.mockResolvedValue({ user: { id: "buyer-1" } });
    assertSendcloudTrackingRefreshAccess.mockResolvedValue({
      ok: true,
      role: "buyer",
      orderId: "order-1",
      trackingNumber: "SC-OWN",
    });
    getTracking.mockResolvedValue({
      status: "in_transit",
      events: [{ statusDetails: "On the way" }],
    });

    const response = await GET(
      new Request(
        "http://localhost/api/shipping/sendcloud/tracking?orderId=order-1&trackingNumber=SC-OWN",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(getTracking).toHaveBeenCalledTimes(1);
    expect(getTracking).toHaveBeenCalledWith("SC-OWN");
    expect(updateShippingRecordStatus).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "order-1", status: "in_transit" }),
    );
  });

  it("allows authorized seller", async () => {
    requireApiAuth.mockResolvedValue({ user: { id: "seller-1" } });
    assertSendcloudTrackingRefreshAccess.mockResolvedValue({
      ok: true,
      role: "seller",
      orderId: "order-1",
      trackingNumber: "SC-OWN",
    });
    getTracking.mockResolvedValue({ status: "delivered", events: [] });

    const response = await GET(
      new Request(
        "http://localhost/api/shipping/sendcloud/tracking?orderId=order-1&trackingNumber=SC-OWN",
      ),
    );

    expect(response.status).toBe(200);
    expect(getTracking).toHaveBeenCalledWith("SC-OWN");
    expect(updateShippingRecordStatus).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "order-1" }),
    );
  });

  it("does not mutate shipping status when orderId is omitted (still requires ownership)", async () => {
    requireApiAuth.mockResolvedValue({ user: { id: "buyer-1" } });
    assertSendcloudTrackingRefreshAccess.mockResolvedValue({
      ok: true,
      role: "buyer",
      orderId: "order-1",
      trackingNumber: "SC-OWN",
    });
    getTracking.mockResolvedValue({ status: "in_transit", events: [] });

    const response = await GET(
      new Request("http://localhost/api/shipping/sendcloud/tracking?trackingNumber=SC-OWN"),
    );

    expect(response.status).toBe(200);
    expect(getTracking).toHaveBeenCalledWith("SC-OWN");
    expect(updateShippingRecordStatus).not.toHaveBeenCalled();
    expect(onShippingRecordStatusChanged).not.toHaveBeenCalled();
  });

  it("rejects unauthorized status mutation path (access fail before write)", async () => {
    requireApiAuth.mockResolvedValue({ user: { id: "user-a" } });
    assertSendcloudTrackingRefreshAccess.mockResolvedValue({ ok: false });

    const response = await GET(
      new Request(
        "http://localhost/api/shipping/sendcloud/tracking?orderId=order-b&trackingNumber=SC-B",
      ),
    );

    expect(response.status).toBe(404);
    expect(getTracking).not.toHaveBeenCalled();
    expect(updateShippingRecordStatus).not.toHaveBeenCalled();
    expect(onShippingRecordStatusChanged).not.toHaveBeenCalled();
  });
});

describe("assertSendcloudTrackingRefreshAccess — ownership matrix (source + unit)", () => {
  it("exports fail-closed tracking refresh assert and route uses it before Sendcloud", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const assertSrc = readFileSync(
      join(process.cwd(), "lib/shipping/assert-order-shipping-access.server.ts"),
      "utf8",
    );
    const routeSrc = readFileSync(
      join(process.cwd(), "app/api/shipping/sendcloud/tracking/route.ts"),
      "utf8",
    );

    expect(assertSrc).toContain("export async function assertSendcloudTrackingRefreshAccess");
    expect(assertSrc).toContain("assertOrderShippingParticipant");
    expect(assertSrc).toContain("findShippingRecordByTrackingNumber");
    expect(routeSrc).toContain("assertSendcloudTrackingRefreshAccess");
    expect(routeSrc.indexOf("assertSendcloudTrackingRefreshAccess")).toBeLessThan(
      routeSrc.indexOf("SendcloudService.getTracking"),
    );
    expect(routeSrc).toContain('error: "Tracking not found."');
    expect(routeSrc).not.toMatch(
      /SendcloudService\.getTracking\(\s*trackingNumberParam/,
    );
  });
});
