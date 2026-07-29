/**
 * ROVEXO Product Integration — Sell draft metadata projection.
 *
 * PRODUCT INTEGRATION · PHASE II · COD SÂNGE
 *
 * Metadata Engine remains the ONLY metadata owner.
 * This adapter projects frozen MetadataRecord → Sell draft display fields.
 * NO new metadata rules · NO duplicate ownership.
 */

import type { MetadataRecord } from "@/lib/media/smart-mobile-image-pipeline/metadata-types-v1";

export type SellDraftPhotoOrientation = "landscape" | "portrait" | "square";

/** Draft-facing projection — not a second metadata store. */
export type SellDraftPhotoMetadata = {
  id: string;
  width: number;
  height: number;
  orientation: SellDraftPhotoOrientation;
  /** Product colour heuristic overlay — not Metadata Engine ownership. */
  dominantColour: string | null;
};

function draftOrientationFromDimensions(
  width: number,
  height: number,
): SellDraftPhotoOrientation {
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

/**
 * Project certified MetadataRecord into Sell draft metadata shape.
 * Dimensions / identity come from Metadata Engine only.
 */
export function projectMetadataRecordToSellDraft(
  record: MetadataRecord,
  dominantColour: string | null = null,
): SellDraftPhotoMetadata {
  const { identifier, width, height } = record.metadata;
  return {
    id: identifier,
    width,
    height,
    orientation: draftOrientationFromDimensions(width, height),
    dominantColour,
  };
}
