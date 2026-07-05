import "server-only";

import { applyInternalLabelFee } from "@/lib/shipping/labels/fee";
import { getPrimaryProviderServer } from "@/lib/shipping/pricing/service.server";
import type { ShippingLabelRequest } from "@/lib/shipping/pricing/provider";
import type { ShippingLabelArtifact } from "@/lib/shipping/types";

export type LabelGenerationResult = {
  label: ShippingLabelArtifact;
  /** Server-side only — never sent to clients */
  internalPlatformFeePence: number;
};

export async function generateShippingLabel(
  request: ShippingLabelRequest,
): Promise<LabelGenerationResult> {
  const provider = getPrimaryProviderServer();
  const response = await provider.createLabel(request);

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
  };
}
