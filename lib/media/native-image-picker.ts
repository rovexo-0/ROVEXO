/**
 * Native mobile image picker — Samsung Android, Chrome Android, iOS Safari, WebView, PWA.
 *
 * ROVEXO Native Photo Picker (v1.0) — Sell Add Photos:
 *   ONE tap → OS native Photo Picker (no ROVEXO Camera/Gallery sheet).
 *   <input type="file" accept="image/*" multiple /> with NO capture.
 *
 * Why image/* (not an explicit MIME list)?
 * Explicit MIME lists push many Samsung/Chrome builds into the legacy Files /
 * Documents chooser and hide Gallery / Google Photos / system Photo Picker.
 *
 * Rules:
 * - Never set capture on Sell Add Photos / gallery paths.
 * - Prefer nesting the input inside <label> with overlay placement (Samsung).
 * - Do not set aria-hidden or tabIndex={-1} on the input.
 * - Never show a ROVEXO Action Sheet before the native picker.
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
 * Accept string for native photo pickers.
 * Wildcard prefers system Photo Picker / Gallery / Photos on Android and iOS.
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
  return NATIVE_IMAGE_GALLERY_ACCEPT;
}

export function resolveNativeImageCapture(
  intent: NativeImagePickerIntent,
): "environment" | undefined {
  // Sell Add Photos / gallery must never force camera.
  // Dedicated non-Sell camera flows may still request environment capture.
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
