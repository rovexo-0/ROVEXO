"use client";

import type { ChangeEvent, Ref } from "react";
import { cn } from "@/lib/cn";
import {
  nativeImageFileInputClassName,
  nativeImageFileInputOverlayClassName,
  resolveNativeImageAccept,
  type NativeImagePickerPlacement,
} from "@/lib/media/native-image-picker";
import { NATIVE_PHOTO_PICKER_V1 } from "@/lib/media/universal-photo-picker-v1";

type SellPhotoFileInputProps = {
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  placement?: NativeImagePickerPlacement;
  inputRef?: Ref<HTMLInputElement>;
  onFilesSelected: (files: FileList) => void;
};

/**
 * Sell Add Photos — one-tap native OS Photo Picker.
 *
 * Exactly:
 *   <input type="file" accept="image/*" multiple />
 * OS Photos / Gallery only — never forces the device camera.
 *
 * Android → system Photo Picker / Gallery
 * iPhone  → Photos library
 *
 * Product Integration Phase III: gallery entry is owned by Product Integration
 * (files flow through intakeSellPhotoFromCanonicalEntry via SellProvider).
 */
export function SellPhotoFileInput({
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

  return (
    <input
      ref={inputRef}
      type="file"
      accept={resolveNativeImageAccept("gallery")}
      multiple={multiple}
      disabled={disabled}
      onChange={handleChange}
      data-native-photo-picker={NATIVE_PHOTO_PICKER_V1.version}
      data-universal-photo-intent="gallery"
      data-product-integration-entry="gallery_picker"
      className={cn(
        placement === "overlay"
          ? nativeImageFileInputOverlayClassName
          : nativeImageFileInputClassName,
        className,
      )}
    />
  );
}
