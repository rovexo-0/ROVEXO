import { applyInternalLabelFee } from "@/lib/shipping/labels/fee";
export { buildDraftLabel } from "@/lib/shipping/labels/draft";
export type { LabelGenerationResult } from "@/lib/shipping/labels/service.server";

/** @deprecated Import from `@/lib/shipping/labels/service.server` on the server. */
export async function generateShippingLabel(
  ...args: Parameters<(typeof import("@/lib/shipping/labels/service.server"))["generateShippingLabel"]>
) {
  const { generateShippingLabel: generate } = await import("@/lib/shipping/labels/service.server");
  return generate(...args);
}

export { applyInternalLabelFee };
