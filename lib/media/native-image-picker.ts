/**
 * Native mobile image picker — Samsung Android, Chrome Android, iOS Safari, WebView, PWA.
 *
 * Priority on Android:
 * 1. System Photo Picker (Android 13+) — use explicit image MIME types (not image/*).
 * 2. Native gallery chooser — same explicit MIME list on older WebViews.
 * 3. Standard file picker — image/* fallback only when intent is "any".
 *
 * Rules:
 * - Never use capture= on gallery intent (opens camera-only on some browsers).
 * - Use capture="environment" only on dedicated camera intent.
 * - Prefer nesting the input inside <label> with overlay placement on Samsung.
 * - Do not set aria-hidden or tabIndex={-1} on the input.
 */

/** Standard image MIME types — opens Android Photo Picker / gallery, not My Files. */
export const NATIVE_IMAGE_GALLERY_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif";

/** Wildcard fallback when explicit MIME lists are unsupported (desktop legacy paths). */
export const NATIVE_IMAGE_FALLBACK_ACCEPT = "image/*";

/**
 * @deprecated Prefer {@link resolveNativeImageAccept} with intent `"gallery"`.
 */
export const NATIVE_IMAGE_ACCEPT = NATIVE_IMAGE_FALLBACK_ACCEPT;

export type NativeImagePickerIntent = "gallery" | "camera" | "any";

export type NativeImagePickerPlacement = "associated" | "overlay";

export function resolveNativeImageAccept(intent: NativeImagePickerIntent = "any"): string {
  if (intent === "any") {
    return NATIVE_IMAGE_FALLBACK_ACCEPT;
  }
  return NATIVE_IMAGE_GALLERY_ACCEPT;
}

export function resolveNativeImageCapture(
  intent: NativeImagePickerIntent,
): "environment" | undefined {
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
