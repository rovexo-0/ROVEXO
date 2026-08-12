import "server-only";

import { isSendcloudConfigured } from "@/lib/shipping/env";
import {
  PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL,
  resolveCompleteParcelMeasurements,
} from "@/lib/shipping/parcels";
import {
  isUsableSendcloudLabelUrl,
  parseSendcloudQuoteId,
} from "@/lib/shipping/pricing/sendcloud-mappers";
import {
  providerFailureFromUnknownError,
  shippingLabelProviderFailure,
} from "@/lib/shipping/pricing/label-provider-failure-v1";
import { SendcloudService } from "@/lib/shipping/sendcloud/service";
import { isSendcloudError } from "@/lib/shipping/sendcloud/errors";
import type {
  ShippingLabelRequest,
  ShippingLabelResponse,
  ShippingProvider,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
} from "@/lib/shipping/pricing/provider";

function unavailableLabel(
  reason: NonNullable<ShippingLabelResponse["reason"]>,
  providerFailure: NonNullable<ShippingLabelResponse["providerFailure"]>,
): ShippingLabelResponse {
  return {
    available: false,
    trackingNumber: null,
    barcode: null,
    qrPayload: null,
    pdfUrl: null,
    carrier: null,
    reason,
    providerFailure,
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
      return unavailableLabel(
        "provider_not_configured",
        shippingLabelProviderFailure({
          kind: "provider_not_configured",
          message: "Sendcloud is not configured.",
          statusCode: null,
          providerId: this.id,
          providerRequestAttempted: false,
          code: "not_configured",
        }),
      );
    }

    if (!parseSendcloudQuoteId(request.quoteId)) {
      return unavailableLabel(
        "quote_expired",
        shippingLabelProviderFailure({
          kind: "provider_validation",
          message: "Invalid or expired Sendcloud quote id.",
          statusCode: null,
          providerId: this.id,
          providerRequestAttempted: false,
          code: "label_failed",
        }),
      );
    }

    if (!request.collectionAddress?.line1?.trim() || !request.collectionAddress?.postcode?.trim()) {
      return unavailableLabel(
        "quote_expired",
        shippingLabelProviderFailure({
          kind: "provider_validation",
          message: "Seller dispatch address is required for Sendcloud shipment creation.",
          statusCode: null,
          providerId: this.id,
          providerRequestAttempted: false,
          code: "invalid_address",
        }),
      );
    }

    // P7.21: refuse silent tier-max synthesis — real measurements required before announce.
    const parcelMeasurements = resolveCompleteParcelMeasurements({
      weightKg: request.weightKg,
      dimensions: {
        lengthCm: request.lengthCm,
        widthCm: request.widthCm,
        heightCm: request.heightCm,
      },
    });
    if (!parcelMeasurements) {
      return unavailableLabel(
        "quote_expired",
        shippingLabelProviderFailure({
          kind: "rovexo_validation",
          message: PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL,
          statusCode: null,
          providerId: "rovexo",
          providerRequestAttempted: false,
          code: "parcel_measurements_required",
        }),
      );
    }

    try {
      const label = await SendcloudService.generateLabel({
        quoteId: request.quoteId,
        parcelTier: request.parcelTier,
        weightKg: parcelMeasurements.weightKg,
        lengthCm: parcelMeasurements.lengthCm,
        widthCm: parcelMeasurements.widthCm,
        heightCm: parcelMeasurements.heightCm,
        deliveryAddress: request.deliveryAddress,
        collectionAddress: request.collectionAddress,
        orderNumber: request.orderNumber,
        declaredValueGbp: request.declaredValueGbp,
        labelSize: request.labelSize,
        idempotencyKey: request.idempotencyKey,
        shippingOptionCode: request.shippingOptionCode,
        contractId: request.contractId,
        v2MethodId: request.v2MethodId,
        existingProviderParcelId: request.existingProviderParcelId,
      });

      // P8.6: announce success = provider parcel id. Tracking/label may arrive async.
      if (!(label.parcelId > 0)) {
        return unavailableLabel(
          "quote_expired",
          shippingLabelProviderFailure({
            kind: "provider_empty_result",
            message: "Sendcloud returned no provider parcel id after announce.",
            statusCode: null,
            providerId: this.id,
            providerRequestAttempted: true,
            code: "label_failed",
          }),
        );
      }

      const tracking = label.trackingNumber?.trim() || null;
      const pdf = isUsableSendcloudLabelUrl(label.pdfUrl) ? label.pdfUrl : null;

      return {
        available: true,
        trackingNumber: tracking,
        barcode: tracking,
        qrPayload: tracking,
        pdfUrl: pdf,
        carrier: label.carrier,
        sendcloudParcelId: label.parcelId,
        serviceCode: label.serviceName,
      };
    } catch (error) {
      console.error("[shipping/sendcloud] Label creation failed:", error);
      // Preserve SendcloudError statusCode/message — never collapse to a silent empty label.
      return unavailableLabel(
        "quote_expired",
        providerFailureFromUnknownError(error, true, this.id),
      );
    }
  }
}

export const sendcloudAdapter = new SendcloudAdapter();
