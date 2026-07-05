import "server-only";

import { isShippoConfigured } from "@/lib/shipping/env";
import {
  mapShippoRateToQuote,
  parseShippoQuoteId,
} from "@/lib/shipping/pricing/shippo-mappers";
import { isShippoError } from "@/lib/shipping/shippo/errors";
import { ShippoService } from "@/lib/shipping/shippo/service";
import type {
  ShippingLabelRequest,
  ShippingLabelResponse,
  ShippingProvider,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
} from "@/lib/shipping/pricing/provider";

function emptyLabelResponse(
  reason: ShippingLabelResponse["reason"],
): ShippingLabelResponse {
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
 * Shippo adapter — production carrier integration via Shippo API.
 * Requires SHIPPO_API_KEY (server-side only).
 */
export class ShippoAdapter implements ShippingProvider {
  readonly id = "shippo";
  readonly name = "Shippo";

  isConfigured(): boolean {
    return isShippoConfigured();
  }

  async getQuotes(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
    if (!this.isConfigured()) {
      return { available: false, quotes: [], reason: "provider_not_configured" };
    }

    try {
      const result = await ShippoService.getQuotes({
        parcelTier: request.parcelTier,
        weightKg: request.weightKg,
        collectionAddress: request.collectionAddress,
        deliveryAddress: request.deliveryAddress,
      });

      if (!result.available) {
        return { available: false, quotes: [], reason: "no_services" };
      }

      return { available: true, quotes: result.quotes };
    } catch (error) {
      console.error("[shipping/shippo] Quote request failed:", error);
      if (isShippoError(error) && error.code === "invalid_address") {
        return { available: false, quotes: [], reason: "invalid_address" };
      }
      return { available: false, quotes: [], reason: "no_services" };
    }
  }

  async createLabel(request: ShippingLabelRequest): Promise<ShippingLabelResponse> {
    if (!this.isConfigured()) {
      return emptyLabelResponse("provider_not_configured");
    }

    const rateObjectId = parseShippoQuoteId(request.quoteId);
    if (!rateObjectId) {
      return emptyLabelResponse("quote_expired");
    }

    try {
      const label = await ShippoService.generateLabel(rateObjectId);

      return {
        available: true,
        trackingNumber: label.trackingNumber,
        barcode: label.trackingNumber,
        qrPayload: label.trackingNumber,
        pdfUrl: label.pdfUrl,
        carrier: label.carrier,
      };
    } catch (error) {
      console.error("[shipping/shippo] Label creation failed:", error);
      return emptyLabelResponse("quote_expired");
    }
  }
}

export const shippoAdapter = new ShippoAdapter();

// Re-export mapper for tests that import from adapter path.
export { mapShippoRateToQuote };
