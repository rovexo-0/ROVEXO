import "server-only";

import { createShippingLabelRouted } from "@/lib/shipping/providers/router";
import type {
  ShippingLabelProviderFailure,
  ShippingLabelRequest,
} from "@/lib/shipping/pricing/provider";
import type { ShippingLabelArtifact } from "@/lib/shipping/types";
import type { ShippingProviderId } from "@/lib/shipping/providers/types";

export type LabelGenerationResult = {
  label: ShippingLabelArtifact;
  /** Always 0 — internal label stamp removed. Column kept for historical rows. */
  internalPlatformFeePence: number;
  providerId: ShippingProviderId;
  /** Structured provider failure when available=false (P7.1). */
  providerFailure?: ShippingLabelProviderFailure;
  sendcloud?: {
    parcelId: number;
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
      ...(response.providerFailure ? { providerFailure: response.providerFailure } : {}),
    };
  }

  const tracking = response.trackingNumber?.trim() || null;
  const pdfUrl = response.pdfUrl?.trim() || null;
  const labelReady = Boolean(tracking && pdfUrl);

  return {
    label: {
      trackingNumber: tracking,
      barcode: tracking,
      qrPayload: tracking,
      pdfUrl,
      carrier: response.carrier ?? "Royal Mail",
      // P8.6: announced without sync tracking stays pending until webhook/refresh fills it.
      status: labelReady ? "ready" : "pending",
    },
    internalPlatformFeePence: 0,
    providerId: response.providerId,
    sendcloud: response.sendcloudParcelId
      ? {
          parcelId: response.sendcloudParcelId,
          serviceCode: response.serviceCode ?? null,
        }
      : undefined,
  };
}
