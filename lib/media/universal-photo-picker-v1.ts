/**
 * ROVEXO Native Photo Picker Contract v1.0
 *
 * STATUS: OWNER AUTHORIZED · COD SÂNGE
 *
 * Sell photo acquisition (one visible card):
 *   Add Photo → compact Camera / Gallery choice
 *     Camera  → accept="image/*" capture="environment" (single)
 *     Gallery → accept="image/*" multiple · NO capture
 *
 * Absolute: no permanent Take Photos tile · no in-app camera session ·
 * no second uploader · one pipeline → SellProvider.addPhotos.
 *
 * After selection: validate → compress → thumbnail → upload → progress.
 * Retry ONLY on genuine upload failure.
 *
 * CERTIFICATION: localhost alone is forbidden.
 * See `native-photo-picker-production-device-certification-v1.ts`.
 */

import { SELL_PHOTO_MAX } from "@/features/sell/types";

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
  listingMax: SELL_PHOTO_MAX,
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
