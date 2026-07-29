/**
 * ROVEXO Sell photo-metadata — DELEGATE ONLY (Product Integration Phase II).
 *
 * Metadata Engine (Smart Mobile Image Pipeline) is the sole metadata owner.
 * This module retains Sell draft types + analysis helpers and delegates
 * metadata projection to Product Integration. No ownership of metadata logic.
 */

import type { SellPhoto } from "@/features/sell/types";
import type { MetadataRecord } from "@/lib/media/smart-mobile-image-pipeline/metadata-types-v1";
import {
  projectMetadataRecordToSellDraft,
  type SellDraftPhotoMetadata,
  type SellDraftPhotoOrientation,
} from "@/lib/product-integration/sell-photo-metadata-adapter-v1";

export type PhotoOrientation = SellDraftPhotoOrientation;

export type PhotoMetadataEntry = SellDraftPhotoMetadata;

export type PhotoAnalysisSnapshot = {
  count: number;
  dominantColours: string[];
  orientations: PhotoOrientation[];
  duplicateCount: number;
  averageWidth: number;
  averageHeight: number;
  /** Deterministic heuristic — uniform backgrounds score higher. */
  backgroundQuality: "good" | "fair" | "unknown";
};

function fingerprintPhoto(photo: SellPhoto): string {
  const name = photo.file?.name ?? photo.storagePath ?? photo.id;
  const size = photo.file?.size ?? 0;
  return `${name}:${size}`;
}

/** Build analysis snapshot from stored per-photo metadata (no AI, no OCR). */
export function buildPhotoAnalysisSnapshot(
  photos: SellPhoto[],
  entries: PhotoMetadataEntry[] = [],
): PhotoAnalysisSnapshot {
  const count = photos.length;
  const fingerprints = photos.map(fingerprintPhoto);
  const unique = new Set(fingerprints);
  const duplicateCount = Math.max(0, count - unique.size);

  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const orientations: PhotoOrientation[] = [];
  const dominantColours: string[] = [];
  let widthSum = 0;
  let heightSum = 0;
  let measured = 0;

  for (const photo of photos) {
    const entry = entryById.get(photo.id);
    if (!entry) continue;
    orientations.push(entry.orientation);
    measured += 1;
    widthSum += entry.width;
    heightSum += entry.height;
    if (entry.dominantColour) dominantColours.push(entry.dominantColour);
  }

  const uniqueColours = [...new Set(dominantColours)];
  const backgroundQuality =
    measured === 0 ? "unknown" : uniqueColours.length <= 2 ? "good" : "fair";

  return {
    count,
    dominantColours: uniqueColours,
    orientations,
    duplicateCount,
    averageWidth: measured > 0 ? Math.round(widthSum / measured) : 0,
    averageHeight: measured > 0 ? Math.round(heightSum / measured) : 0,
    backgroundQuality,
  };
}

/**
 * Compatibility wrapper — delegates to Product Integration Metadata Engine projection.
 * Callers must supply a certified MetadataRecord (never invent dimensions here).
 */
export function createPhotoMetadataEntry(
  record: MetadataRecord,
  dominantColour: string | null = null,
): PhotoMetadataEntry {
  return projectMetadataRecordToSellDraft(record, dominantColour);
}
