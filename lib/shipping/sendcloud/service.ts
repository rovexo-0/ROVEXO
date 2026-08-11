import "server-only";

import { isSendcloudConfigured } from "@/lib/shipping/env";
import {
  buildSendcloudParcelPayload,
  extractSendcloudLabelUrl,
  isUsableSendcloudLabelUrl,
  mapSendcloudMethodToQuote,
  normalizeCountryCode,
  parseSendcloudQuoteId,
  parcelSpecFromTier,
} from "@/lib/shipping/pricing/sendcloud-mappers";
import {
  checkSendcloudApiHealth,
  createSendcloudParcel,
  getSendcloudParcel,
  getSendcloudTracking,
  listSendcloudShippingMethods,
} from "@/lib/shipping/sendcloud/client";
import { SendcloudError, toSendcloudError } from "@/lib/shipping/sendcloud/errors";
import { mapSendcloudCarrier, mapSendcloudTrackingStatus } from "@/lib/shipping/sendcloud/status-mapper";
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

    let quotes = filtered
      .map(mapSendcloudMethodToQuote)
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
  }): Promise<SendcloudLabelResult> {
    assertConfigured();

    const methodId = parseSendcloudQuoteId(input.quoteId);
    if (!methodId) {
      throw new SendcloudError("label_failed", "Invalid or expired Sendcloud quote id");
    }

    if (!input.collectionAddress?.line1?.trim() || !input.collectionAddress?.postcode?.trim()) {
      throw new SendcloudError(
        "invalid_address",
        "Seller dispatch address is required for Sendcloud parcel creation",
      );
    }

    const parcel = await createSendcloudParcel(
      buildSendcloudParcelPayload({
        methodId,
        parcelTier: input.parcelTier,
        weightKg: input.weightKg,
        deliveryAddress: input.deliveryAddress,
        collectionAddress: input.collectionAddress,
        orderNumber: input.orderNumber,
        declaredValueGbp: input.declaredValueGbp,
        externalReference: input.idempotencyKey,
      }),
    );

    const labelSize = resolveSellerDefaultLabelSize(input.labelSize);
    const trackingNumber = parcel.tracking_number?.trim() || null;
    const pdfUrl = extractSendcloudLabelUrl(parcel, labelSize);

    // Never report label success without usable tracking + label URL (do not fabricate URLs).
    if (!trackingNumber) {
      throw new SendcloudError("label_failed", "Sendcloud parcel created without a tracking number", {
        details: { parcelId: parcel.id },
      });
    }
    if (!isUsableSendcloudLabelUrl(pdfUrl)) {
      throw new SendcloudError("label_failed", "Sendcloud parcel created without a usable label URL", {
        details: { parcelId: parcel.id },
      });
    }

    return {
      parcelId: parcel.id,
      trackingNumber,
      pdfUrl,
      carrier: parcel.carrier?.code ? mapSendcloudCarrier(parcel.carrier.code) : null,
      serviceName: parcel.shipment?.name ?? null,
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
