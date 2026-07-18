"use client";

import { GalleryLineIcon } from "@/components/icons/RvxLineIcons";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export type ImageSearchCameraProps = {
  inputId: string;
  processing?: boolean;
  disabled?: boolean;
  onFilesSelected: (files: FileList) => void;
};

/**
 * Native camera / photo-library entry — opens the OS picker immediately on tap.
 * No in-browser camera overlay; heavy work runs after the user selects a photo.
 */
export function ImageSearchCamera({
  inputId,
  processing = false,
  disabled = false,
  onFilesSelected,
}: ImageSearchCameraProps) {
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "homepage-search__camera",
        focusRing,
        transitionFast,
        (disabled || processing) && "pointer-events-none opacity-60",
      )}
      aria-label="Image search"
    >
      {processing ? (
        <span className="homepage-search__spinner" aria-hidden>
          <svg className="homepage-search__spinner-icon" viewBox="0 0 24 24">
            <circle
              className="homepage-search__spinner-track"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
            <path
              className="homepage-search__spinner-head"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
          </svg>
        </span>
      ) : (
        <GalleryLineIcon className="h-5 w-5" aria-hidden />
      )}
      <NativeImageFileInput
        id={inputId}
        intent="any"
        placement="overlay"
        disabled={disabled || processing}
        onFilesSelected={onFilesSelected}
      />
    </label>
  );
}
