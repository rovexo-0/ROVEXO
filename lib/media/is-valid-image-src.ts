import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

export type ImageSrc = string | { src: string } | null | undefined;

/** True when a src is a real, renderable image reference (not empty/placeholder). */
export function isRenderableImageSrc(src: ImageSrc): src is string | { src: string } {
  if (src == null) return false;
  if (typeof src !== "string") return Boolean(src.src?.trim());
  const trimmed = src.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower === "null" || lower === "undefined") return false;
  // The bundled placeholder must bypass next/image (SVG optimizer 400).
  if (lower.includes("placeholder-product")) return false;
  if (lower === PRODUCT_IMAGE_FALLBACK.toLowerCase()) return false;
  return true;
}
