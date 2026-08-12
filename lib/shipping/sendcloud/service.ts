import "server-only";

import { isSendcloudConfigured } from "@/lib/shipping/env";
import {
  extractSendcloudLabelUrl,
  isUsableSendcloudLabelUrl,
  mapSendcloudMethodToQuote,
  normalizeCountryCode,
  parseSendcloudQuoteId,
  parcelSpecFromTier,
  toSendcloudAddress,
} from "@/lib/shipping/pricing/sendcloud-mappers";
import {
  announceSendcloudShipmentV3,
  checkSendcloudApiHealth,
  getSendcloudParcel,
  getSendcloudTracking,
  listSendcloudShippingMethods,
} from "@/lib/shipping/sendcloud/client";
import { SendcloudError, toSendcloudError } from "@/lib/shipping/sendcloud/errors";
import { mapSendcloudCarrier, mapSendcloudTrackingStatus } from "@/lib/shipping/sendcloud/status-mapper";
import { isConfirmedSendcloudV3ShippingOptionCode } from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { resolveSendcloudV3MetadataForMethods, gateSendcloudV3MetadataByRouteAvailability } from "@/lib/shipping/sendcloud/v3-catalog-v1";
import type {
  SendcloudHealthResult,
  SendcloudLabelResult,
  SendcloudTrackingResult,
} from "@/lib/shipping/sendcloud/types";
import type { ShippingAddress, ShippingQuote, ParcelTier } from "@/lib/shipping/types";
import type { SellerDefaultLabelSize } from "@/lib/shipping/label-size";
import { resolveSellerDefaultLabelSize } from "@/lib/shipping/label-size";
import { isServicePointEngineEnabled } from "@/lib/shipping/service-point-engine-v1";

function assertConfigured(): void {
  if (!isSendcloudConfigured()) {
    throw new SendcloudError(
      "not_configured",
      "Sendcloud is not configured. Set SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY.",
    );
  }
}

/** Production Sendcloud carrier service — server-side only. */
export const SendcloudService = {
  isConfigured(): boolean {
    return isSendcloudConfigured();
  },

  async checkHealth(): Promise<SendcloudHealthResult> {
    if (!isSendcloudConfigured()) {
      return {
        configured: false,
        status: "degraded",
        latencyMs: 0,
        message: "Sendcloud is not configured",
      };
    }

    try {
      return await checkSendcloudApiHealth();
    } catch (error) {
      const sendcloudError = toSendcloudError(error);
      return {
        configured: true,
        status: "unhealthy",
        latencyMs: 0,
        message: sendcloudError.message,
      };
    }
  },

  async getQuotes(input: {
    parcelTier: ParcelTier;
    weightKg?: number;
    collectionAddress: ShippingAddress;
    deliveryAddress: ShippingAddress;
    preferredCarriers?: string[];
  }): Promise<{ available: boolean; quotes: ShippingQuote[] }> {
    assertConfigured();

    const spec = parcelSpecFromTier(input.parcelTier, input.weightKg);
    // GET /shipping_methods does not accept weight/dimensions query params (Sendcloud OpenAPI v2).
    // Weight is applied locally against each method's min_weight / max_weight.
    const methods = await listSendcloudShippingMethods({
      toCountry: normalizeCountryCode(input.deliveryAddress.country),
      toPostalCode: input.deliveryAddress.postcode,
      fromPostalCode: input.collectionAddress.postcode,
    });

    const filtered = methods.filter((method) => {
      const minWeight = Number.parseFloat(method.min_weight);
      const maxWeight = Number.parseFloat(method.max_weight);
      if (spec.weightKg < minWeight || spec.weightKg > maxWeight) return false;
      // Gate 0: never expose Service Point–required methods until certified.
      if (method.service_point_input === "required" && !isServicePointEngineEnabled()) {
        return false;
      }
      return true;
    });

    // V3 discovery: compat identity first, then route-aware /shipping-options gate.
    // Compat alone is NOT announce-ready — unavailable codes are stripped (no carrier substitute).
    // Failures must not break V2 pricing; quotes remain label-blocked until a route-proven code exists.
    let v3ByMethod = new Map<
      number,
      { shippingOptionCode?: string; contractId?: string; v2MethodId?: number }
    >();
    try {
      const compatMeta = await resolveSendcloudV3MetadataForMethods(filtered.map((m) => m.id));
      const gated = await gateSendcloudV3MetadataByRouteAvailability(compatMeta, {
        fromCountryCode: normalizeCountryCode(input.collectionAddress.country),
        toCountryCode: normalizeCountryCode(input.deliveryAddress.country),
        fromPostalCode: input.collectionAddress.postcode,
        toPostalCode: input.deliveryAddress.postcode,
        parcelTier: input.parcelTier,
        weightKg: spec.weightKg,
        lengthCm: spec.lengthCm,
        widthCm: spec.widthCm,
        heightCm: spec.heightCm,
        calculateQuotes: true,
      });
      v3ByMethod = gated.metadata;
      for (const [methodId, selection] of gated.selections) {
        if (selection.status === "COMPAT_IDENTITY_FOUND_BUT_ROUTE_UNAVAILABLE") {
          console.info("[shipping/sendcloud] V3 compat identity unavailable for route/parcel", {
            v2MethodId: methodId,
            compatShippingOptionCode: selection.compatShippingOptionCode,
            status: selection.status,
          });
        }
      }
    } catch (error) {
      console.warn("[shipping/sendcloud] V3 metadata enrichment skipped", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    let quotes = filtered
      .map((method) =>
        mapSendcloudMethodToQuote(method, v3ByMethod.get(method.id) ?? { v2MethodId: method.id }),
      )
      .filter((quote): quote is ShippingQuote => quote != null);

    if (input.preferredCarriers?.length) {
      const preferred = new Set(input.preferredCarriers.map((carrier) => carrier.toLowerCase()));
      const preferredQuotes = quotes.filter((quote) =>
        preferred.has(String(quote.carrier).toLowerCase()),
      );
      if (preferredQuotes.length > 0) {
        quotes = preferredQuotes;
      }
    }

    return {
      available: quotes.length > 0,
      quotes,
    };
  },

  /**
   * Label generation — V3 /shipments/announce only when shippingOptionCode is confirmed.
   * Never POST /api/v2/parcels. Never derive code from quoteId / method.id.
   */
  async generateLabel(input: {
    quoteId: string;
    parcelTier: ParcelTier;
    weightKg?: number;
    deliveryAddress: ShippingAddress;
    collectionAddress: ShippingAddress;
    orderNumber: string;
    declaredValueGbp?: number;
    labelSize?: SellerDefaultLabelSize;
    idempotencyKey?: string;
    shippingOptionCode?: string | null;
    contractId?: string | null;
    v2MethodId?: number | null;
    /** Existing provider parcel id — reuse instead of creating another shipment. */
    existingProviderParcelId?: number | null;
  }): Promise<SendcloudLabelResult> {
    assertConfigured();

    const methodId = input.v2MethodId ?? parseSendcloudQuoteId(input.quoteId);
    if (!methodId) {
      throw new SendcloudError("label_failed", "Invalid or expired Sendcloud quote id");
    }

    if (!input.collectionAddress?.line1?.trim() || !input.collectionAddress?.postcode?.trim()) {
      throw new SendcloudError(
        "invalid_address",
        "Seller dispatch address is required for Sendcloud shipment creation",
      );
    }

    const shippingOptionCode = input.shippingOptionCode?.trim() || null;
    if (!isConfirmedSendcloudV3ShippingOptionCode(shippingOptionCode, methodId)) {
      throw new SendcloudError(
        "label_failed",
        "Sendcloud V3 shipping_option_code is required for label generation. Legacy V2 method IDs (including sendcloud:N) cannot create labels without a confirmed V3 counterpart.",
        {
          details: {
            quoteId: input.quoteId,
            v2MethodId: methodId,
            reason: "NO_V3_SHIPPING_OPTION_CODE",
          },
        },
      );
    }

    // Idempotency: reuse existing provider parcel when already persisted.
    if (input.existingProviderParcelId != null && input.existingProviderParcelId > 0) {
      try {
        const existing = await getSendcloudParcel(input.existingProviderParcelId);
        const labelSize = resolveSellerDefaultLabelSize(input.labelSize);
        const trackingNumber = existing.tracking_number?.trim() || null;
        const pdfUrl = extractSendcloudLabelUrl(existing, labelSize);
        if (trackingNumber && isUsableSendcloudLabelUrl(pdfUrl)) {
          return {
            parcelId: existing.id,
            trackingNumber,
            pdfUrl,
            carrier: existing.carrier?.code ? mapSendcloudCarrier(existing.carrier.code) : null,
            serviceName: existing.shipment?.name ?? shippingOptionCode,
            reusedExisting: true,
          };
        }
      } catch {
        // Fall through to announce when refresh fails.
      }
    }

    const spec = parcelSpecFromTier(input.parcelTier, input.weightKg);
    const from = toSendcloudAddress(input.collectionAddress);
    const to = toSendcloudAddress(input.deliveryAddress);

    const contractRaw = input.contractId?.trim();
    const contractId =
      contractRaw && /^\d+$/.test(contractRaw)
        ? Number.parseInt(contractRaw, 10)
        : contractRaw || undefined;

    const announced = await announceSendcloudShipmentV3({
      from_address: {
        name: from.name,
        address_line_1: from.address,
        house_number: from.house_number,
        postal_code: from.postal_code,
        city: from.city,
        country_code: from.country,
        phone_number: from.telephone || undefined,
        email: from.email || undefined,
      },
      to_address: {
        name: to.name,
        address_line_1: to.address,
        house_number: to.house_number,
        postal_code: to.postal_code,
        city: to.city,
        country_code: to.country,
        phone_number: to.telephone || undefined,
        email: to.email || undefined,
      },
      ship_with: {
        type: "shipping_option_code",
        properties: {
          shipping_option_code: shippingOptionCode,
          ...(contractId != null ? { contract_id: contractId } : {}),
        },
      },
      parcels: [
        {
          dimensions: {
            length: String(spec.lengthCm),
            width: String(spec.widthCm),
            height: String(spec.heightCm),
            unit: "cm",
          },
          weight: { value: spec.weightKg.toFixed(3), unit: "kg" },
        },
      ],
      order_number: input.orderNumber,
      external_reference_id: input.idempotencyKey?.trim() || undefined,
      reference: input.orderNumber,
      total_order_price: {
        currency: "GBP",
        value: (input.declaredValueGbp ?? 50).toFixed(2),
      },
      label_details: { mime_type: "application/pdf", dpi: 72 },
    });

    const trackingNumber = announced.trackingNumber?.trim() || null;
    const pdfUrl = announced.pdfUrl;

    if (!trackingNumber) {
      throw new SendcloudError("label_failed", "Sendcloud shipment announced without a tracking number", {
        details: { shipmentId: announced.shipmentId, parcelId: announced.parcelId },
      });
    }
    if (!isUsableSendcloudLabelUrl(pdfUrl)) {
      throw new SendcloudError("label_failed", "Sendcloud shipment announced without a usable label URL", {
        details: { shipmentId: announced.shipmentId, parcelId: announced.parcelId },
      });
    }

    return {
      parcelId: announced.parcelId ?? 0,
      trackingNumber,
      pdfUrl,
      carrier: announced.carrierCode ? mapSendcloudCarrier(announced.carrierCode) : null,
      serviceName: announced.serviceName ?? shippingOptionCode,
      shipmentId: announced.shipmentId,
      reusedExisting: announced.reusedExisting,
    };
  },

  async getTracking(trackingNumber: string): Promise<SendcloudTrackingResult> {
    assertConfigured();

    const parcel = await getSendcloudTracking(trackingNumber);
    if (!parcel) {
      throw new SendcloudError("tracking_not_found", `No Sendcloud parcel for tracking ${trackingNumber}`);
    }

    const statusMessage = parcel.status?.message;
    return {
      status: mapSendcloudTrackingStatus(statusMessage),
      events: statusMessage
        ? [
            {
              status: statusMessage,
              statusDetails: statusMessage,
              location: null,
              occurredAt: new Date().toISOString(),
            },
          ]
        : [],
    };
  },

  async refreshParcel(parcelId: number): Promise<SendcloudTrackingResult> {
    assertConfigured();

    const parcel = await getSendcloudParcel(parcelId);
    const statusMessage = parcel.status?.message;

    return {
      status: mapSendcloudTrackingStatus(statusMessage),
      events: statusMessage
        ? [
            {
              status: statusMessage,
              statusDetails: statusMessage,
              location: null,
              occurredAt: new Date().toISOString(),
            },
          ]
        : [],
    };
  },

  async cancelParcel(parcelId: number): Promise<void> {
    assertConfigured();
    const { cancelSendcloudParcel } = await import("@/lib/shipping/sendcloud/client");
    try {
      await cancelSendcloudParcel(parcelId);
    } catch (error) {
      throw toSendcloudError(error);
    }
  },
};
