"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { storeImageSearchQuery } from "@/lib/image-search/storage";
import { prepareSearchImage } from "@/lib/search/image-pipeline";
import { SearchBarCameraIcon } from "@/features/search/components/SearchBarIcons";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type SearchInputActionsProps = {
  className?: string;
};

/**
 * ONE Camera Search only — Owner Approved Freeze.
 * Take/Upload → Confirm → AUTO SEARCH (no second Search button).
 * No AI · No chat · No questions · Never block.
 */
export function SearchInputActions({ className }: SearchInputActionsProps) {
  const router = useRouter();
  const cameraInputId = useId();
  const [processing, setProcessing] = useState(false);
  const [pendingDataUrl, setPendingDataUrl] = useState<string | null>(null);

  function startAutoSearch(dataUrl?: string | null) {
    if (dataUrl) storeImageSearchQuery(dataUrl);
    setPendingDataUrl(null);
    // Confirm → AUTO SEARCH → results page (animation + matching run there).
    router.push("/search?visual=1");
  }

  async function handleImageSearchFiles(files: FileList) {
    const file = files[0];
    if (!file) return;
    setProcessing(true);
    try {
      const prepared = await prepareSearchImage(file, {
        centerCrop: true,
        rotateDeg: 0,
        maxEdge: 640,
      });
      if (!prepared.ok) {
        // Still AUTO SEARCH — results page fills recommended (zero dead ends).
        startAutoSearch(null);
        return;
      }
      setPendingDataUrl(prepared.dataUrl);
    } catch {
      startAutoSearch(null);
    } finally {
      setProcessing(false);
    }
  }

  function confirmPhoto() {
    if (!pendingDataUrl) return;
    // Confirm Photo → AUTO SEARCH (NO BUTTON REQUIRED after this).
    void CAMERA_SEARCH_V1.autoSearchAfterConfirm;
    startAutoSearch(pendingDataUrl);
  }

  function retakePhoto() {
    setPendingDataUrl(null);
  }

  return (
    <>
      <div className={cn("flex shrink-0 items-center", className)}>
        <label
          htmlFor={`${cameraInputId}-camera`}
          className={cn(
            "relative inline-flex h-11 w-11 items-center justify-center rounded-2xl text-text-secondary",
            focusRing,
            transitionFast,
            processing && "pointer-events-none opacity-60",
          )}
          aria-label="Camera search"
        >
          {processing ? (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-text-secondary"
              aria-hidden
            />
          ) : (
            <SearchBarCameraIcon />
          )}
          <NativeImageFileInput
            id={`${cameraInputId}-camera`}
            intent="any"
            placement="overlay"
            disabled={processing}
            onFilesSelected={(files) => void handleImageSearchFiles(files)}
          />
        </label>
      </div>

      {pendingDataUrl
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-ds-4 sm:items-center"
              role="dialog"
              aria-modal="true"
              aria-label="Confirm photo"
            >
              <div className="w-full max-w-md rounded-2xl bg-white p-ds-4 shadow-lg">
                <p className="mb-ds-3 text-sm font-semibold text-text-primary">Confirm photo</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pendingDataUrl}
                  alt=""
                  className="mb-ds-4 aspect-square w-full rounded-2xl object-cover"
                />
                <div className="flex gap-ds-2">
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className={cn(
                      "flex h-11 flex-1 items-center justify-center rounded-2xl border border-border text-sm font-semibold",
                      focusRing,
                      transitionFast,
                    )}
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={confirmPhoto}
                    className={cn(
                      "flex h-11 flex-1 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-white",
                      focusRing,
                      transitionFast,
                    )}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
