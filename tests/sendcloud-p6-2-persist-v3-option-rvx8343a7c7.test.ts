/**
 * Focused tests: P6.2 persist Owner-confirmed V3 code for RVX8343A7C7 only.
 * Mocks only — never hits live Sendcloud / production DB / label / payment.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";

const requireApiSuperAdmin = vi.fn();
const persistRvx8343a7c7ConfirmedV3ShippingOption = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireApiSuperAdmin: (...args: unknown[]) => requireApiSuperAdmin(...args),
}));

vi.mock("@/lib/shipping/persist-rvx8343a7c7-v3-shipping-option.server", () => ({
  persistRvx8343a7c7ConfirmedV3ShippingOption: (...args: unknown[]) =>
    persistRvx8343a7c7ConfirmedV3ShippingOption(...args),
}));

import { POST } from "@/app/api/super-admin/shipping/persist-v3-option-rvx8343a7c7/route";
import { RVX8343A7C7_V3_QUOTE_PERSIST_V1 } from "@/lib/orders/rvx8343a7c7-v3-quote-persist-v1";
import { isConfirmedSendcloudV3ShippingOptionCode } from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";

const LOCK = RVX8343A7C7_V3_QUOTE_PERSIST_V1;

describe("P6.2 lock SSOT", () => {
  it("locks exact Owner-confirmed V3 code and order", () => {
    expect(LOCK.orderId).toBe("7554fb35-6261-4b4b-96a5-aef0273d9b5b");
    expect(LOCK.orderNumber).toBe("RVX8343A7C7");
    expect(LOCK.legacyQuoteId).toBe("sendcloud:27227");
    expect(LOCK.v2MethodId).toBe(27227);
    expect(LOCK.confirmedShippingOptionCode).toBe("inpost_gb:lockertoaddress/dropoff");
    expect(
      isConfirmedSendcloudV3ShippingOptionCode(
        LOCK.confirmedShippingOptionCode,
        LOCK.v2MethodId,
      ),
    ).toBe(true);
    expect(LOCK.confirmedShippingOptionCode).not.toBe("27227");
    expect(LOCK.confirmedShippingOptionCode).not.toBe("sendcloud:27227");
  });
});

describe("POST /api/super-admin/shipping/persist-v3-option-rvx8343a7c7", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistRvx8343a7c7ConfirmedV3ShippingOption.mockResolvedValue({
      ok: true,
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      legacyQuoteId: LOCK.legacyQuoteId,
      shippingOptionCode: LOCK.confirmedShippingOptionCode,
      quotePayloadPersisted: true,
      shippingQuoteRowId: "quote-row-1",
      shippingRecordId: "sr-8343",
      shippingSetupStatus: "ready",
      idempotent: false,
      sendcloudCalled: false,
      shipmentCreated: false,
      labelCreated: false,
      paymentMutated: false,
      orderAmountMutated: false,
      otherOrdersMutated: false,
      mutations: [
        `shipping_quotes.id=quote-row-1.quote_payload.shippingOptionCode=${LOCK.confirmedShippingOptionCode}`,
      ],
    });
  });

  it("rejects unauthenticated requests with 401", async () => {
    requireApiSuperAdmin.mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/persist-v3-option-rvx8343a7c7", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(persistRvx8343a7c7ConfirmedV3ShippingOption).not.toHaveBeenCalled();
  });

  it("rejects substitute shippingOptionCode", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/persist-v3-option-rvx8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shippingOptionCode: "royal_mail:tracked_48:large_letter",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(persistRvx8343a7c7ConfirmedV3ShippingOption).not.toHaveBeenCalled();
  });

  it("rejects wrong orderId", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/persist-v3-option-rvx8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: "11111111-1111-4111-8111-111111111111" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(persistRvx8343a7c7ConfirmedV3ShippingOption).not.toHaveBeenCalled();
  });

  it("persists locked code for Super Admin with empty body", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/persist-v3-option-rvx8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(200);
    expect(persistRvx8343a7c7ConfirmedV3ShippingOption).toHaveBeenCalledTimes(1);
    expect(persistRvx8343a7c7ConfirmedV3ShippingOption).toHaveBeenCalledWith();

    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.orderId).toBe(LOCK.orderId);
    expect(json.orderNumber).toBe("RVX8343A7C7");
    expect(json.legacyQuoteId).toBe("sendcloud:27227");
    expect(json.shippingOptionCode).toBe("inpost_gb:lockertoaddress/dropoff");
    expect(json.quotePayloadPersisted).toBe(true);
    expect(json.sendcloudCalled).toBe(false);
    expect(json.shipmentCreated).toBe(false);
    expect(json.labelCreated).toBe(false);
    expect(json.paymentMutated).toBe(false);
    expect(json.orderAmountMutated).toBe(false);
    expect(json.otherOrdersMutated).toBe(false);
    expect(JSON.stringify(json).toLowerCase()).not.toContain("authorization");
    expect(JSON.stringify(json).toLowerCase()).not.toContain("service_role");
  });

  it("accepts exact confirmed code in body", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/persist-v3-option-rvx8343a7c7", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: LOCK.orderId,
          shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(persistRvx8343a7c7ConfirmedV3ShippingOption).toHaveBeenCalled();
  });

  it("returns 422 when persist fails closed", async () => {
    requireApiSuperAdmin.mockResolvedValue({
      user: { id: "super-admin-1" },
      role: "super_admin",
    });
    persistRvx8343a7c7ConfirmedV3ShippingOption.mockResolvedValueOnce({
      ok: false,
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      error: "selected_shipping_quote_id must be sendcloud:27227; got sendcloud:99999.",
      sendcloudCalled: false,
      shipmentCreated: false,
      labelCreated: false,
      paymentMutated: false,
      orderAmountMutated: false,
      otherOrdersMutated: false,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/super-admin/shipping/persist-v3-option-rvx8343a7c7", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.quotePayloadPersisted).toBe(false);
    expect(json.sendcloudCalled).toBe(false);
    expect(json.labelCreated).toBe(false);
  });

  it("source: no shipment/label/payment/Sendcloud mutation paths", () => {
    const route = readFileSync(
      "app/api/super-admin/shipping/persist-v3-option-rvx8343a7c7/route.ts",
      "utf8",
    );
    const server = readFileSync(
      "lib/shipping/persist-rvx8343a7c7-v3-shipping-option.server.ts",
      "utf8",
    );
    const lock = readFileSync("lib/orders/rvx8343a7c7-v3-quote-persist-v1.ts", "utf8");

    expect(route).toContain("requireApiSuperAdmin");
    expect(route).toContain("persistRvx8343a7c7ConfirmedV3ShippingOption");
    expect(route).not.toContain("generateShippingLabelForOrder");
    expect(route).not.toContain("createSendcloudParcel");
    expect(route).not.toContain("announceSendcloudShipmentV3");
    expect(route).not.toContain("/shipments");
    expect(route).not.toContain("/parcels");
    expect(route).not.toMatch(/\bstripe\b/i);
    expect(route).not.toContain("createRefund");

    expect(server).toContain('from("shipping_quotes")');
    expect(server).toContain("quote_payload");
    expect(server).toContain("LOCK.confirmedShippingOptionCode");
    expect(server).toContain("RVX8343A7C7_V3_QUOTE_PERSIST_V1");
    expect(server).toContain("sendcloudCalled: false");
    expect(server).not.toContain("generateShippingLabelForOrder");
    expect(server).not.toContain("createSendcloudParcel");
    expect(server).not.toContain("announceSendcloudShipmentV3");
    expect(server).not.toContain("fetchSendcloudV3CompatMappingsForMethodIds");
    expect(server).not.toContain("sendcloudV3Request");
    expect(server).not.toMatch(/\.from\("orders"\)\.update/);

    expect(lock).toContain("inpost_gb:lockertoaddress/dropoff");
    expect(lock).toContain("sendcloud:27227");
    expect(lock).toContain("RVX8343A7C7");
    expect(lock).not.toContain("RVXC75CA5BB");
  });
});
