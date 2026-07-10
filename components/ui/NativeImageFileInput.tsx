"use client";

import type { ChangeEvent } from "react";
import { cn } from "@/lib/cn";
import {
  NATIVE_IMAGE_ACCEPT,
  nativeImageFileInputClassName,
  nativeImageFileInputOverlayClassName,
  type NativeImageFileInputProps,
} from "@/lib/media/native-image-picker";

export function NativeImageFileInput({
  id,
  multiple = false,
  accept = NATIVE_IMAGE_ACCEPT,
  disabled = false,
  className,
  placement = "associated",
  onFilesSelected,
}: NativeImageFileInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      onFilesSelected(event.target.files);
    }
    event.target.value = "";
  };

  return (
    <input
      id={id}
      type="file"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      onChange={handleChange}
      className={cn(
        placement === "overlay" ? nativeImageFileInputOverlayClassName : nativeImageFileInputClassName,
        className,
      )}
    />
  );
}
