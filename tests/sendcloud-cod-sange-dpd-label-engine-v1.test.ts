/**
 * COD SÂNGE — DPD UK (dpd_gb) technical certification V1.
 * Live-proven codes: dpd_gb:classic · dpd_gb:classic/delivery_deadline=twodays · contract 19001.
 * NON-BILLABLE ONLY — live announce BLOCKED_BY_BILLING_SAFETY.
 * EVRi + Royal Mail regression: codes/contract gates unchanged.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EVRI_LABEL_ENGINE_CERTIFICATION_V1,
  isEvriSendcloudShippingOptionCode,
} from "@/lib/shipping/sendcloud/evri-label-engine-certification-v1";
import {
  ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1,
  isRoyalMailSendcloudShippingOptionCode,
} from "@/lib/shipping/sendcloud/royal-mail-label-engine-certification-v1";
import {
  DPD_LABEL_ENGINE_CERTIFICATION_V1,
  assertDpdBillingSafetyBlocksLiveAnnounce,
  isCertifiedDpdV1HomeDeliveryOptionCode,
  isDpdSendcloudShippingOptionCode,
  isDpdServicePointOptionCode,
  isValidDpdLabelPdfBytes,
} from "@/lib/shipping/sendcloud/dpd-label-engine-certification-v1";
import {
  extractSendcloudV3AnnounceFailure,
  parseSendcloudV3AnnounceShipmentResult,
  selectRouteAwareV3OptionForCompatMapping,
  shippingQuoteFromPayloadRow,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { resolveSelectedShippingQuoteForLabel } from "@/lib/shipping/selected-shipping-quote-contract-v1";
import {
  extractSendcloudLabelUrl,
  isUsableSendcloudLabelUrl,
} from "@/lib/shipping/pricing/sendcloud-mappers";
import { mapSendcloudTrackingStatus } from "@/lib/shipping/sendcloud/status-mapper";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import type { ShippingQuote } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const DPD = DPD_LABEL_ENGINE_CERTIFICATION_V1;
const NEXT = DPD.nextDayClassic;
const TWO = DPD.twoDayClassic;
const CONTRACT_ID = DPD.canonicalContractId;
const QUOTE_ROW_ID = "cccccccc-dddd-4eee-8fff-000000000001";

const announceSendcloudShipmentV3 = vi.fn();
const getSendcloudParcel = vi.fn();
const getSendcloudTracking = vi.fn();
const cancelSendcloudParcel = vi.fn();

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
    getSendcloudTracking: (...args: unknown[]) => getSendcloudTracking(...args),
    cancelSendcloudParcel: (...args: unknown[]) => cancelSendcloudParcel(...args),
  };
});

function hydrateDpdQuote(
  option: typeof NEXT | typeof TWO,
  overrides?: Record<string, unknown>,
): ShippingQuote {
  return shippingQuoteFromPayloadRow({
    id: QUOTE_ROW_ID,
    providerId: "sendcloud",
    carrier: "DPD",
    serviceName: option.serviceName,
    pricePence: Math.round(Number(option.observedQuoteGbp) * 100),
    currency: "GBP",
    estimatedDaysMin: option === NEXT ? 1 : 2,
    estimatedDaysMax: option === NEXT ? 1 : 2,
    recommended: null,
    expiresAt: null,
    quotePayload: {
      externalQuoteId: `sendcloud:${option.v2MethodId}`,
      v2MethodId: option.v2MethodId,
      shippingOptionCode: option.shippingOptionCode,
      contractId: CONTRACT_ID,
      quoteApiVersion: "v2+v3",
      ...overrides,
    },
  });
}

const addrs = {
  deliveryAddress: {
    role: "delivery" as const,
    fullName: "Buyer DPD",
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
    fullName: "Seller DPD",
    line1: "1 Demo Street",
    city: "Walsall",
    postcode: "WS2 9RD",
    country: "GB",
    phone: "+447700900456",
    email: "seller@example.test",
    validated: true,
  },
};

describe("COD SÂNGE — DPD label engine certification V1 (non-billable)", () => {
  beforeEach(() => {
    announceSendcloudShipmentV3.mockReset();
    getSendcloudParcel.mockReset();
    getSendcloudTracking.mockReset();
    cancelSendcloudParcel.mockReset();
  });

  it("billing-safety — BILLABLE_LABEL_CREATED=NO and ANNOUNCE_LIVE_TEST blocked", () => {
    const gate = assertDpdBillingSafetyBlocksLiveAnnounce();
    expect(gate.BILLABLE_LABEL_CREATED).toBe(false);
    expect(gate.ANNOUNCE_LIVE_TEST).toBe("BLOCKED_BY_BILLING_SAFETY");
    expect(DPD.nonBillableLiveEvidence.liveLabelCertified).toBe(false);
    // Certification SSOT must not authorize live announce
    expect(read("lib/shipping/sendcloud/dpd-label-engine-certification-v1.ts")).toContain(
      "BLOCKED_BY_BILLING_SAFETY",
    );
    expect(read("lib/shipping/sendcloud/dpd-label-engine-certification-v1.ts")).not.toContain(
      "LIVE_ANNOUNCE_AUTHORIZED=YES",
    );
  });

  it("carrier resolution locks dpd_gb", () => {
    expect(DPD.sendcloudCarrierCode).toBe("dpd_gb");
    expect(isDpdSendcloudShippingOptionCode(NEXT.shippingOptionCode)).toBe(true);
    expect(isDpdSendcloudShippingOptionCode("hermes_c2c_gb:a2a/pickup")).toBe(false);
    expect(isDpdSendcloudShippingOptionCode("royal_mailv2:tracked_24/size=s")).toBe(false);
  });

  it("service resolution — certified Next Day + Two Day only", () => {
    expect(NEXT.shippingOptionCode).toBe("dpd_gb:classic");
    expect(TWO.shippingOptionCode).toBe("dpd_gb:classic/delivery_deadline=twodays");
    expect(isCertifiedDpdV1HomeDeliveryOptionCode(NEXT.shippingOptionCode)).toBe(true);
    expect(isCertifiedDpdV1HomeDeliveryOptionCode(TWO.shippingOptionCode)).toBe(true);
    expect(
      isCertifiedDpdV1HomeDeliveryOptionCode("dpd_gb:classic/last_mile=service_point,kg"),
    ).toBe(false);
    expect(isDpdServicePointOptionCode("dpd_gb:classic/last_mile=service_point,kg")).toBe(
      true,
    );
  });

  it("contract resolution locks broker 19001", () => {
    expect(CONTRACT_ID).toBe("19001");
    expect(DPD.announceRequiresContractId).toBe(true);
    expect(DPD.directContractOnly).toBe(false);
    expect(DPD.sendcloudPrenegotiated).toBe(true);
  });

  it("route GB→GB — exact option selection never substitutes EVRi/RM", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: NEXT.v2MethodId,
      compatShippingOptionCode: NEXT.shippingOptionCode,
      availableOptions: [
        {
          shippingOptionCode: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalShippingOptionCode,
          contractId: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId,
        },
        {
          shippingOptionCode:
            ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked24.shippingOptionCode,
          contractId: ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId,
        },
        { shippingOptionCode: NEXT.shippingOptionCode, contractId: CONTRACT_ID },
      ],
    });
    expect(selection.status).toBe("ROUTE_AWARE_SELECTED");
    expect(selection.shippingOptionCode).toBe(NEXT.shippingOptionCode);
    expect(selection.contractId).toBe(CONTRACT_ID);
  });

  it("valid shipment payload — mocked announce uses DPD code + contract 19001", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: "dpd-ship-1",
      parcelId: 77001,
      trackingNumber: null,
      pdfUrl: null,
      carrierCode: "dpd_gb",
      serviceName: NEXT.shippingOptionCode,
      reusedExisting: false,
    });
    getSendcloudParcel.mockResolvedValue({
      id: 77001,
      tracking_number: "15501234567890",
      carrier: { code: "dpd_gb" },
      shipment: { id: 1, name: NEXT.shippingOptionCode },
      label: { normal_printer: ["https://example.test/dpd-label.pdf"] },
    });
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: `sendcloud:${NEXT.v2MethodId}`,
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      ...addrs,
      orderNumber: "RVX-DPD-CERT-1",
      shippingOptionCode: NEXT.shippingOptionCode,
      contractId: CONTRACT_ID,
      v2MethodId: NEXT.v2MethodId,
    });
    expect(announceSendcloudShipmentV3).toHaveBeenCalledTimes(1);
    const payload = announceSendcloudShipmentV3.mock.calls[0]![0] as {
      ship_with: {
        properties: { shipping_option_code: string; contract_id?: number };
      };
      from_address: { postal_code: string; country_code: string };
      to_address: { postal_code: string; country_code: string };
      label_details: { mime_type: string };
    };
    expect(payload.ship_with.properties.shipping_option_code).toBe(NEXT.shippingOptionCode);
    expect(payload.ship_with.properties.contract_id).toBe(19001);
    expect(payload.from_address.country_code).toBe("GB");
    expect(payload.to_address.country_code).toBe("GB");
    expect(payload.label_details.mime_type).toBe("application/pdf");
    expect(result.parcelId).toBe(77001);
    expect(result.trackingNumber).toBe("15501234567890");
  });

  it("invalid payload rejection — missing contract_id / missing option code", async () => {
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: `sendcloud:${NEXT.v2MethodId}`,
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        ...addrs,
        orderNumber: "RVX-DPD-CERT-BAD",
        shippingOptionCode: NEXT.shippingOptionCode,
        contractId: null,
        v2MethodId: NEXT.v2MethodId,
      }),
    ).rejects.toMatchObject({
      details: { reason: "DPD_CONTRACT_ID_REQUIRED" },
    } satisfies Partial<SendcloudError>);
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();

    await expect(
      SendcloudService.generateLabel({
        quoteId: `sendcloud:${NEXT.v2MethodId}`,
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        ...addrs,
        orderNumber: "RVX-DPD-CERT-BAD2",
        shippingOptionCode: null,
        contractId: CONTRACT_ID,
        v2MethodId: NEXT.v2MethodId,
      }),
    ).rejects.toMatchObject({
      details: { reason: "NO_V3_SHIPPING_OPTION_CODE" },
    } satisfies Partial<SendcloudError>);
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("announce readiness — quote preserves V3 code + contract; Two Day exact", () => {
    const selected = resolveSelectedShippingQuoteForLabel(
      [hydrateDpdQuote(TWO)],
      `sendcloud:${TWO.v2MethodId}`,
    );
    expect(selected?.shippingOptionCode).toBe(TWO.shippingOptionCode);
    expect(selected?.contractId).toBe(CONTRACT_ID);
    expect(selected?.v2MethodId).toBe(2901);
  });

  it("label pipeline fixture — PDF magic vs error-as-PDF", () => {
    const parcelFixture = {
      id: 77001,
      tracking_number: "15501234567890",
      carrier: { code: "dpd_gb" },
      shipment: { id: 1, name: NEXT.shippingOptionCode },
      label: { normal_printer: ["https://panel.sendcloud.sc/api/v2/labels/label_dpd.pdf"] },
    };
    const pdfUrl = extractSendcloudLabelUrl(parcelFixture, "thermal_4x6");
    expect(isUsableSendcloudLabelUrl(pdfUrl)).toBe(true);
    expect(isValidDpdLabelPdfBytes(new TextEncoder().encode("%PDF-1.4\n%DPD\n"))).toBe(
      true,
    );
    expect(
      isValidDpdLabelPdfBytes(
        new TextEncoder().encode('{"error":"validation_error"}'),
      ),
    ).toBe(false);
  });

  it("tracking pipeline — getTracking via canonical Sendcloud path", async () => {
    getSendcloudTracking.mockResolvedValue({
      id: 77001,
      tracking_number: "15501234567890",
      status: { id: 3, message: "In transit" },
      carrier: { code: "dpd_gb" },
    });
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const tracking = await SendcloudService.getTracking("15501234567890");
    expect(getSendcloudTracking).toHaveBeenCalledWith("15501234567890");
    expect(tracking.status).toBe(mapSendcloudTrackingStatus("In transit"));
  });

  it("cancellation pipeline — cancelParcel → /parcels/{id}/cancel", async () => {
    cancelSendcloudParcel.mockResolvedValue(undefined);
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await SendcloudService.cancelParcel(77001);
    expect(cancelSendcloudParcel).toHaveBeenCalledWith(77001);
  });

  it("no billable label creation — mocked announce only; live gate blocked", () => {
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
    const gate = assertDpdBillingSafetyBlocksLiveAnnounce();
    expect(gate.BILLABLE_LABEL_CREATED).toBe(false);
    // Failure path must never be treated as success
    const failure = extractSendcloudV3AnnounceFailure({
      data: {
        id: "ship-fail",
        parcels: [{ id: 1, status: { id: 1002, message: "Announcement Failed" } }],
        errors: [{ detail: "Carrier rejected DPD announce" }],
      },
    });
    expect(failure?.message).toContain("Carrier rejected DPD announce");
    const parsed = parseSendcloudV3AnnounceShipmentResult({
      data: {
        id: "ship-ok",
        parcels: [{ id: 77002, tracking_number: null, documents: [] }],
      },
    });
    expect(parsed.parcelId).toBe(77002);
  });

  it("EVRi regression — hermes codes + contract gate unchanged", async () => {
    expect(EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalShippingOptionCode).toBe(
      "hermes_c2c_gb:a2a/pickup",
    );
    expect(EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId).toBe("38704");
    expect(isEvriSendcloudShippingOptionCode(NEXT.shippingOptionCode)).toBe(false);
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: `sendcloud:${EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalV2MethodId}`,
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        ...addrs,
        orderNumber: "RVX-EVRI-FROM-DPD",
        shippingOptionCode: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalShippingOptionCode,
        contractId: null,
        v2MethodId: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalV2MethodId,
      }),
    ).rejects.toMatchObject({ details: { reason: "EVRI_CONTRACT_ID_REQUIRED" } });
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("Royal Mail regression — royal_mailv2 codes + contract gate unchanged", async () => {
    const rm = ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked24;
    expect(rm.shippingOptionCode).toBe("royal_mailv2:tracked_24/size=s");
    expect(ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId).toBe("116816");
    expect(isRoyalMailSendcloudShippingOptionCode(NEXT.shippingOptionCode)).toBe(false);
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: `sendcloud:${rm.v2MethodId}`,
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        ...addrs,
        orderNumber: "RVX-RM-FROM-DPD",
        shippingOptionCode: rm.shippingOptionCode,
        contractId: null,
        v2MethodId: rm.v2MethodId,
      }),
    ).rejects.toMatchObject({ details: { reason: "ROYAL_MAIL_CONTRACT_ID_REQUIRED" } });
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });
});
