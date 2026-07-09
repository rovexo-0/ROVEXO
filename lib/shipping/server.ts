import "server-only";

import { generateShippingLabel } from "@/lib/shipping/labels/service.server";
import { fetchShippingQuotesRouted } from "@/lib/shipping/providers/router";
import { isParcel2GoQuoteId } from "@/lib/shipping/pricing/parcel2go-mappers";
import { saveParcel2GoLabel, saveParcel2GoShipment } from "@/lib/shipping/parcel2go-store";
import { persistParcel2GoLabelPdf } from "@/lib/shipping/parcel2go-label-storage.server";
import { saveShippingLabel, saveShippingQuotes } from "@/lib/shipping/store";
import { debitShippingReserveForLabel } from "@/lib/commerce-engine/shipping-reserve";
import type { ShippingLabelRequest, ShippingQuoteRequest } from "@/lib/shipping/pricing/provider";

export async function fetchOrderShippingQuotes(orderId: string, request: ShippingQuoteRequest) {
  const pricing = await fetchShippingQuotesRouted(request);
  await saveShippingQuotes({ orderId, pricing });
  return pricing;
}

export async function generateOrderShippingLabel(orderId: string, request: ShippingLabelRequest) {
  const { label, internalPlatformFeePence, parcel2Go, providerId } = await generateShippingLabel(request);
  const record = await saveShippingLabel({
    orderId,
    parcelId: request.parcelId,
    label,
    internalPlatformFeePence,
    providerId,
  });

  if (label.trackingNumber) {
    await debitShippingReserveForLabel({
      orderId,
      provider: providerId,
      carrier: label.carrier,
      reference: label.trackingNumber,
    });
  }

  if (providerId === "parcel2go" && isParcel2GoQuoteId(request.quoteId) && label.trackingNumber && parcel2Go?.orderId) {
    await saveParcel2GoShipment({
      orderId,
      shipment: {
        id: parcel2Go.orderId,
        provider: "parcel2go",
        providerOrderId: parcel2Go.orderId,
        providerReference: request.orderNumber,
        orderLineId: parcel2Go.orderLineId,
        orderLineIdHmac: parcel2Go.orderLineHmac,
        status: label.pdfUrl ? "label_ready" : "paid",
        trackingNumber: label.trackingNumber,
        carrier: label.carrier,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      serviceCode: parcel2Go.serviceCode,
      idempotencyKey: request.idempotencyKey ?? `rovexo-order-${orderId}`,
      labelUrl: label.pdfUrl,
    });

    if (label.pdfUrl) {
      const stored = await persistParcel2GoLabelPdf({
        orderId,
        parcelNumber: request.parcelNumber ?? 1,
        labelUrl: label.pdfUrl,
      });
      await saveParcel2GoLabel({
        orderId,
        parcelId: request.parcelId,
        label: {
          id: orderId,
          shipmentId: orderId,
          format: "pdf",
          url: stored?.signedUrl ?? label.pdfUrl,
          dataBase64: null,
          trackingNumber: label.trackingNumber,
          carrier: label.carrier,
        },
        storagePath: stored?.storagePath ?? null,
        mimeType: stored?.mimeType ?? null,
        sizeBytes: stored?.size ?? null,
        parcel2GoReference: request.orderNumber,
      });
    }
  }

  return record;
}
