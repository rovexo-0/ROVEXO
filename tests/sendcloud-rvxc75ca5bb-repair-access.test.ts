/**
 * Focused access tests for one-time RVXC75CA5BB Super Admin repair endpoint.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const requireApiSuperAdmin = vi.fn();
const repairPaidOrderShippingPersistence = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireApiSuperAdmin: (...args: unknown[]) => requireApiSuperAdmin(...args),
}));

vi.mock("@/lib/orders/repair-paid-order-shipping.server", () => ({
  repairPaidOrderShippingPersistence: (...args: unknown[]) =>
    repairPaidOrderShippingPersistence(...args),
}));

import { POST } from "@/app/api/super-admin/shipping/repair-rvxc75ca5bb/route";
import { RVXC75CA5BB_ORPHAN_REPAIR_V1 } from "@/lib/orders/rvxc75ca5bb-orphan-shipping-repair-v1";

describe("POST /api/super-admin/shipping/repair-rvxc75ca5bb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repairPaidOrderShippingPersistence.mockResolvedValue({
      ok: true,
      orderId: RVXC75CA5BB_ORPHAN_REPAIR_V1.orderId,
      orderNumber: RVXC75CA5BB_ORPHAN_REPAIR_V1.orderNumber,
      shippingSetupStatus: "ready",
      shippingRecordId: "sr-1",
      selectedQuoteId: RVXC75CA5BB_ORPHAN_REPAIR_V1.selectedShippingQuoteId,
      idempotent: false,
      sendcloudCalled: false,
      parcelCreatedExternally: false,
      labelCreated: false,
    });
  });

  it("rejects unauthenticated / non-super-admin requests", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const response = await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvxc75ca5bb", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    expect(repairPaidOrderShippingPersistence).not.toHaveBeenCalled();
  });

  it("authorized Super Admin reaches existing repair with locked quote id", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvxc75ca5bb", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(200);
    expect(repairPaidOrderShippingPersistence).toHaveBeenCalledTimes(1);
    expect(repairPaidOrderShippingPersistence).toHaveBeenCalledWith(
      RVXC75CA5BB_ORPHAN_REPAIR_V1.orderId,
      { selectedShippingQuoteId: RVXC75CA5BB_ORPHAN_REPAIR_V1.selectedShippingQuoteId },
    );

    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.sendcloudCalled).toBe(false);
    expect(json.labelCreated).toBe(false);
    expect(json.selectedQuoteId).toBe("sendcloud:29631");
  });

  it("rejects wrong order ID", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvxc75ca5bb", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(repairPaidOrderShippingPersistence).not.toHaveBeenCalled();
  });

  it("rejects wrong quote ID", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvxc75ca5bb", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          selectedShippingQuoteId: "sendcloud:99999",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(repairPaidOrderShippingPersistence).not.toHaveBeenCalled();
  });

  it("does not call Sendcloud from this repair endpoint", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const routeSource = await import("node:fs").then((fs) =>
      fs.readFileSync("app/api/super-admin/shipping/repair-rvxc75ca5bb/route.ts", "utf8"),
    );

    expect(routeSource).not.toContain("SendcloudService");
    expect(routeSource).not.toContain("generateShippingLabelForOrder");
    expect(routeSource).not.toContain("sendcloudRequest");
    expect(routeSource).toContain("repairPaidOrderShippingPersistence");
    expect(routeSource).toContain("requireApiSuperAdmin");

    await POST(
      new Request("http://localhost/api/super-admin/shipping/repair-rvxc75ca5bb", {
        method: "POST",
      }),
    );

    const call = repairPaidOrderShippingPersistence.mock.calls[0];
    expect(call?.[0]).toBe(RVXC75CA5BB_ORPHAN_REPAIR_V1.orderId);
    expect(call?.[1]).toEqual({
      selectedShippingQuoteId: "sendcloud:29631",
    });
  });
});
