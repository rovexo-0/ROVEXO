import "server-only";

import { generateShippingLabel } from "@/lib/shipping/labels/service.server";
import { fetchShippingQuotesRouted } from "@/lib/shipping/providers/router";
import { persistShippingLabelPdf } from "@/lib/shipping/label-storage.server";
import { saveShippingLabel, saveShippingQuotes } from "@/lib/shipping/store";
import { debitShippingReserveForLabel } from "@/lib/commerce-engine/shipping-reserve";
import type { ShippingLabelRequest, ShippingQuoteRequest } from "@/lib/shipping/pricing/provider";

export async function fetchOrderShippingQuotes(orderId: string, request: ShippingQuoteRequest) {
  const pricing = await fetchShippingQuotesRouted(request);
  await saveShippingQuotes({ orderId, pricing });
  return pricing;
}

export async function generateOrderShippingLabel(orderId: string, request: ShippingLabelRequest) {
  const { label, internalPlatformFeePence, providerId, sendcloud } = await generateShippingLabel(request);
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

  if (label.pdfUrl && label.trackingNumber) {
    const stored = await persistShippingLabelPdf({
      orderId,
      parcelNumber: request.parcelNumber ?? 1,
      labelUrl: label.pdfUrl,
    });
    if (stored?.signedUrl) {
      label.pdfUrl = stored.signedUrl;
    }
  }

  return record;
}
