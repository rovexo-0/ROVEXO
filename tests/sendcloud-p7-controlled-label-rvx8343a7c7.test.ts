/**
 * Focused tests: P7 controlled label for RVX8343A7C7 — mocks only, no live Sendcloud.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";

const requireApiSuperAdmin = vi.fn();
const generateControlledLabelForRvx8343a7c7 = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireApiSuperAdmin: (...args: unknown[]) => requireApiSuperAdmin(...args),
}));

vi.mock("@/lib/shipping/generate-label-rvx8343a7c7.server", () => ({
  generateControlledLabelForRvx8343a7c7: (...args: unknown[]) =>
    generateControlledLabelForRvx8343a7c7(...args),
}));

import { POST } from "@/app/api/super-admin/shipping/generate-label-rvx8343a7c7/route";
import { RVX8343A7C7_CONTROLLED_LABEL_V1 } from "@/lib/orders/rvx8343a7c7-controlled-label-v1";

const LOCK = RVX8343A7C7_CONTROLLED_LABEL_V1;

describe("POST /api/super-admin/shipping/generate-label-rvx8343a7c7", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateControlledLabelForRvx8343a7c7.mockResolvedValue({
      ok: true,
      status: "label_ready",
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      shippingSetupStatus: "ready",
      shippingOptionCode: LOCK.confirmedShippingOptionCode,
      shippingRecordId: LOCK.expectedShippingRecordId,
      shippingQuoteRowId: LOCK.expectedShippingQuoteRowId,
      sendcloudCalled: true,
      sendcloudHttpStatus: null,
      failureKind: null,
      providerDetails: null,
      shipmentCreated: true,
      parcelCreatedExternally: true,
      labelCreated: true,
      shipmentId: null,
      parcelId: "parcel-1",
      labelId: null,
      trackingNumber: "TRACK123",
      idempotent: false,
      duplicateShipmentPrevented: false,
      orderAmountMutated: false,
      paymentMutated: false,
      otherOrdersMutated: false,
    });
  });

  it("rejects unauthenticated 401", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );
    const res = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/generate-label-rvx8343a7c7", {
        method: "POST",
      }),
    );
    expect(res.status).toBe(401);
    expect(generateControlledLabelForRvx8343a7c7).not.toHaveBeenCalled();
  });

  it("rejects wrong orderId", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "sa-1" },
      role: "super_admin",
    });
    const res = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/generate-label-rvx8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: "11111111-1111-4111-8111-111111111111" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(generateControlledLabelForRvx8343a7c7).not.toHaveBeenCalled();
  });

  it("invokes controlled generator once for locked order", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "sa-1" },
      role: "super_admin",
    });
    const res = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/generate-label-rvx8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({ orderId: LOCK.orderId }),
      }),
    );
    expect(res.status).toBe(200);
    expect(generateControlledLabelForRvx8343a7c7).toHaveBeenCalledTimes(1);
    const json = await res.json();
    expect(json.ORDER_ID).toBe(LOCK.orderId);
    expect(json.SHIPPING_OPTION_CODE).toBe("inpost_gb:lockertoaddress/dropoff");
    expect(json.ORDER_AMOUNT_MUTATED).toBe(false);
    expect(json.PAYMENT_MUTATED).toBe(false);
    expect(json.OTHER_ORDERS_MUTATED).toBe(false);
  });

  it("returns 422 for preflight_blocked", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "sa-1" },
      role: "super_admin",
    });
    generateControlledLabelForRvx8343a7c7.mockResolvedValueOnce({
      ok: false,
      status: "preflight_blocked",
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      shippingSetupStatus: "ready",
      shippingOptionCode: null,
      shippingRecordId: null,
      shippingQuoteRowId: null,
      sendcloudCalled: false,
      sendcloudHttpStatus: null,
      failureKind: "rovexo_validation",
      providerDetails: null,
      shipmentCreated: false,
      parcelCreatedExternally: false,
      labelCreated: false,
      shipmentId: null,
      parcelId: null,
      labelId: null,
      trackingNumber: null,
      idempotent: false,
      duplicateShipmentPrevented: false,
      orderAmountMutated: false,
      paymentMutated: false,
      otherOrdersMutated: false,
      error: "P7_PREFLIGHT_BLOCKED",
      preflightFailures: ["shipping_option_code_mismatch:null"],
    });
    const res = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/generate-label-rvx8343a7c7", {
        method: "POST",
      }),
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.P7_STATUS).toBe("preflight_blocked");
    expect(json.SENDCLOUD_CALLED).toBe(false);
  });

  it("source: uses canonical generateShippingLabelForOrder; no compat/persist", () => {
    const route = readFileSync(
      "app/api/super-admin/shipping/generate-label-rvx8343a7c7/route.ts",
      "utf8",
    );
    const server = readFileSync(
      "lib/shipping/generate-label-rvx8343a7c7.server.ts",
      "utf8",
    );
    const lock = readFileSync("lib/orders/rvx8343a7c7-controlled-label-v1.ts", "utf8");

    expect(route).toContain("requireApiSuperAdmin");
    expect(route).toContain("generateControlledLabelForRvx8343a7c7");
    expect(server).toContain("generateShippingLabelForOrder");
    expect(server).toContain("LOCK.confirmedShippingOptionCode");
    expect(server).toContain("RVX8343A7C7_CONTROLLED_LABEL_V1");
    expect(server).not.toContain("fetchSendcloudV3CompatMappingsForMethodIds");
    expect(server).not.toContain("persistRvx8343a7c7ConfirmedV3ShippingOption");
    expect(server).not.toContain("announceSendcloudShipmentV3");
    expect(lock).toContain("inpost_gb:lockertoaddress/dropoff");
    expect(lock).toContain("7554fb35-6261-4b4b-96a5-aef0273d9b5b");
    expect(lock).toContain("RVX8343A7C7");
    expect(lock).not.toContain("RVXC75CA5BB");
  });
});
