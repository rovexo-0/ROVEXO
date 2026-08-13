"use client";

import type { ChangeEvent, Ref } from "react";
import { cn } from "@/lib/cn";
import {
  nativeImageFileInputClassName,
  nativeImageFileInputOverlayClassName,
  resolveNativeImageAccept,
  resolveNativeImageCapture,
  type NativeImagePickerIntent,
  type NativeImagePickerPlacement,
} from "@/lib/media/native-image-picker";
import { NATIVE_PHOTO_PICKER_V1 } from "@/lib/media/universal-photo-picker-v1";

type SellPhotoFileInputProps = {
  /** `gallery` = Photos / system picker (no capture). `camera` = rear camera capture. */
  intent?: Extract<NativeImagePickerIntent, "gallery" | "camera">;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  placement?: NativeImagePickerPlacement;
  inputRef?: Ref<HTMLInputElement>;
  onFilesSelected: (files: FileList) => void;
};

/**
 * Sell Add Photos — canonical native file input (one implementation).
 *
 * Gallery: `<input type="file" accept="image/*" multiple />` — no capture.
 * Camera:  `<input type="file" accept="image/*" capture="environment" />` — rear camera.
 *
 * Both intents feed the same Product Integration → upload pipeline via SellProvider.addPhotos.
 * Never invent a second uploader.
 */
export function SellPhotoFileInput({
  intent = "gallery",
  multiple = true,
  disabled = false,
  className,
  placement = "overlay",
  inputRef,
  onFilesSelected,
}: SellPhotoFileInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      onFilesSelected(event.target.files);
    }
    // Allow selecting the same file(s) again.
    event.target.value = "";
  };

  const capture = resolveNativeImageCapture(intent);
  const allowMultiple = intent === "camera" ? false : multiple;

  return (
    <input
      ref={inputRef}
      type="file"
      accept={resolveNativeImageAccept(intent)}
      multiple={allowMultiple}
      disabled={disabled}
      {...(capture ? { capture } : {})}
      onChange={handleChange}
      data-native-photo-picker={NATIVE_PHOTO_PICKER_V1.version}
      data-universal-photo-intent={intent}
      data-product-integration-entry={intent === "camera" ? "camera_capture" : "gallery_picker"}
      className={cn(
        placement === "overlay"
          ? nativeImageFileInputOverlayClassName
          : nativeImageFileInputClassName,
        className,
      )}
    />
  );
}
