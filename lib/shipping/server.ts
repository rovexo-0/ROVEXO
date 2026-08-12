import "server-only";

import { generateShippingLabel } from "@/lib/shipping/labels/service.server";
import { fetchShippingQuotesRouted } from "@/lib/shipping/providers/router";
import { persistShippingLabelPdf } from "@/lib/shipping/label-storage.server";
import { isDemoShippingTrackingNumber } from "@/lib/shipping/pricing/demo-adapter";
import type { ShippingLabelProviderFailure } from "@/lib/shipping/pricing/provider";
import { saveShippingLabel, saveShippingQuotes } from "@/lib/shipping/store";
import { debitShippingReserveForLabel } from "@/lib/commerce-engine/shipping-reserve";
import type { ShippingLabelRequest, ShippingQuoteRequest } from "@/lib/shipping/pricing/provider";
import type { ShippingRecord } from "@/lib/shipping/types";

export async function fetchOrderShippingQuotes(orderId: string, request: ShippingQuoteRequest) {
  const pricing = await fetchShippingQuotesRouted(request);
  await saveShippingQuotes({ orderId, pricing });
  return pricing;
}

export type GenerateOrderShippingLabelResult = {
  record: ShippingRecord | null;
  providerFailure: ShippingLabelProviderFailure | null;
};

export async function generateOrderShippingLabel(
  orderId: string,
  request: ShippingLabelRequest,
): Promise<GenerateOrderShippingLabelResult> {
  const { label, internalPlatformFeePence, providerId, sendcloud, providerFailure } =
    await generateShippingLabel(request);
  const record = await saveShippingLabel({
    orderId,
    parcelId: request.parcelId,
    label,
    internalPlatformFeePence,
    providerId,
    providerParcelId: sendcloud?.parcelId ?? null,
  });

  if (label.trackingNumber) {
    await debitShippingReserveForLabel({
      orderId,
      provider: providerId,
      carrier: label.carrier,
      reference: label.trackingNumber,
    });
  }

  // Production only: persist the official carrier PDF bytes.
  // Demo: keep the live presentation URL — never snapshot HTML into storage.
  if (
    label.pdfUrl &&
    label.trackingNumber &&
    !isDemoShippingTrackingNumber(label.trackingNumber)
  ) {
    const stored = await persistShippingLabelPdf({
      orderId,
      parcelNumber: request.parcelNumber ?? 1,
      labelUrl: label.pdfUrl,
    });
    if (stored?.storagePath) {
      /* Persist bucket key (not temporary signed URL) so GET can re-sign forever. */
      await saveShippingLabel({
        orderId,
        parcelId: request.parcelId,
        label: {
          ...label,
          pdfUrl: stored.storagePath,
        },
        internalPlatformFeePence,
        providerId,
        providerParcelId: sendcloud?.parcelId ?? null,
      });
      if (stored.signedUrl) {
        label.pdfUrl = stored.signedUrl;
      }
    }
  }

  return {
    record,
    providerFailure: providerFailure ?? null,
  };
}
