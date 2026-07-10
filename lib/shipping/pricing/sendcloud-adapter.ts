import "server-only";

import { isSendcloudConfigured } from "@/lib/shipping/env";
import {
  parseSendcloudQuoteId,
} from "@/lib/shipping/pricing/sendcloud-mappers";
import { SendcloudService } from "@/lib/shipping/sendcloud/service";
import { isSendcloudError } from "@/lib/shipping/sendcloud/errors";
import type {
  ShippingLabelRequest,
  ShippingLabelResponse,
  ShippingProvider,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
} from "@/lib/shipping/pricing/provider";

function emptyLabelResponse(reason: ShippingLabelResponse["reason"]): ShippingLabelResponse {
  return {
    available: false,
    trackingNumber: null,
    barcode: null,
    qrPayload: null,
    pdfUrl: null,
    carrier: null,
    reason,
  };
}

/**
 * Sendcloud adapter — production carrier integration via Sendcloud API.
 * Requires SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY (server-side only).
 */
export class SendcloudAdapter implements ShippingProvider {
  readonly id = "sendcloud";
  readonly name = "Sendcloud";

  isConfigured(): boolean {
    return isSendcloudConfigured();
  }

  async getQuotes(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
    if (!this.isConfigured()) {
      return { available: false, quotes: [], reason: "provider_not_configured" };
    }

    try {
      const result = await SendcloudService.getQuotes({
        parcelTier: request.parcelTier,
        weightKg: request.weightKg,
        collectionAddress: request.collectionAddress,
        deliveryAddress: request.deliveryAddress,
        preferredCarriers: request.preferredCarriers?.map(String),
      });

      if (!result.available) {
        return { available: false, quotes: [], reason: "no_services" };
      }

      return { available: true, quotes: result.quotes };
    } catch (error) {
      console.error("[shipping/sendcloud] Quote request failed:", error);
      if (isSendcloudError(error) && error.code === "invalid_address") {
        return { available: false, quotes: [], reason: "invalid_address" };
      }
      return { available: false, quotes: [], reason: "no_services" };
    }
  }

  async createLabel(request: ShippingLabelRequest): Promise<ShippingLabelResponse> {
    if (!this.isConfigured()) {
      return emptyLabelResponse("provider_not_configured");
    }

    if (!parseSendcloudQuoteId(request.quoteId)) {
      return emptyLabelResponse("quote_expired");
    }

    try {
      const label = await SendcloudService.generateLabel({
        quoteId: request.quoteId,
        parcelTier: request.parcelTier,
        deliveryAddress: request.deliveryAddress,
        orderNumber: request.orderNumber,
        declaredValueGbp: request.declaredValueGbp,
        labelSize: request.labelSize,
      });

      return {
        available: true,
        trackingNumber: label.trackingNumber,
        barcode: label.trackingNumber,
        qrPayload: label.trackingNumber,
        pdfUrl: label.pdfUrl,
        carrier: label.carrier,
        sendcloudParcelId: label.parcelId,
        serviceCode: label.serviceName,
      };
    } catch (error) {
      console.error("[shipping/sendcloud] Label creation failed:", error);
      return emptyLabelResponse("quote_expired");
    }
  }
}

export const sendcloudAdapter = new SendcloudAdapter();
