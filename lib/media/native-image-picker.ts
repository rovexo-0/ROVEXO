/**
 * Native mobile image picker — Samsung Android, Chrome Android, iOS Safari, WebView, PWA.
 *
 * Rules:
 * - accept="image/*" opens the system photo picker (Gallery, Camera, Google Photos, Files).
 * - Never use capture= unless explicitly launching the camera only.
 * - Prefer nesting the input inside <label> with overlay placement — most reliable on Samsung.
 * - Do not set aria-hidden or tabIndex={-1} on the input; Samsung Internet ignores those taps.
 * - Do not use display:none or programmatic input.click() for gallery selection.
 */

/** Broadest accept value for Android Photo Picker + iOS PHPicker compatibility. */
export const NATIVE_IMAGE_ACCEPT = "image/*";

/**
 * Visually hidden input kept in the DOM for htmlFor association (avatar upload, etc.).
 * Uses opacity — not display:none — and stays out of the layout without aria-hidden.
 */
export const nativeImageFileInputClassName =
  "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 opacity-0 [-webkit-appearance:none] [clip:rect(0,0,0,0)] [clip-path:inset(50%)]";

/**
 * Full-size transparent overlay inside a <label> — direct touch target for Samsung/Android.
 * The input receives the tap; decorative label content sits underneath.
 */
export const nativeImageFileInputOverlayClassName =
  "absolute inset-0 z-[1] m-0 h-full w-full cursor-pointer border-0 p-0 opacity-0 [font-size:16px] [-webkit-appearance:none]";

export type NativeImagePickerPlacement = "associated" | "overlay";

export type NativeImageFileInputProps = {
  id?: string;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  className?: string;
  placement?: NativeImagePickerPlacement;
  onFilesSelected: (files: FileList) => void;
};

/** Samsung-safe id for htmlFor when association is required (React useId colons break some WebViews). */
export function sanitizeNativeImagePickerId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}
