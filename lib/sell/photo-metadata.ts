import type { SellPhoto } from "@/features/sell/types";

export type PhotoOrientation = "landscape" | "portrait" | "square";

export type PhotoMetadataEntry = {
  id: string;
  width: number;
  height: number;
  orientation: PhotoOrientation;
  dominantColour: string | null;
};

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

function orientationFromDimensions(width: number, height: number): PhotoOrientation {
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

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

/** Read image dimensions client-side after upload (canvas-free). */
export async function readPhotoDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return null;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}

export function createPhotoMetadataEntry(
  photo: SellPhoto,
  dimensions: { width: number; height: number },
  dominantColour: string | null = null,
): PhotoMetadataEntry {
  return {
    id: photo.id,
    width: dimensions.width,
    height: dimensions.height,
    orientation: orientationFromDimensions(dimensions.width, dimensions.height),
    dominantColour,
  };
}
