/**
 * Native mobile image picker — Samsung Android, Chrome Android, iOS Safari.
 *
 * Rules:
 * - accept="image/*" opens the system photo picker (Gallery, Camera, Google Photos, Files).
 * - Never use capture= unless explicitly launching the camera only.
 * - Triggers must be <label htmlFor> — programmatic input.click() breaks Samsung gallery.
 */

/** Broadest accept value for Android Photo Picker + iOS PHPicker compatibility. */
export const NATIVE_IMAGE_ACCEPT = "image/*";

/**
 * Visually hidden but still "present" for mobile browsers (not display:none).
 * Samsung Internet rejects gallery when the input is display:none or opened via .click().
 */
export const nativeImageFileInputClassName =
  "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [-webkit-appearance:none] [clip:rect(0,0,0,0)] [clip-path:inset(50%)]";

export type NativeImageFileInputProps = {
  id: string;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  className?: string;
  onFilesSelected: (files: FileList) => void;
};
