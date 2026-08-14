/**
 * COD SÂNGE — EVRi FIRST label engine certification.
 * Real Sendcloud codes only: hermes_c2c_gb:a2a/pickup + contract 38704.
 * No live announce (Owner EVRi order required for production live call).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EVRI_LABEL_ENGINE_CERTIFICATION_V1,
  isEvriSendcloudShippingOptionCode,
} from "@/lib/shipping/sendcloud/evri-label-engine-certification-v1";
import {
  extractSendcloudV3AnnounceFailure,
  parseSendcloudV3AnnounceShipmentResult,
  selectRouteAwareV3OptionForCompatMapping,
  shippingQuoteFromPayloadRow,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { resolveSelectedShippingQuoteForLabel } from "@/lib/shipping/selected-shipping-quote-contract-v1";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import type { ShippingQuote } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const V3_CODE = EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalShippingOptionCode;
const CONTRACT_ID = EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId;
const METHOD_ID = EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalV2MethodId;
const LEGACY_QUOTE_ID = `sendcloud:${METHOD_ID}`;
const QUOTE_ROW_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

const announceSendcloudShipmentV3 = vi.fn();
const getSendcloudParcel = vi.fn();

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
    getSendcloudParcel: (...args: unknown[]) => getSendcloudParcel(...args),
  };
});

function hydrateEvriQuote(overrides?: Record<string, unknown>): ShippingQuote {
  return shippingQuoteFromPayloadRow({
    id: QUOTE_ROW_ID,
    providerId: "sendcloud",
    carrier: "Evri",
    serviceName: "Evri C2C Address to Address Standard Delivery",
    pricePence: 483,
    currency: "GBP",
    estimatedDaysMin: 2,
    estimatedDaysMax: 3,
    recommended: null,
    expiresAt: null,
    quotePayload: {
      externalQuoteId: LEGACY_QUOTE_ID,
      v2MethodId: METHOD_ID,
      shippingOptionCode: V3_CODE,
      contractId: CONTRACT_ID,
      quoteApiVersion: "v2+v3",
      ...overrides,
    },
  });
}

const addrs = {
  deliveryAddress: {
    role: "delivery" as const,
    fullName: "Buyer EVRi",
    line1: "10 High Street",
    city: "London",
    postcode: "E1 6AN",
    country: "GB",
    phone: "+447700900123",
    email: "buyer@example.test",
    validated: true,
  },
  collectionAddress: {
    role: "collection" as const,
    fullName: "Seller EVRi",
    line1: "1 Demo Street",
    city: "Walsall",
    postcode: "WS2 9RD",
    country: "GB",
    phone: "+447700900456",
    email: "seller@example.test",
    validated: true,
  },
};

describe("COD SÂNGE — EVRi label engine certification", () => {
  beforeEach(() => {
    announceSendcloudShipmentV3.mockReset();
    getSendcloudParcel.mockReset();
  });

  it("locks real Sendcloud EVRi identity (not fake evri:standard)", () => {
    expect(V3_CODE).toBe("hermes_c2c_gb:a2a/pickup");
    expect(CONTRACT_ID).toBe("38704");
    expect(isEvriSendcloudShippingOptionCode(V3_CODE)).toBe(true);
    expect(isEvriSendcloudShippingOptionCode("inpost_gb:lockertoaddress/dropoff")).toBe(
      false,
    );
    expect(read("lib/shipping/sendcloud/evri-label-engine-certification-v1.ts")).toContain(
      "38704",
    );
  });

  it("selected quote resolve preserves EVRi V3 code + contract", () => {
    const selected = resolveSelectedShippingQuoteForLabel(
      [hydrateEvriQuote()],
      LEGACY_QUOTE_ID,
    );
    expect(selected?.id).toBe(LEGACY_QUOTE_ID);
    expect(selected?.shippingOptionCode).toBe(V3_CODE);
    expect(selected?.contractId).toBe(CONTRACT_ID);
    expect(selected?.v2MethodId).toBe(METHOD_ID);
  });

  it("route-aware gate selects exact hermes code + contract — never substitutes InPost", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: METHOD_ID,
      compatShippingOptionCode: V3_CODE,
      availableOptions: [
        {
          shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
          contractId: "40353",
        },
        { shippingOptionCode: V3_CODE, contractId: CONTRACT_ID },
      ],
    });
    expect(selection.status).toBe("ROUTE_AWARE_SELECTED");
    expect(selection.shippingOptionCode).toBe(V3_CODE);
    expect(selection.contractId).toBe(CONTRACT_ID);
  });

  it("fail-closed when EVRi contract_id missing", async () => {
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: LEGACY_QUOTE_ID,
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        ...addrs,
        orderNumber: "RVX-EVRI-CERT-1",
        shippingOptionCode: V3_CODE,
        contractId: null,
        v2MethodId: METHOD_ID,
      }),
    ).rejects.toMatchObject({
      code: "label_failed",
      details: { reason: "EVRI_CONTRACT_ID_REQUIRED" },
    } satisfies Partial<SendcloudError>);
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("announce payload uses EVRi code + contract 38704 and keeps sender phone", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: "evri-ship-1",
      parcelId: 88001,
      trackingNumber: null,
      pdfUrl: null,
      carrierCode: "hermes_c2c_gb",
      serviceName: V3_CODE,
      reusedExisting: false,
    });
    getSendcloudParcel.mockResolvedValue({
      id: 88001,
      tracking_number: "H00EVRICTRACK1",
      carrier: { code: "hermes_c2c_gb" },
      shipment: { id: 99, name: V3_CODE },
      label: { normal_printer: ["https://example.test/evri-label.pdf"] },
    });

    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: LEGACY_QUOTE_ID,
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      ...addrs,
      orderNumber: "RVX-EVRI-CERT-1",
      shippingOptionCode: V3_CODE,
      contractId: CONTRACT_ID,
      v2MethodId: METHOD_ID,
      idempotencyKey: "rovexo-evri-cert-parcel-1",
    });

    expect(announceSendcloudShipmentV3).toHaveBeenCalledTimes(1);
    const payload = announceSendcloudShipmentV3.mock.calls[0]![0] as {
      ship_with: {
        properties: { shipping_option_code: string; contract_id?: number };
      };
      from_address: { phone_number?: string; postal_code: string };
      to_address: { phone_number?: string; postal_code: string };
      parcels: Array<{
        weight: { value: string };
        dimensions: { length: string; width: string; height: string };
      }>;
    };
    expect(payload.ship_with.properties.shipping_option_code).toBe(V3_CODE);
    expect(payload.ship_with.properties.contract_id).toBe(38704);
    expect(payload.from_address.phone_number).toBeTruthy();
    expect(payload.to_address.phone_number).toBeTruthy();
    expect(payload.from_address.postal_code).toBe("WS29RD");
    expect(payload.to_address.postal_code).toBe("E16AN");
    expect(payload.parcels[0]?.weight.value).toBe("2.000");
    expect(payload.parcels[0]?.dimensions).toEqual({
      length: "45",
      width: "10",
      height: "10",
      unit: "cm",
    });

    // P8.6: parcelId success; tracking/label may hydrate async.
    expect(result.parcelId).toBe(88001);
    expect(result.trackingNumber).toBe("H00EVRICTRACK1");
    expect(result.pdfUrl).toBe("https://example.test/evri-label.pdf");
    expect(result.shipmentId).toBe("evri-ship-1");
  });

  it("reuses existing provider parcel — no second announce", async () => {
    getSendcloudParcel.mockResolvedValue({
      id: 88001,
      tracking_number: "H00EXISTING",
      carrier: { code: "hermes_c2c_gb" },
      shipment: { id: 42, name: V3_CODE },
      label: { normal_printer: ["https://example.test/existing-evri.pdf"] },
    });
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: LEGACY_QUOTE_ID,
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      ...addrs,
      orderNumber: "RVX-EVRI-CERT-1",
      shippingOptionCode: V3_CODE,
      contractId: CONTRACT_ID,
      v2MethodId: METHOD_ID,
      existingProviderParcelId: 88001,
    });
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
    expect(result.reusedExisting).toBe(true);
    expect(result.parcelId).toBe(88001);
    expect(result.trackingNumber).toBe("H00EXISTING");
  });

  it("Announcement Failed / errors[] never treated as success", () => {
    const failure = extractSendcloudV3AnnounceFailure({
      data: {
        id: "ship-fail",
        parcels: [{ id: 1, status: { id: 1002, message: "Announcement Failed" } }],
        errors: [{ detail: "Carrier rejected EVRi announce" }],
      },
    });
    expect(failure?.message).toContain("Carrier rejected EVRi announce");
    const parsed = parseSendcloudV3AnnounceShipmentResult({
      data: {
        id: "ship-ok",
        parcels: [
          {
            id: 88002,
            tracking_number: null,
            documents: [],
          },
        ],
      },
    });
    expect(parsed.parcelId).toBe(88002);
    expect(parsed.trackingNumber).toBeNull();
  });

  it("InPost rules remain carrier-scoped (no EVRi phone normalize / sender omit)", () => {
    const serviceSrc = read("lib/shipping/sendcloud/service.ts");
    expect(serviceSrc).toContain("EVRI_CONTRACT_ID_REQUIRED");
    expect(serviceSrc).toContain("isEvriSendcloudShippingOptionCode");
    expect(serviceSrc).toContain("normalizeInPostGbPhoneForSendcloudAnnounce");
    // InPost-only sender omit stays behind isInPostGb.
    expect(serviceSrc).toMatch(/isInPostGb[\s\S]*\? \{\}[\s\S]*: \{ phone_number:/);
  });

  it("MARKUP_10P not present in EVRi cert / announce path", () => {
    for (const rel of [
      "lib/shipping/sendcloud/service.ts",
      "lib/shipping/sendcloud/evri-label-engine-certification-v1.ts",
      "lib/shipping/pricing/sendcloud-mappers.ts",
    ]) {
      const src = read(rel);
      expect(src).not.toMatch(/0\.10|10p|MARKUP_10P|shippingMarkup/i);
    }
  });
});
