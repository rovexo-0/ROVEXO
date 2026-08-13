/**
 * ROVEXO Native Photo Picker Contract v1.0
 *
 * STATUS: OWNER AUTHORIZED · COD SÂNGE
 *
 * Sell photo acquisition (dual native inputs, one pipeline):
 *   Take Photo           → capture="environment" (rear camera)
 *   Choose from Gallery  → accept="image/*" multiple, NO capture
 *
 * Absolute: ROVEXO SHALL NOT display a custom Camera / Gallery Action Sheet.
 * Each tile opens the OS/browser picker immediately (one tap per intent).
 *
 * Android → system camera OR Photo Picker / Gallery (by intent)
 * iPhone  → camera OR Photos library (by intent)
 *
 * Forbidden:
 *   ROVEXO Action Sheet · Camera Photo popup · Photo Gallery popup ·
 *   Cancel dialog · extra confirmation · second click before picker
 *
 * After selection: validate → compress → thumbnail → upload → progress.
 * Retry ONLY on genuine upload failure.
 *
 * CERTIFICATION: localhost alone is forbidden.
 * See `native-photo-picker-production-device-certification-v1.ts`.
 */

export const NATIVE_PHOTO_PICKER_V1 = {
  version: "1.0",
  id: "native-photo-picker-v1",
  status: "OWNER_AUTHORIZED",
  oneTapToNativePicker: true,
  customActionSheetForbidden: true,
  accept: "image/*" as const,
  /** Gallery path never sets capture. Camera path uses capture="environment". */
  capture: undefined,
  cameraCapture: "environment" as const,
  multiple: true,
  listingMax: 8,
  autoUploadAfterSelection: true,
  retryOnlyOnGenuineFailure: true,
  forbiddenUi: [
    "Action Sheet",
    "Camera Photo popup",
    "Photo Gallery popup",
    "Cancel dialog",
    "extra confirmation screen",
  ] as const,
} as const;

/** @deprecated Use NATIVE_PHOTO_PICKER_V1 — alias kept for import stability. */
export const UNIVERSAL_PHOTO_PICKER_V1 = NATIVE_PHOTO_PICKER_V1;

export type NativePhotoPickerIntent = "gallery" | "camera";

export function isNativePhotoPickerOneTap(): boolean {
  return NATIVE_PHOTO_PICKER_V1.oneTapToNativePicker === true;
}
