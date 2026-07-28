/**
 * ROVEXO Native Photo Picker Contract v1.0
 *
 * STATUS: OWNER AUTHORIZED · COD SÂNGE · ONE TAP
 *
 * Absolute: ROVEXO SHALL NOT display a custom Camera / Gallery popup.
 * Add Photos → native OS Photo Picker opens immediately (one tap).
 *
 * Android → system Photo Picker / Gallery (OS-chosen)
 * iPhone  → native iOS Photo Library Picker
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
  /** Never set capture on Add Photos — lets the OS open Photos / Gallery. */
  capture: undefined,
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

export type NativePhotoPickerIntent = "gallery";

export function isNativePhotoPickerOneTap(): boolean {
  return NATIVE_PHOTO_PICKER_V1.oneTapToNativePicker === true;
}
