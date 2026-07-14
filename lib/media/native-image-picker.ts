/**
 * Native mobile image picker — Samsung Android, Chrome Android, iOS Safari, WebView, PWA.
 *
 * Sell Add Photos uses `SellPhotoFileInput` which hardcodes:
 *   <input type="file" accept="image/*" multiple />
 * with NO capture attribute.
 *
 * Why image/* (not an explicit MIME list)?
 * Explicit MIME lists (image/jpeg,image/png,…) and capture= both push many Samsung/Chrome
 * builds into the legacy Camera / Video Camera / Files chooser and hide Gallery /
 * Google Photos. The OS photo picker with accept="image/*" surfaces available providers.
 *
 * Rules:
 * - Never set capture on gallery / sell photo pickers.
 * - Use capture="environment" only on a dedicated camera intent (not sell).
 * - Prefer nesting the input inside <label> with overlay placement on Samsung.
 * - Do not set aria-hidden or tabIndex={-1} on the input.
 */

/** Documented supported image MIME types (client validation / docs). */
export const NATIVE_IMAGE_SUPPORTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/**
 * Accept string for gallery / photo pickers.
 * Wildcard lets Android/iOS choose Gallery, Google Photos, Photos, Files, Camera.
 */
export const NATIVE_IMAGE_GALLERY_ACCEPT = "image/*";

/** Alias — same wildcard for desktop / legacy fallback paths. */
export const NATIVE_IMAGE_FALLBACK_ACCEPT = "image/*";

/**
 * @deprecated Prefer {@link resolveNativeImageAccept} with intent `"gallery"`.
 */
export const NATIVE_IMAGE_ACCEPT = NATIVE_IMAGE_FALLBACK_ACCEPT;

export type NativeImagePickerIntent = "gallery" | "camera" | "any";

export type NativeImagePickerPlacement = "associated" | "overlay";

export function resolveNativeImageAccept(_intent: NativeImagePickerIntent = "any"): string {
  void _intent;
  // Always image/* for gallery-compatible pickers (including camera-intent accept).
  return NATIVE_IMAGE_GALLERY_ACCEPT;
}

export function resolveNativeImageCapture(
  intent: NativeImagePickerIntent,
): "environment" | undefined {
  // Sell / gallery paths must never force camera.
  return intent === "camera" ? "environment" : undefined;
}

/**
 * Visually hidden input kept in the DOM for htmlFor association (avatar upload, etc.).
 */
export const nativeImageFileInputClassName =
  "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 opacity-0 [-webkit-appearance:none] [clip:rect(0,0,0,0)] [clip-path:inset(50%)]";

/** Full-size transparent overlay inside a <label> — direct touch target for Samsung/Android. */
export const nativeImageFileInputOverlayClassName =
  "absolute inset-0 z-[1] m-0 h-full w-full cursor-pointer border-0 p-0 opacity-0 [font-size:16px] [-webkit-appearance:none]";

export type NativeImageFileInputProps = {
  id?: string;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  className?: string;
  placement?: NativeImagePickerPlacement;
  intent?: NativeImagePickerIntent;
  onFilesSelected: (files: FileList) => void;
};

/** Samsung-safe id for htmlFor when association is required (React useId colons break some WebViews). */
export function sanitizeNativeImagePickerId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}
