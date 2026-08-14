/**
 * COD SÂNGE — InPost GB (inpost_gb) technical certification V1.
 * Live-proven: inpost_gb:lockertoaddress/dropoff · contract 40353.
 * NON-BILLABLE ONLY — live announce BLOCKED_BY_BILLING_SAFETY.
 * Locker/PUDO options catalog-verified but OUT OF SCOPE (Service Point Gate 0).
 * EVRi + Royal Mail + DPD regression unchanged.
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
  isDpdSendcloudShippingOptionCode,
} from "@/lib/shipping/sendcloud/dpd-label-engine-certification-v1";
import {
  INPOST_LABEL_ENGINE_CERTIFICATION_V1,
  assertInpostBillingSafetyBlocksLiveAnnounce,
  isCertifiedInpostV1HomeDeliveryOptionCode,
  isInpostSendcloudShippingOptionCode,
  isInpostServicePointOptionCode,
  isValidInpostLabelPdfBytes,
} from "@/lib/shipping/sendcloud/inpost-label-engine-certification-v1";
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

const IP = INPOST_LABEL_ENGINE_CERTIFICATION_V1;
const L2A = IP.lockerToAddress;
const CONTRACT_ID = IP.canonicalContractId;
const QUOTE_ROW_ID = "dddddddd-eeee-4fff-8111-222222222222";

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

function hydrateInpostQuote(overrides?: Record<string, unknown>): ShippingQuote {
  return shippingQuoteFromPayloadRow({
    id: QUOTE_ROW_ID,
    providerId: "sendcloud",
    carrier: "InPost",
    serviceName: L2A.serviceName,
    pricePence: Math.round(Number(L2A.observedQuoteGbp) * 100),
    currency: "GBP",
    estimatedDaysMin: 2,
    estimatedDaysMax: 2,
    recommended: null,
    expiresAt: null,
    quotePayload: {
      externalQuoteId: `sendcloud:${L2A.v2MethodId}`,
      v2MethodId: L2A.v2MethodId,
      shippingOptionCode: L2A.shippingOptionCode,
      contractId: CONTRACT_ID,
      quoteApiVersion: "v2+v3",
      ...overrides,
    },
  });
}

const addrs = {
  deliveryAddress: {
    role: "delivery" as const,
    fullName: "Buyer InPost",
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
    fullName: "Seller InPost",
    line1: "1 Demo Street",
    city: "Walsall",
    postcode: "WS2 9RD",
    country: "GB",
    phone: "+447700900456",
    email: "seller@example.test",
    validated: true,
  },
};

describe("COD SÂNGE — InPost label engine certification V1 (non-billable)", () => {
  beforeEach(() => {
    announceSendcloudShipmentV3.mockReset();
    getSendcloudParcel.mockReset();
    getSendcloudTracking.mockReset();
    cancelSendcloudParcel.mockReset();
  });

  it("billing-safety — BILLABLE_LABEL_CREATED=NO and ANNOUNCE_LIVE_TEST blocked", () => {
    const gate = assertInpostBillingSafetyBlocksLiveAnnounce();
    expect(gate.BILLABLE_LABEL_CREATED).toBe(false);
    expect(gate.ANNOUNCE_LIVE_TEST).toBe("BLOCKED_BY_BILLING_SAFETY");
    expect(IP.nonBillableLiveEvidence.liveLabelCertified).toBe(false);
    expect(read("lib/shipping/sendcloud/inpost-label-engine-certification-v1.ts")).toContain(
      "BLOCKED_BY_BILLING_SAFETY",
    );
    expect(read("lib/shipping/sendcloud/inpost-label-engine-certification-v1.ts")).not.toContain(
      "LIVE_ANNOUNCE_AUTHORIZED=YES",
    );
  });

  it("carrier resolution locks inpost_gb", () => {
    expect(IP.sendcloudCarrierCode).toBe("inpost_gb");
    expect(isInpostSendcloudShippingOptionCode(L2A.shippingOptionCode)).toBe(true);
    expect(isInpostSendcloudShippingOptionCode("hermes_c2c_gb:a2a/pickup")).toBe(false);
    expect(isInpostSendcloudShippingOptionCode("dpd_gb:classic")).toBe(false);
  });

  it("service resolution — Locker→Address home delivery only; SP options out of scope", () => {
    expect(L2A.shippingOptionCode).toBe("inpost_gb:lockertoaddress/dropoff");
    expect(L2A.destinationType).toBe("home_address");
    expect(L2A.lastMile).toBe("home_delivery");
    expect(L2A.servicePointRequired).toBe(false);
    expect(isCertifiedInpostV1HomeDeliveryOptionCode(L2A.shippingOptionCode)).toBe(true);
    expect(isCertifiedInpostV1HomeDeliveryOptionCode("inpost_gb:l2l/size=m")).toBe(false);
    expect(isInpostServicePointOptionCode("inpost_gb:l2l/size=m")).toBe(true);
    expect(isInpostServicePointOptionCode("inpost_gb:addresstolocker/pickup")).toBe(true);
    expect(isInpostServicePointOptionCode(L2A.shippingOptionCode)).toBe(false);
  });

  it("contract resolution locks broker 40353", () => {
    expect(CONTRACT_ID).toBe("40353");
    expect(IP.announceRequiresContractId).toBe(true);
    expect(IP.directContractOnly).toBe(false);
    expect(IP.recipientPhoneRequiredAtAnnounce).toBe(true);
    expect(IP.omitSenderPhoneOnAnnounce).toBe(true);
  });

  it("route GB→GB — exact option never substitutes EVRi/RM/DPD", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: L2A.v2MethodId,
      compatShippingOptionCode: L2A.shippingOptionCode,
      availableOptions: [
        {
          shippingOptionCode: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalShippingOptionCode,
          contractId: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId,
        },
        {
          shippingOptionCode: DPD_LABEL_ENGINE_CERTIFICATION_V1.nextDayClassic.shippingOptionCode,
          contractId: DPD_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId,
        },
        { shippingOptionCode: L2A.shippingOptionCode, contractId: CONTRACT_ID },
      ],
    });
    expect(selection.status).toBe("ROUTE_AWARE_SELECTED");
    expect(selection.shippingOptionCode).toBe(L2A.shippingOptionCode);
    expect(selection.contractId).toBe(CONTRACT_ID);
  });

  it("valid payload — home-address destination, contract 40353, omit sender phone", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: "inpost-ship-1",
      parcelId: 66001,
      trackingNumber: null,
      pdfUrl: null,
      carrierCode: "inpost_gb",
      serviceName: L2A.shippingOptionCode,
      reusedExisting: false,
    });
    getSendcloudParcel.mockResolvedValue({
      id: 66001,
      tracking_number: "INPOSTTRACK001",
      carrier: { code: "inpost_gb" },
      shipment: { id: 1, name: L2A.shippingOptionCode },
      label: { normal_printer: ["https://example.test/inpost-label.pdf"] },
    });
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: `sendcloud:${L2A.v2MethodId}`,
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      ...addrs,
      orderNumber: "RVX-INPOST-CERT-1",
      shippingOptionCode: L2A.shippingOptionCode,
      contractId: CONTRACT_ID,
      v2MethodId: L2A.v2MethodId,
    });
    expect(announceSendcloudShipmentV3).toHaveBeenCalledTimes(1);
    const payload = announceSendcloudShipmentV3.mock.calls[0]![0] as {
      ship_with: {
        properties: { shipping_option_code: string; contract_id?: number };
      };
      from_address: { phone_number?: string; postal_code: string; country_code: string };
      to_address: {
        phone_number?: string;
        postal_code: string;
        country_code: string;
        address_line_1: string;
      };
      label_details: { mime_type: string };
      to_service_point?: unknown;
    };
    expect(payload.ship_with.properties.shipping_option_code).toBe(L2A.shippingOptionCode);
    expect(payload.ship_with.properties.contract_id).toBe(40353);
    expect(payload.to_address.country_code).toBe("GB");
    expect(payload.to_address.address_line_1).toBeTruthy();
    expect(payload.to_address.phone_number).toBeTruthy();
    // InPost: sender phone omitted
    expect(payload.from_address.phone_number).toBeUndefined();
    expect(payload.to_service_point).toBeUndefined();
    expect(payload.label_details.mime_type).toBe("application/pdf");
    expect(result.parcelId).toBe(66001);
    expect(result.trackingNumber).toBe("INPOSTTRACK001");
  });

  it("invalid payload — missing phone / contract / option", async () => {
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: `sendcloud:${L2A.v2MethodId}`,
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        deliveryAddress: { ...addrs.deliveryAddress, phone: "" },
        collectionAddress: addrs.collectionAddress,
        orderNumber: "RVX-INPOST-NOPHONE",
        shippingOptionCode: L2A.shippingOptionCode,
        contractId: CONTRACT_ID,
        v2MethodId: L2A.v2MethodId,
      }),
    ).rejects.toMatchObject({
      details: { reason: "INPOST_RECIPIENT_PHONE_REQUIRED" },
    } satisfies Partial<SendcloudError>);
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();

    await expect(
      SendcloudService.generateLabel({
        quoteId: `sendcloud:${L2A.v2MethodId}`,
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        ...addrs,
        orderNumber: "RVX-INPOST-NOCONTRACT",
        shippingOptionCode: L2A.shippingOptionCode,
        contractId: null,
        v2MethodId: L2A.v2MethodId,
      }),
    ).rejects.toMatchObject({
      details: { reason: "INPOST_CONTRACT_ID_REQUIRED" },
    } satisfies Partial<SendcloudError>);
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("announce readiness — quote preserves V3 code + contract", () => {
    const selected = resolveSelectedShippingQuoteForLabel(
      [hydrateInpostQuote()],
      `sendcloud:${L2A.v2MethodId}`,
    );
    expect(selected?.shippingOptionCode).toBe(L2A.shippingOptionCode);
    expect(selected?.contractId).toBe(CONTRACT_ID);
    expect(selected?.v2MethodId).toBe(27227);
  });

  it("label pipeline fixture — PDF magic vs error-as-PDF", () => {
    const parcelFixture = {
      id: 66001,
      tracking_number: "INPOSTTRACK001",
      carrier: { code: "inpost_gb" },
      shipment: { id: 1, name: L2A.shippingOptionCode },
      label: { normal_printer: ["https://panel.sendcloud.sc/api/v2/labels/label_inpost.pdf"] },
    };
    expect(isUsableSendcloudLabelUrl(extractSendcloudLabelUrl(parcelFixture, "thermal_4x6"))).toBe(
      true,
    );
    expect(isValidInpostLabelPdfBytes(new TextEncoder().encode("%PDF-1.4\n%InPost\n"))).toBe(
      true,
    );
    expect(
      isValidInpostLabelPdfBytes(new TextEncoder().encode('{"error":"validation_error"}')),
    ).toBe(false);
  });

  it("tracking pipeline", async () => {
    getSendcloudTracking.mockResolvedValue({
      id: 66001,
      tracking_number: "INPOSTTRACK001",
      status: { id: 3, message: "In transit" },
      carrier: { code: "inpost_gb" },
    });
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const tracking = await SendcloudService.getTracking("INPOSTTRACK001");
    expect(tracking.status).toBe(mapSendcloudTrackingStatus("In transit"));
  });

  it("cancellation pipeline", async () => {
    cancelSendcloudParcel.mockResolvedValue(undefined);
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await SendcloudService.cancelParcel(66001);
    expect(cancelSendcloudParcel).toHaveBeenCalledWith(66001);
  });

  it("no billable label — mocked only; live gate blocked", () => {
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
    expect(assertInpostBillingSafetyBlocksLiveAnnounce().BILLABLE_LABEL_CREATED).toBe(false);
    const failure = extractSendcloudV3AnnounceFailure({
      data: {
        id: "ship-fail",
        parcels: [{ id: 1, status: { id: 1002, message: "Announcement Failed" } }],
        errors: [{ detail: "Carrier rejected InPost announce" }],
      },
    });
    expect(failure?.message).toContain("Carrier rejected InPost announce");
    expect(
      parseSendcloudV3AnnounceShipmentResult({
        data: { id: "ok", parcels: [{ id: 66002, tracking_number: null, documents: [] }] },
      }).parcelId,
    ).toBe(66002);
  });

  it("EVRi regression", async () => {
    expect(EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId).toBe("38704");
    expect(isEvriSendcloudShippingOptionCode(L2A.shippingOptionCode)).toBe(false);
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
        orderNumber: "RVX-EVRI-FROM-INPOST",
        shippingOptionCode: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalShippingOptionCode,
        contractId: null,
        v2MethodId: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalV2MethodId,
      }),
    ).rejects.toMatchObject({ details: { reason: "EVRI_CONTRACT_ID_REQUIRED" } });
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("Royal Mail regression", async () => {
    const rm = ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked24;
    expect(isRoyalMailSendcloudShippingOptionCode(L2A.shippingOptionCode)).toBe(false);
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
        orderNumber: "RVX-RM-FROM-INPOST",
        shippingOptionCode: rm.shippingOptionCode,
        contractId: null,
        v2MethodId: rm.v2MethodId,
      }),
    ).rejects.toMatchObject({ details: { reason: "ROYAL_MAIL_CONTRACT_ID_REQUIRED" } });
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("DPD regression", async () => {
    const dpd = DPD_LABEL_ENGINE_CERTIFICATION_V1.nextDayClassic;
    expect(isDpdSendcloudShippingOptionCode(L2A.shippingOptionCode)).toBe(false);
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: `sendcloud:${dpd.v2MethodId}`,
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        ...addrs,
        orderNumber: "RVX-DPD-FROM-INPOST",
        shippingOptionCode: dpd.shippingOptionCode,
        contractId: null,
        v2MethodId: dpd.v2MethodId,
      }),
    ).rejects.toMatchObject({ details: { reason: "DPD_CONTRACT_ID_REQUIRED" } });
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });
});
