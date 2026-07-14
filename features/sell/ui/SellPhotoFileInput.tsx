"use client";

import type { ChangeEvent } from "react";
import { cn } from "@/lib/cn";
import { nativeImageFileInputOverlayClassName } from "@/lib/media/native-image-picker";

type SellPhotoFileInputProps = {
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  onFilesSelected: (files: FileList) => void;
};

/**
 * Sell Add Photos — Android/iOS native image picker only.
 *
 * Renders exactly:
 *   <input type="file" accept="image/*" multiple />
 *
 * Never forces camera-only mode. Never forces Video Camera.
 * The OS decides Gallery, Google Photos, My Files, Camera, Photos, Files.
 */
export function SellPhotoFileInput({
  multiple = true,
  disabled = false,
  className,
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
      type="file"
      accept="image/*"
      multiple={multiple}
      disabled={disabled}
      onChange={handleChange}
      className={cn(nativeImageFileInputOverlayClassName, className)}
    />
  );
}
