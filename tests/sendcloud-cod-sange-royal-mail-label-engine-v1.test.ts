/**
 * COD SÂNGE — Royal Mail UK (royal_mailv2) certification V1.
 * Live-proven codes: tracked_24/size=s · tracked_48/size=s · contract 116816.
 * No live announce/label (Owner authorization required for billable labels).
 * EVRi regression: hermes_c2c_gb identity + contract gate unchanged.
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
  isCertifiedRoyalMailV1HomeDeliveryOptionCode,
  isRoyalMailSendcloudShippingOptionCode,
  isRoyalMailServicePointOptionCode,
  isValidRoyalMailLabelPdfBytes,
} from "@/lib/shipping/sendcloud/royal-mail-label-engine-certification-v1";
import {
  extractSendcloudV3AnnounceFailure,
  parseSendcloudV3AnnounceShipmentResult,
  selectRouteAwareV3OptionForCompatMapping,
  shippingQuoteFromPayloadRow,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { resolveSelectedShippingQuoteForLabel } from "@/lib/shipping/selected-shipping-quote-contract-v1";
import { extractSendcloudLabelUrl, isUsableSendcloudLabelUrl } from "@/lib/shipping/pricing/sendcloud-mappers";
import { mapSendcloudTrackingStatus } from "@/lib/shipping/sendcloud/status-mapper";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import type { ShippingQuote } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const RM = ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1;
const T24 = RM.tracked24;
const T48 = RM.tracked48;
const CONTRACT_ID = RM.canonicalContractId;
const QUOTE_ROW_ID = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";

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

function hydrateRmQuote(
  option: typeof T24 | typeof T48,
  overrides?: Record<string, unknown>,
): ShippingQuote {
  return shippingQuoteFromPayloadRow({
    id: QUOTE_ROW_ID,
    providerId: "sendcloud",
    carrier: "Royal Mail",
    serviceName: option.serviceName,
    pricePence: Math.round(Number(option.observedQuoteGbp) * 100),
    currency: "GBP",
    estimatedDaysMin: option === T24 ? 1 : 2,
    estimatedDaysMax: option === T24 ? 1 : 2,
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
    fullName: "Buyer RM",
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
    fullName: "Seller RM",
    line1: "1 Demo Street",
    city: "Walsall",
    postcode: "WS2 9RD",
    country: "GB",
    phone: "+447700900456",
    email: "seller@example.test",
    validated: true,
  },
};

describe("COD SÂNGE — Royal Mail UK label engine certification V1", () => {
  beforeEach(() => {
    announceSendcloudShipmentV3.mockReset();
    getSendcloudParcel.mockReset();
    getSendcloudTracking.mockReset();
    cancelSendcloudParcel.mockReset();
  });

  it("1. carrier discovery locks royal_mailv2 (not alias royal_mail)", () => {
    expect(RM.sendcloudCarrierCode).toBe("royal_mailv2");
    expect(isRoyalMailSendcloudShippingOptionCode(T24.shippingOptionCode)).toBe(true);
    expect(isRoyalMailSendcloudShippingOptionCode("royal_mail:tracked_48")).toBe(true);
    expect(isRoyalMailSendcloudShippingOptionCode("hermes_c2c_gb:a2a/pickup")).toBe(false);
    expect(read("lib/shipping/sendcloud/royal-mail-label-engine-certification-v1.ts")).toContain(
      "royal_mailv2",
    );
  });

  it("2. option code validation — certified V1 home delivery only", () => {
    expect(isCertifiedRoyalMailV1HomeDeliveryOptionCode(T24.shippingOptionCode)).toBe(true);
    expect(isCertifiedRoyalMailV1HomeDeliveryOptionCode(T48.shippingOptionCode)).toBe(true);
    expect(
      isCertifiedRoyalMailV1HomeDeliveryOptionCode("royal_mailv2:tracked_24/letter"),
    ).toBe(false);
    expect(
      isCertifiedRoyalMailV1HomeDeliveryOptionCode("royal_mailv2:servicepoint24/size=s"),
    ).toBe(false);
  });

  it("3. Tracked 24 option identity", () => {
    expect(T24.shippingOptionCode).toBe("royal_mailv2:tracked_24/size=s");
    expect(T24.v2MethodId).toBe(29622);
  });

  it("4. Tracked 48 option identity", () => {
    expect(T48.shippingOptionCode).toBe("royal_mailv2:tracked_48/size=s");
    expect(T48.v2MethodId).toBe(29632);
  });

  it("5. quote response preserves V3 code + contract + price metadata", () => {
    const selected = resolveSelectedShippingQuoteForLabel(
      [hydrateRmQuote(T24)],
      `sendcloud:${T24.v2MethodId}`,
    );
    expect(selected?.shippingOptionCode).toBe(T24.shippingOptionCode);
    expect(selected?.contractId).toBe(CONTRACT_ID);
    expect(selected?.v2MethodId).toBe(T24.v2MethodId);
    expect(selected?.pricePence).toBe(388);
  });

  it("6. announce mapping — route-aware exact match never substitutes EVRi/InPost", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: T48.v2MethodId,
      compatShippingOptionCode: T48.shippingOptionCode,
      availableOptions: [
        {
          shippingOptionCode: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalShippingOptionCode,
          contractId: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId,
        },
        {
          shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
          contractId: "40353",
        },
        { shippingOptionCode: T48.shippingOptionCode, contractId: CONTRACT_ID },
      ],
    });
    expect(selection.status).toBe("ROUTE_AWARE_SELECTED");
    expect(selection.shippingOptionCode).toBe(T48.shippingOptionCode);
    expect(selection.contractId).toBe(CONTRACT_ID);
  });

  it("7. contract handling — fail-closed when Royal Mail contract_id missing", async () => {
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: `sendcloud:${T24.v2MethodId}`,
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        ...addrs,
        orderNumber: "RVX-RM-CERT-1",
        shippingOptionCode: T24.shippingOptionCode,
        contractId: null,
        v2MethodId: T24.v2MethodId,
      }),
    ).rejects.toMatchObject({
      code: "label_failed",
      details: { reason: "ROYAL_MAIL_CONTRACT_ID_REQUIRED" },
    } satisfies Partial<SendcloudError>);
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("8. label persistence path — announce + hydrate PDF URL (mocked)", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: "rm-ship-1",
      parcelId: 99001,
      trackingNumber: null,
      pdfUrl: null,
      carrierCode: "royal_mailv2",
      serviceName: T24.shippingOptionCode,
      reusedExisting: false,
    });
    getSendcloudParcel.mockResolvedValue({
      id: 99001,
      tracking_number: "AB123456789GB",
      carrier: { code: "royal_mailv2" },
      shipment: { id: 77, name: T24.shippingOptionCode },
      label: { normal_printer: ["https://example.test/rm-label.pdf"] },
    });

    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: `sendcloud:${T24.v2MethodId}`,
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      ...addrs,
      orderNumber: "RVX-RM-CERT-1",
      shippingOptionCode: T24.shippingOptionCode,
      contractId: CONTRACT_ID,
      v2MethodId: T24.v2MethodId,
      idempotencyKey: "rovexo-rm-cert-parcel-1",
    });

    expect(announceSendcloudShipmentV3).toHaveBeenCalledTimes(1);
    const payload = announceSendcloudShipmentV3.mock.calls[0]![0] as {
      ship_with: {
        properties: { shipping_option_code: string; contract_id?: number };
      };
      label_details: { mime_type: string };
    };
    expect(payload.ship_with.properties.shipping_option_code).toBe(T24.shippingOptionCode);
    expect(payload.ship_with.properties.contract_id).toBe(116816);
    expect(payload.label_details.mime_type).toBe(RM.requestedLabelMimeType);
    expect(result.parcelId).toBe(99001);
    expect(result.trackingNumber).toBe("AB123456789GB");
    expect(result.pdfUrl).toBe("https://example.test/rm-label.pdf");
  });

  it("9. tracking persistence — tracking number hydrated from parcel GET", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: "rm-ship-2",
      parcelId: 99002,
      trackingNumber: null,
      pdfUrl: "https://example.test/rm2.pdf",
      carrierCode: "royal_mailv2",
      serviceName: T48.shippingOptionCode,
      reusedExisting: false,
    });
    getSendcloudParcel.mockResolvedValue({
      id: 99002,
      tracking_number: "CD987654321GB",
      carrier: { code: "royal_mailv2" },
      shipment: { id: 78, name: T48.shippingOptionCode },
      label: { normal_printer: ["https://example.test/rm2.pdf"] },
    });
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: `sendcloud:${T48.v2MethodId}`,
      parcelTier: "small_parcel",
      weightKg: 1.5,
      lengthCm: 40,
      widthCm: 30,
      heightCm: 10,
      ...addrs,
      orderNumber: "RVX-RM-CERT-2",
      shippingOptionCode: T48.shippingOptionCode,
      contractId: CONTRACT_ID,
      v2MethodId: T48.v2MethodId,
    });
    expect(result.trackingNumber).toBe("CD987654321GB");
  });

  it("10. cancellation architecture — cancelParcel remains SendcloudService API", async () => {
    const serviceSrc = read("lib/shipping/sendcloud/service.ts");
    const clientSrc = read("lib/shipping/sendcloud/client.ts");
    expect(serviceSrc).toContain("async cancelParcel");
    expect(clientSrc).toContain("/parcels/${parcelId}/cancel");
    expect(isRoyalMailSendcloudShippingOptionCode(T24.shippingOptionCode)).toBe(true);
  });

  it("11. fail-closed — Service Point / Local Collect excluded from V1 certification", () => {
    expect(isRoyalMailServicePointOptionCode("royal_mailv2:servicepoint24/size=s")).toBe(
      true,
    );
    expect(isCertifiedRoyalMailV1HomeDeliveryOptionCode("royal_mailv2:servicepoint24/size=s")).toBe(
      false,
    );
    expect(RM.servicePointRequired).toBe(false);
    expect(RM.directContractOnly).toBe(false);
    expect(RM.sendcloudPrenegotiated).toBe(true);
  });

  it("12. invalid/missing option code — no announce", async () => {
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: `sendcloud:${T24.v2MethodId}`,
        parcelTier: "small_parcel",
        weightKg: 2,
        ...addrs,
        orderNumber: "RVX-RM-CERT-BAD",
        shippingOptionCode: null,
        contractId: CONTRACT_ID,
        v2MethodId: T24.v2MethodId,
      }),
    ).rejects.toMatchObject({
      code: "label_failed",
      details: { reason: "NO_V3_SHIPPING_OPTION_CODE" },
    } satisfies Partial<SendcloudError>);
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("13. duplicate announce / idempotency — reuse existing parcel skips announce", async () => {
    getSendcloudParcel.mockResolvedValue({
      id: 99001,
      tracking_number: "ABEXISTING",
      carrier: { code: "royal_mailv2" },
      shipment: { id: 42, name: T24.shippingOptionCode },
      label: { normal_printer: ["https://example.test/existing-rm.pdf"] },
    });
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: `sendcloud:${T24.v2MethodId}`,
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      ...addrs,
      orderNumber: "RVX-RM-CERT-1",
      shippingOptionCode: T24.shippingOptionCode,
      contractId: CONTRACT_ID,
      v2MethodId: T24.v2MethodId,
      existingProviderParcelId: 99001,
    });
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
    expect(result.reusedExisting).toBe(true);
    expect(result.parcelId).toBe(99001);
  });

  it("14. EVRi regression — EVRi codes and contract gate unchanged", async () => {
    expect(EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalShippingOptionCode).toBe(
      "hermes_c2c_gb:a2a/pickup",
    );
    expect(EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId).toBe("38704");
    expect(isEvriSendcloudShippingOptionCode("hermes_c2c_gb:a2a/pickup")).toBe(true);
    expect(isEvriSendcloudShippingOptionCode(T24.shippingOptionCode)).toBe(false);

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
        orderNumber: "RVX-EVRI-REGRESSION",
        shippingOptionCode: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalShippingOptionCode,
        contractId: null,
        v2MethodId: EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalV2MethodId,
      }),
    ).rejects.toMatchObject({
      details: { reason: "EVRI_CONTRACT_ID_REQUIRED" },
    });
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
  });

  it("announce failure never treated as success", () => {
    const failure = extractSendcloudV3AnnounceFailure({
      data: {
        id: "ship-fail",
        parcels: [{ id: 1, status: { id: 1002, message: "Announcement Failed" } }],
        errors: [{ detail: "Carrier rejected Royal Mail announce" }],
      },
    });
    expect(failure?.message).toContain("Carrier rejected Royal Mail announce");
    const parsed = parseSendcloudV3AnnounceShipmentResult({
      data: {
        id: "ship-ok",
        parcels: [{ id: 99003, tracking_number: null, documents: [] }],
      },
    });
    expect(parsed.parcelId).toBe(99003);
  });

  it("small-parcel limits locked from live catalog (no invented sum)", () => {
    expect(RM.smallParcelLimits.maxWeightKg).toBe("2.001");
    expect(RM.smallParcelLimits.maxLengthCm).toBe("45.00");
    expect(RM.smallParcelLimits.maxWidthCm).toBe("35.00");
    expect(RM.smallParcelLimits.maxHeightCm).toBe("16.00");
    expect(RM.smallParcelLimits.maxDimensionSumCm).toBeNull();
    expect(RM.returnsSupportedOnSelectedServices).toBe(false);
    expect(RM.multicollo).toBe(false);
  });

  it("prior live announce failure was NOT_EXECUTED (billing safety) — no Sendcloud error", () => {
    expect(RM.previousLiveAnnounceFailure.sendcloudRequestExecuted).toBe(false);
    expect(RM.previousLiveAnnounceFailure.httpStatus).toBeNull();
    expect(RM.previousLiveAnnounceFailure.sendcloudErrorCode).toBeNull();
    expect(RM.previousLiveAnnounceFailure.rootCause).toBe(
      "BILLING_SAFETY_APPROVAL_SKIPPED_BEFORE_SENDCLOUD_ANNOUNCE",
    );
    expect(RM.nonBillableLiveEvidence.announceLiveTest).toBe("BLOCKED_BY_BILLING_SAFETY");
    expect(RM.nonBillableLiveEvidence.liveLabelCertified).toBe(false);
    expect(RM.nonBillableLiveEvidence.billableLabelCreated).toBe(false);
  });

  it("label pipeline fixture — announce parse → label URL → reject error-as-PDF", () => {
    const parsed = parseSendcloudV3AnnounceShipmentResult({
      data: {
        id: "rm-ship-fixture",
        parcels: [
          {
            id: 99111,
            tracking_number: "AB111222333GB",
            documents: [{ type: "label", link: "https://panel.sendcloud.sc/api/v2/labels/label_rm.pdf" }],
          },
        ],
      },
    });
    expect(parsed.parcelId).toBe(99111);
    expect(parsed.trackingNumber).toBe("AB111222333GB");

    const parcelFixture = {
      id: 99111,
      tracking_number: "AB111222333GB",
      carrier: { code: "royal_mailv2" },
      shipment: { id: 1, name: T24.shippingOptionCode },
      label: { normal_printer: ["https://panel.sendcloud.sc/api/v2/labels/label_rm.pdf"] },
    };
    const pdfUrl = extractSendcloudLabelUrl(parcelFixture, "thermal_4x6");
    expect(isUsableSendcloudLabelUrl(pdfUrl)).toBe(true);

    const validPdf = new TextEncoder().encode("%PDF-1.4\n% Royal Mail Tracked\n");
    const jsonError = new TextEncoder().encode(
      '{"error":"validation_error","message":"No shipping option"}',
    );
    expect(isValidRoyalMailLabelPdfBytes(validPdf)).toBe(true);
    expect(isValidRoyalMailLabelPdfBytes(jsonError)).toBe(false);
  });

  it("tracking fixture — getTracking maps Royal Mail status via canonical path", async () => {
    getSendcloudTracking.mockResolvedValue({
      id: 99111,
      tracking_number: "AB111222333GB",
      status: { id: 3, message: "En route to sorting centre" },
      carrier: { code: "royal_mailv2" },
    });
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const tracking = await SendcloudService.getTracking("AB111222333GB");
    expect(getSendcloudTracking).toHaveBeenCalledWith("AB111222333GB");
    expect(tracking.status).toBe(mapSendcloudTrackingStatus("En route to sorting centre"));
    expect(tracking.events.length).toBeGreaterThan(0);
  });

  it("cancellation fixture — cancelParcel uses canonical /parcels/{id}/cancel", async () => {
    cancelSendcloudParcel.mockResolvedValue(undefined);
    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await SendcloudService.cancelParcel(99111);
    expect(cancelSendcloudParcel).toHaveBeenCalledTimes(1);
    expect(cancelSendcloudParcel).toHaveBeenCalledWith(99111);
  });

  it("Tracked 24 + Tracked 48 announce readiness — contract required, SP not required", async () => {
    for (const option of [T24, T48]) {
      expect(isCertifiedRoyalMailV1HomeDeliveryOptionCode(option.shippingOptionCode)).toBe(
        true,
      );
      announceSendcloudShipmentV3.mockResolvedValue({
        shipmentId: `rm-${option.v2MethodId}`,
        parcelId: option.v2MethodId,
        trackingNumber: null,
        pdfUrl: null,
        carrierCode: "royal_mailv2",
        serviceName: option.shippingOptionCode,
        reusedExisting: false,
      });
      getSendcloudParcel.mockResolvedValue({
        id: option.v2MethodId,
        tracking_number: `TN${option.v2MethodId}GB`,
        carrier: { code: "royal_mailv2" },
        shipment: { id: 1, name: option.shippingOptionCode },
        label: { normal_printer: [`https://example.test/rm-${option.v2MethodId}.pdf`] },
      });
      const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
      const result = await SendcloudService.generateLabel({
        quoteId: `sendcloud:${option.v2MethodId}`,
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        ...addrs,
        orderNumber: `RVX-RM-${option.v2MethodId}`,
        shippingOptionCode: option.shippingOptionCode,
        contractId: CONTRACT_ID,
        v2MethodId: option.v2MethodId,
      });
      const payload = announceSendcloudShipmentV3.mock.calls.at(-1)![0] as {
        ship_with: {
          type: string;
          properties: { shipping_option_code: string; contract_id?: number };
        };
        label_details: { mime_type: string };
      };
      expect(payload.ship_with.type).toBe("shipping_option_code");
      expect(payload.ship_with.properties.shipping_option_code).toBe(
        option.shippingOptionCode,
      );
      expect(payload.ship_with.properties.contract_id).toBe(116816);
      expect(payload.label_details.mime_type).toBe("application/pdf");
      expect(result.parcelId).toBe(option.v2MethodId);
      announceSendcloudShipmentV3.mockClear();
      getSendcloudParcel.mockClear();
    }
  });

  it("EVRi vs Royal Mail — carrier-specific differences only (codes/contracts)", () => {
    expect(EVRI_LABEL_ENGINE_CERTIFICATION_V1.sendcloudCarrierCode).toBe("hermes_c2c_gb");
    expect(RM.sendcloudCarrierCode).toBe("royal_mailv2");
    expect(EVRI_LABEL_ENGINE_CERTIFICATION_V1.canonicalContractId).not.toBe(
      RM.canonicalContractId,
    );
    expect(EVRI_LABEL_ENGINE_CERTIFICATION_V1.announceRequiresContractId).toBe(true);
    expect(RM.announceRequiresContractId).toBe(true);
    expect(EVRI_LABEL_ENGINE_CERTIFICATION_V1.servicePointRequired).toBe(false);
    expect(RM.servicePointRequired).toBe(false);
    // Same canonical engine file — no second announce client
    expect(read("lib/shipping/sendcloud/service.ts")).toContain(
      "announceSendcloudShipmentV3",
    );
    expect(read("lib/shipping/sendcloud/service.ts")).toContain(
      "ROYAL_MAIL_CONTRACT_ID_REQUIRED",
    );
    expect(read("lib/shipping/sendcloud/service.ts")).toContain(
      "EVRI_CONTRACT_ID_REQUIRED",
    );
  });
});
