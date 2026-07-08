const DICEBEAR_HOST = "api.dicebear.com";

/** Dicebear SVG avatars break `next/image`; coerce to PNG raster URLs. */
export function normalizeAvatarUrl(src: string | null | undefined): string | null {
  if (!src?.trim()) return null;

  if (!src.includes(DICEBEAR_HOST)) return src;

  // /7.x/shapes/svg?seed=… → /7.x/shapes/png?seed=…
  if (src.includes("/svg")) {
    return src.replace(/\/svg(\?|$)/, "/png$1");
  }

  return src;
}
