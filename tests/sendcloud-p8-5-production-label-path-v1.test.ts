/**
 * P8.5 — Production label path: deterministic selected-quote resolve → V3 announce.
 * No quotes[0] fallback. Row UUID ↔ externalQuoteId. Canonical parcel preserved.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  coerceShippingQuotePayload,
  shippingQuoteFromPayloadRow,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import {
  PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL,
  resolveCompleteParcelMeasurements,
} from "@/lib/shipping/parcels";
import { resolveSelectedShippingQuoteForLabel } from "@/lib/shipping/selected-shipping-quote-contract-v1";
import { resolveShipmentParcelForLabel } from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import type { ShippingQuote, ShipmentParcel } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const ORDER_1_QUOTE_ROW_ID = "dc98f660-71d3-4712-a176-763263409ee3";
const LEGACY_QUOTE_ID = "sendcloud:27227";
const V3_CODE = "inpost_gb:lockertoaddress/dropoff";
const CONTRACT_ID = "40353";

const ORDER_1_PAYLOAD = {
  externalQuoteId: LEGACY_QUOTE_ID,
  v2MethodId: 27227,
  shippingOptionCode: V3_CODE,
  contractId: CONTRACT_ID,
  quoteApiVersion: "v2+v3" as const,
};

function hydrateOrder1Quote(
  payload: unknown = ORDER_1_PAYLOAD,
  rowId = ORDER_1_QUOTE_ROW_ID,
): ShippingQuote {
  return shippingQuoteFromPayloadRow({
    id: rowId,
    providerId: "sendcloud",
    carrier: "InPost",
    serviceName: "InPost Locker to Address",
    pricePence: 320,
    currency: "GBP",
    estimatedDaysMin: 2,
    estimatedDaysMax: 2,
    recommended: null,
    expiresAt: null,
    quotePayload: payload,
  });
}

function ownerParcel(): ShipmentParcel {
  return {
    id: "25db6cb8-8593-4f94-9ec0-b57e3460b0d7",
    shippingRecordId: "c039191c-45a5-49d2-a125-7e9155acf0e3",
    parcelNumber: 1,
    totalParcels: 1,
    weightKg: 2,
    /** Sendcloud-derived Small envelope (size=s): 45×35×16 — never 45×10×10. */
    dimensions: { lengthCm: 45, widthCm: 35, heightCm: 16 },
    carrier: null,
    shippingService: null,
    trackingNumber: null,
    trackingUrl: null,
    status: "preparing",
    productItemIds: [],
    insuranceEnabled: false,
    insuranceValueGbp: null,
    operation: null,
    estimatedDeliveryAt: null,
    label: null,
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  };
}

const announceSendcloudShipmentV3 = vi.fn();

vi.mock("@/lib/shipping/env", () => ({
  isSendcloudConfigured: () => true,
  getSendcloudCredentials: () => ({ publicKey: "test", secretKey: "test" }),
}));

vi.mock("@/lib/shipping/sendcloud/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/shipping/sendcloud/client")>(
    "@/lib/shipping/sendcloud/client",
  );
  return {
    ...actual,
    announceSendcloudShipmentV3: (...args: unknown[]) => announceSendcloudShipmentV3(...args),
    getSendcloudParcel: vi.fn(),
  };
});

describe("P8.5 production label path", () => {
  beforeEach(() => {
    announceSendcloudShipmentV3.mockReset();
  });

  it("A — real-order selected quote resolves to V3 identity", () => {
    const selected = resolveSelectedShippingQuoteForLabel(
      [hydrateOrder1Quote()],
      LEGACY_QUOTE_ID,
    );
    expect(selected?.id).toBe(LEGACY_QUOTE_ID);
    expect(selected?.shippingOptionCode).toBe(V3_CODE);
    expect(selected?.contractId).toBe(CONTRACT_ID);
    expect(selected?.v2MethodId).toBe(27227);
  });

  it("B — row UUID vs externalQuoteId hydration resolves without losing V3", () => {
    const hydrated = hydrateOrder1Quote();
    expect(hydrated.id).toBe(LEGACY_QUOTE_ID);
    expect(hydrated.quoteRowId).toBe(ORDER_1_QUOTE_ROW_ID);
    const distractor: ShippingQuote = {
      id: "sendcloud:11111",
      quoteRowId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      providerId: "sendcloud",
      carrier: "Other",
      serviceName: "Other",
      pricePence: 100,
      currency: "GBP",
      estimatedDays: { min: 1, max: 2 },
      shippingOptionCode: "royal_mailv2:something",
      v2MethodId: 11111,
      quoteApiVersion: "v2+v3",
    };
    const selected = resolveSelectedShippingQuoteForLabel(
      [distractor, hydrated],
      ORDER_1_QUOTE_ROW_ID,
    );
    expect(selected?.id).toBe(LEGACY_QUOTE_ID);
    expect(selected?.shippingOptionCode).toBe(V3_CODE);
    expect(selected?.contractId).toBe(CONTRACT_ID);
  });

  it("C — V3 shippingOptionCode survives hydrate → resolve", () => {
    const selected = resolveSelectedShippingQuoteForLabel(
      [hydrateOrder1Quote()],
      ORDER_1_QUOTE_ROW_ID,
    );
    expect(selected?.shippingOptionCode).toBe(V3_CODE);
  });

  it("D — contractId survives numeric/string payload normalization", () => {
    expect(hydrateOrder1Quote({ ...ORDER_1_PAYLOAD, contractId: 40353 }).contractId).toBe(
      CONTRACT_ID,
    );
    const coerced = coerceShippingQuotePayload({
      external_quote_id: LEGACY_QUOTE_ID,
      v2_method_id: 27227,
      shipping_option_code: V3_CODE,
      contract_id: 40353,
    });
    expect(coerced?.contractId).toBe(CONTRACT_ID);
    expect(hydrateOrder1Quote(coerced).contractId).toBe(CONTRACT_ID);
  });

  it("E — canonical Sendcloud Small envelope survives resolveCompleteParcelMeasurements", () => {
    const parcel = ownerParcel();
    const resolved = resolveCompleteParcelMeasurements({
      weightKg: parcel.weightKg,
      dimensions: parcel.dimensions,
    });
    expect(resolved).toEqual({
      weightKg: 2,
      lengthCm: 45,
      widthCm: 35,
      heightCm: 16,
    });
    const use = resolveShipmentParcelForLabel({
      shippingRecordId: parcel.shippingRecordId,
      loadedExplicitParcel: null,
      orderParcels: [parcel],
    });
    expect(use).toEqual({ status: "use", parcel });
  });

  it("F — missing quote fails closed (no quotes[0], no invent)", () => {
    const hydrated = hydrateOrder1Quote();
    expect(resolveSelectedShippingQuoteForLabel([], LEGACY_QUOTE_ID)).toBeNull();
    expect(resolveSelectedShippingQuoteForLabel(null, LEGACY_QUOTE_ID)).toBeNull();
    expect(resolveSelectedShippingQuoteForLabel([hydrated], null)).toBeNull();
    expect(resolveSelectedShippingQuoteForLabel([hydrated], undefined)).toBeNull();
    expect(
      resolveSelectedShippingQuoteForLabel(
        [hydrated],
        "00000000-0000-4000-8000-000000000099",
      ),
    ).toBeNull();
  });

  it("G — missing parcel measurements fail closed", () => {
    expect(
      resolveCompleteParcelMeasurements({ weightKg: null, dimensions: null }),
    ).toBeNull();
    expect(PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL.length).toBeGreaterThan(10);
  });

  it("H — no blind quotes[0] fallback in production resolve/label path", () => {
    const resolveSrc = read("lib/shipping/selected-shipping-quote-contract-v1.ts");
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const fn = resolveSrc.slice(
      resolveSrc.indexOf("export function resolveSelectedShippingQuoteForLabel"),
      resolveSrc.indexOf("export function retainCheckoutSelectedQuoteId"),
    );
    expect(fn).not.toContain("quotes[0]");
    expect(fn).not.toMatch(/return quotes\[0\]/);
    expect(labelGen).not.toMatch(
      /selectedQuoteId\s*\?\?\s*record\?\.pricing\?\.quotes\[0\]/,
    );
    expect(labelGen).toContain("No shipping quote selected for this order.");
    expect(labelGen).toContain(
      "Selected shipping quote could not be resolved for this order.",
    );
    expect(labelGen).toContain("appendAndSelectShippingQuoteWithoutReplacing");
    expect(labelGen).toContain("buildLegacyBridgeShippingQuote");
  });

  it("I/J — announce payload uses selected V3 option + InPost phone contract + success yields usable label", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: "ship-1",
      parcelId: 99123,
      trackingNumber: "TRACKP85",
      pdfUrl: "https://example.test/label.pdf",
      carrierCode: "inpost_gb",
      serviceName: V3_CODE,
      reusedExisting: false,
    });

    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: LEGACY_QUOTE_ID,
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 35,
      heightCm: 16,
      deliveryAddress: {
        role: "delivery",
        fullName: "Buyer",
        line1: "10 High Street",
        city: "London",
        postcode: "E1 6AN",
        country: "GB",
        phone: "+447438969272",
        validated: true,
      },
      collectionAddress: {
        role: "collection",
        fullName: "Seller",
        line1: "1 Demo Street",
        city: "Walsall",
        postcode: "WS2 9RD",
        country: "GB",
        phone: "+447389890958",
        validated: true,
      },
      orderNumber: "RVX8343A7C7",
      shippingOptionCode: V3_CODE,
      contractId: CONTRACT_ID,
      v2MethodId: 27227,
      idempotencyKey: "rovexo-order-test-parcel-1",
    });

    expect(announceSendcloudShipmentV3).toHaveBeenCalledTimes(1);
    const payload = announceSendcloudShipmentV3.mock.calls[0]![0] as {
      ship_with: {
        type: string;
        properties: { shipping_option_code: string; contract_id?: number };
      };
      from_address: { phone_number?: string };
      to_address: { phone_number?: string; postal_code: string };
      parcels: Array<{
        weight: { value: string; unit: string };
        dimensions: { length: string; width: string; height: string; unit: string };
      }>;
    };
    expect(payload.ship_with.type).toBe("shipping_option_code");
    expect(payload.ship_with.properties.shipping_option_code).toBe(V3_CODE);
    expect(payload.ship_with.properties.contract_id).toBe(40353);
    expect(payload.to_address.phone_number).toBe("07438969272");
    expect(payload.from_address.phone_number).toBeUndefined();
    expect("phone_number" in payload.from_address).toBe(false);
    expect(payload.to_address.postal_code).toBe("E16AN");
    expect(payload.parcels[0]?.weight).toEqual({ value: "2.000", unit: "kg" });
    expect(payload.parcels[0]?.dimensions).toEqual({
      length: "45",
      width: "35",
      height: "16",
      unit: "cm",
    });

    expect(result.trackingNumber).toBe("TRACKP85");
    expect(result.pdfUrl).toBe("https://example.test/label.pdf");
    expect(result.parcelId).toBe(99123);
  });

  it("Order 2 untouched by P8.5 production sources", () => {
    for (const rel of [
      "lib/shipping/label-generation.server.ts",
      "lib/shipping/selected-shipping-quote-contract-v1.ts",
      "lib/shipping/sendcloud/v3-catalog-parsers-v1.ts",
    ]) {
      const src = read(rel);
      expect(src).not.toContain("50a8b313-1fd3-4104-8af5-725a84a3350e");
      expect(src).not.toContain("RVXC75CA5BB");
    }
  });
});
