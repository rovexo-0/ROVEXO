import type { ShippingLabelArtifact } from "@/lib/shipping/types";

export function buildDraftLabel(input: {
  orderNumber: string;
  carrier: string;
  buyerName: string;
  productTitle: string;
  trackingNumber?: string | null;
}): ShippingLabelArtifact {
  const tracking = input.trackingNumber ?? `ROV-${input.orderNumber}`;
  return {
    trackingNumber: input.trackingNumber ?? null,
    barcode: tracking,
    qrPayload: tracking,
    pdfUrl: null,
    carrier: input.carrier,
    status: "pending",
  };
}
