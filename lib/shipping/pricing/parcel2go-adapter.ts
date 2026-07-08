import "server-only";

import { isParcel2GoConfigured } from "@/src/services/shipping/env";
import { parcel2GoProvider } from "@/src/services/shipping/parcel2go/provider";
import { parcelTierToDimensions } from "@/lib/shipping/parcels";
import {
  mapLibAddressToParcel2Go,
  mapParcel2GoQuotesToLibQuotes,
  parseParcel2GoQuoteIdForLabel,
} from "@/lib/shipping/pricing/parcel2go-mappers";
import type {
  ShippingLabelRequest,
  ShippingLabelResponse,
  ShippingProvider,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
} from "@/lib/shipping/pricing/provider";
import { isShippingError } from "@/src/services/shipping/errors";

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

export class Parcel2GoAdapter implements ShippingProvider {
  readonly id = "parcel2go";
  readonly name = "Parcel2Go";

  isConfigured(): boolean {
    return isParcel2GoConfigured();
  }

  async getQuotes(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
    if (!this.isConfigured()) {
      return { available: false, quotes: [], reason: "provider_not_configured" };
    }

    try {
      const dimensions = parcelTierToDimensions(request.parcelTier);
      const quotes = await parcel2GoProvider.getQuotes({
        collectionAddress: mapLibAddressToParcel2Go(request.collectionAddress),
        deliveryAddress: mapLibAddressToParcel2Go(request.deliveryAddress),
        parcels: [
          {
            weightKg: request.weightKg ?? dimensions.weightKg,
            lengthCm: dimensions.lengthCm,
            widthCm: dimensions.widthCm,
            heightCm: dimensions.heightCm,
            valueGbp: request.declaredValueGbp ?? 50,
          },
        ],
      });

      const mapped = mapParcel2GoQuotesToLibQuotes(quotes);
      if (mapped.length === 0) {
        return { available: false, quotes: [], reason: "no_services" };
      }

      return { available: true, quotes: mapped };
    } catch (error) {
      console.error("[shipping/parcel2go] Quote request failed:", error);
      if (isShippingError(error) && error.code === "validation") {
        return { available: false, quotes: [], reason: "invalid_address" };
      }
      return { available: false, quotes: [], reason: "no_services" };
    }
  }

  async createLabel(request: ShippingLabelRequest): Promise<ShippingLabelResponse> {
    if (!this.isConfigured()) {
      return emptyLabelResponse("provider_not_configured");
    }

    const quoteMeta = parseParcel2GoQuoteIdForLabel(request.quoteId);
    if (!quoteMeta) {
      return emptyLabelResponse("quote_expired");
    }

    try {
      const dimensions = parcelTierToDimensions(request.parcelTier);
      const shipment = await parcel2GoProvider.createOrder({
        quoteId: request.quoteId,
        rateId: quoteMeta.serviceSlug,
        reference: request.orderNumber,
        collectionAddress: mapLibAddressToParcel2Go(request.collectionAddress),
        deliveryAddress: mapLibAddressToParcel2Go(request.deliveryAddress),
        parcels: [
          {
            weightKg: dimensions.weightKg,
            lengthCm: dimensions.lengthCm,
            widthCm: dimensions.widthCm,
            heightCm: dimensions.heightCm,
            valueGbp: request.declaredValueGbp ?? 50,
          },
        ],
        customerEmail: undefined,
        idempotencyKey: request.idempotencyKey,
      });

      const paid = await parcel2GoProvider.payOrder({
        shipmentId: paidShipmentId(shipment),
        paymentMethod: "prepay",
      });

      const labels = await parcel2GoProvider.getLabels({
        shipmentId: paid.id,
        orderLineIdHmac: paid.orderLineIdHmac ?? shipment.orderLineIdHmac ?? undefined,
      });

      const label = labels[0];
      if (!label) {
        return emptyLabelResponse("quote_expired");
      }

      return {
        available: true,
        trackingNumber: label.trackingNumber,
        barcode: label.trackingNumber,
        qrPayload: label.trackingNumber,
        pdfUrl: label.url,
        carrier: label.carrier ?? quoteMeta.carrier,
        parcel2GoOrderId: paid.providerOrderId,
        parcel2GoOrderLineId: paid.orderLineId ?? shipment.orderLineId ?? null,
        parcel2GoOrderLineHmac: paid.orderLineIdHmac ?? shipment.orderLineIdHmac ?? null,
        serviceCode: quoteMeta.serviceSlug,
      };
    } catch (error) {
      console.error("[shipping/parcel2go] Label creation failed:", error);
      return emptyLabelResponse("quote_expired");
    }
  }
}

function paidShipmentId(shipment: { id: string; providerOrderId: string }): string {
  return shipment.providerOrderId || shipment.id;
}

export const parcel2GoAdapter = new Parcel2GoAdapter();
