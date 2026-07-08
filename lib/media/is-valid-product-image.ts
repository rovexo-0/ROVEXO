import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";

/** True when the URL is a real listing image (not empty or placeholder). */
export function isValidProductImageUrl(url: string | null | undefined): boolean {
  return isRenderableImageSrc(url);
}
