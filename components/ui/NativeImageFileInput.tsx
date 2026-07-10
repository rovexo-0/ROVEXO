"use client";

import type { ChangeEvent } from "react";
import { cn } from "@/lib/cn";
import {
  nativeImageFileInputClassName,
  nativeImageFileInputOverlayClassName,
  resolveNativeImageAccept,
  resolveNativeImageCapture,
  type NativeImageFileInputProps,
} from "@/lib/media/native-image-picker";

export function NativeImageFileInput({
  id,
  multiple = false,
  accept,
  disabled = false,
  className,
  placement = "associated",
  intent = "gallery",
  onFilesSelected,
}: NativeImageFileInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      onFilesSelected(event.target.files);
    }
    event.target.value = "";
  };

  const resolvedAccept = accept ?? resolveNativeImageAccept(intent);
  const capture = resolveNativeImageCapture(intent);

  return (
    <input
      id={id}
      type="file"
      accept={resolvedAccept}
      multiple={multiple}
      disabled={disabled}
      capture={capture}
      onChange={handleChange}
      className={cn(
        placement === "overlay" ? nativeImageFileInputOverlayClassName : nativeImageFileInputClassName,
        className,
      )}
    />
  );
}
