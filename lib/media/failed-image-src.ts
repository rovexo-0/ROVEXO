/**
 * Session-scoped registry of image URLs that failed to load.
 * Prevents re-requesting the same invalid thumb/primary through next/image.
 */

const failed = new Set<string>();

export function markFailedImageSrc(src: string | null | undefined): void {
  const key = typeof src === "string" ? src.trim() : "";
  if (!key) return;
  failed.add(key);
}

export function isFailedImageSrc(src: string | null | undefined): boolean {
  const key = typeof src === "string" ? src.trim() : "";
  if (!key) return false;
  return failed.has(key);
}

/** Test-only reset — not used in production UI. */
export function clearFailedImageSrcRegistry(): void {
  failed.clear();
}
