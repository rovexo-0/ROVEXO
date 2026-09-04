/**
 * ROVEXO AVIF image pipeline v1.0
 *
 * Extends the canonical listing image path (Sell → Product Integration →
 * `/api/listings/upload` → `products` bucket → SafeImage). Not a second
 * image platform. Account-type agnostic — Business later reuses this engine.
 *
 * Stored originals remain JPEG (reprocess, moderation, fallback).
 * Canonical listing URLs are AVIF derivatives: thumb 400 · medium 800 · large 1600.
 * Local existing listings are backfilled via scripts/backfill-local-listing-avif-v1.ts.
 * No automatic production backfill.
 */

export const AVIF_IMAGE_PIPELINE_V1 = {
  version: "1.0",
  id: "avif-image-pipeline-v1",
  status: "IMPLEMENTATION",
  accountTypeAgnostic: true,
  businessDuplicatePipelineForbidden: true,
  clientAvifUploadForbidden: true,
  renameWithoutConversionForbidden: true,
  convertOnEveryRequestForbidden: true,
  automaticProductionBackfillForbidden: true,
  existingImagesStrategy: "LOCAL_BACKFILL_PLUS_NEW_UPLOAD_DERIVATIVES",
  mime: "image/avif",
  originalPreserved: true,
} as const;

/** Three sizes that match current ROVEXO UI — not a CDN image platform. */
export const AVIF_DERIVATIVE_SIZES = {
  thumb: { maxPx: 400, quality: 50, suffix: "-a400" },
  medium: { maxPx: 800, quality: 58, suffix: "-a800" },
  large: { maxPx: 1600, quality: 64, suffix: "-a1600" },
} as const;

export type AvifDerivativeName = keyof typeof AVIF_DERIVATIVE_SIZES;

export const AVIF_CONTENT_TYPE = "image/avif" as const;
export const AVIF_CACHE_CONTROL = "31536000" as const;

const AVIF_SUFFIXES = ["-a400", "-a800", "-a1600"] as const;

export function isValidAvifBuffer(buffer: Uint8Array | Buffer): boolean {
  if (buffer.length < 12) return false;
  const ftyp = String.fromCharCode(buffer[4]!, buffer[5]!, buffer[6]!, buffer[7]!);
  if (ftyp !== "ftyp") return false;
  const brands = Buffer.from(buffer.subarray(8, Math.min(buffer.length, 64))).toString("ascii");
  return brands.includes("avif") || brands.includes("avis");
}

export function isStoredAvifUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return false;
  return /\.avif(?:$|\?)/i.test(trimmed);
}

export function avifDerivativeStoragePath(
  originalStoragePath: string,
  name: AvifDerivativeName,
): string {
  const suffix = AVIF_DERIVATIVE_SIZES[name].suffix;
  const slash = originalStoragePath.lastIndexOf("/");
  const dir = slash >= 0 ? originalStoragePath.slice(0, slash + 1) : "";
  const filename = slash >= 0 ? originalStoragePath.slice(slash + 1) : originalStoragePath;
  const stem = filename.replace(/\.[^.]+$/, "");
  return `${dir}${stem}${suffix}.avif`;
}

export function allAvifDerivativeStoragePaths(originalStoragePath: string): string[] {
  return (Object.keys(AVIF_DERIVATIVE_SIZES) as AvifDerivativeName[]).map((name) =>
    avifDerivativeStoragePath(originalStoragePath, name),
  );
}

function replaceAvifSuffix(url: string, targetSuffix: string): string | null {
  if (!/-a(400|800|1600)\.avif(?:\?|$)/i.test(url)) return null;
  return url.replace(/-a(400|800|1600)\.avif/i, `${targetSuffix}.avif`);
}

/**
 * Rewrite a stored AVIF URL to a sibling derivative. Returns null for JPEG/PNG/WebP
 * originals so existing listings never receive a fake `.avif` path.
 */
export function resolveStoredAvifDerivativeUrl(
  url: string | null | undefined,
  name: AvifDerivativeName,
): string | null {
  const trimmed = url?.trim() ?? "";
  if (!trimmed || !isStoredAvifUrl(trimmed)) return null;
  const target = AVIF_DERIVATIVE_SIZES[name].suffix;
  const rewritten = replaceAvifSuffix(trimmed, target);
  return rewritten ?? trimmed;
}

export function preferAvifServingUrls(input: {
  originalPublicUrl: string;
  jpegThumbPublicUrl?: string | null;
  avifThumbPublicUrl?: string | null;
  avifLargePublicUrl?: string | null;
}): { url: string; thumbnailUrl: string } {
  const url = input.avifLargePublicUrl?.trim() || input.originalPublicUrl;
  const thumbnailUrl =
    input.avifThumbPublicUrl?.trim() ||
    input.jpegThumbPublicUrl?.trim() ||
    url;
  return { url, thumbnailUrl };
}

export function isAvifDerivativeSuffixPath(path: string): boolean {
  return AVIF_SUFFIXES.some((suffix) => path.includes(`${suffix}.avif`));
}
