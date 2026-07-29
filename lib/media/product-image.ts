/** Fallback when a listing has no uploaded product image. */
export const PRODUCT_IMAGE_FALLBACK = "/placeholder-product.svg";

/**
 * Card / feed image sources — prefer thumbnail for bandwidth, keep full URL
 * for a one-shot client fallback when the thumb object is missing/invalid.
 */
export type CardImageSources = {
  imageUrl: string;
  imageFullUrl: string;
};

function sanitizeImageUrl(value: string | null | undefined): string {
  const trimmed = value?.trim() || "";
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower === "null" || lower === "undefined") return "";
  return trimmed;
}

export function resolveCardImageSources(
  thumbnailUrl: string | null | undefined,
  fullUrl: string | null | undefined,
): CardImageSources {
  const full = sanitizeImageUrl(fullUrl);
  const thumb = sanitizeImageUrl(thumbnailUrl);
  if (!full && !thumb) {
    return { imageUrl: PRODUCT_IMAGE_FALLBACK, imageFullUrl: PRODUCT_IMAGE_FALLBACK };
  }
  const imageFullUrl = full || thumb;
  const imageUrl = thumb || imageFullUrl;
  return { imageUrl, imageFullUrl };
}
