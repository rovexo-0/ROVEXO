import "server-only";

import { applyInternalLabelFee } from "@/lib/shipping/labels/fee";
import { createShippingLabelRouted } from "@/lib/shipping/providers/router";
import type { ShippingLabelRequest } from "@/lib/shipping/pricing/provider";
import type { ShippingLabelArtifact } from "@/lib/shipping/types";
import type { ShippingProviderId } from "@/lib/shipping/providers/types";

export type LabelGenerationResult = {
  label: ShippingLabelArtifact;
  /** Server-side only — never sent to clients */
  internalPlatformFeePence: number;
  providerId: ShippingProviderId;
  usedFallback: boolean;
  parcel2Go?: {
    orderId: string;
    orderLineId: string | null;
    orderLineHmac: string | null;
    serviceCode: string | null;
  };
};

export async function generateShippingLabel(
  request: ShippingLabelRequest,
): Promise<LabelGenerationResult> {
  const response = await createShippingLabelRouted(request);

  if (!response.available) {
    return {
      label: {
        trackingNumber: null,
        barcode: null,
        qrPayload: null,
        pdfUrl: null,
        carrier: response.carrier ?? "Royal Mail",
        status: "pending",
      },
      internalPlatformFeePence: 0,
      providerId: response.providerId,
      usedFallback: response.usedFallback,
    };
  }

  const { platformFeePence } = applyInternalLabelFee(0);

  return {
    label: {
      trackingNumber: response.trackingNumber,
      barcode: response.barcode,
      qrPayload: response.qrPayload,
      pdfUrl: response.pdfUrl,
      carrier: response.carrier ?? "Royal Mail",
      status: "ready",
    },
    internalPlatformFeePence: platformFeePence,
    providerId: response.providerId,
    usedFallback: response.usedFallback,
    parcel2Go: response.parcel2GoOrderId
      ? {
          orderId: response.parcel2GoOrderId,
          orderLineId: response.parcel2GoOrderLineId ?? null,
          orderLineHmac: response.parcel2GoOrderLineHmac ?? null,
          serviceCode: response.serviceCode ?? null,
        }
      : undefined,
  };
}
