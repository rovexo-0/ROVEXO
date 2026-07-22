"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { ImageSearchCamera } from "@/components/home/ImageSearchCamera";
import { storeImageSearchQuery } from "@/lib/image-search/storage";
import { prepareSearchImage } from "@/lib/search/image-pipeline";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type SearchInputActionsProps = {
  className?: string;
};

/**
 * ONE camera system — Absolute Master Freeze.
 * Take/Upload → Crop (auto center) → Confirm → Search.
 * Zero questions (no category/brand/store prompts). Fail → text search.
 */
export function SearchInputActions({ className }: SearchInputActionsProps) {
  const router = useRouter();
  const cameraInputId = useId();
  const [processing, setProcessing] = useState(false);
  const [pendingDataUrl, setPendingDataUrl] = useState<string | null>(null);

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
        router.push("/search");
        return;
      }
      setPendingDataUrl(prepared.dataUrl);
    } catch {
      router.push("/search");
    } finally {
      setProcessing(false);
    }
  }

  function confirmImageSearch() {
    if (!pendingDataUrl) return;
    storeImageSearchQuery(pendingDataUrl);
    setPendingDataUrl(null);
    router.push("/search?visual=1");
  }

  function cancelImageSearch() {
    setPendingDataUrl(null);
  }

  return (
    <>
      <div className={cn("flex items-center gap-0.5", className)}>
        <ImageSearchCamera
          inputId={`${cameraInputId}-camera`}
          processing={processing}
          onFilesSelected={(files) => void handleImageSearchFiles(files)}
        />
      </div>

      {pendingDataUrl
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-ds-4 sm:items-center"
              role="dialog"
              aria-modal="true"
              aria-label="Confirm image search"
            >
              <div className="w-full max-w-md rounded-ds-2xl bg-white p-ds-4 shadow-lg">
                <p className="mb-ds-3 text-sm font-semibold text-text-primary">Confirm photo</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pendingDataUrl}
                  alt=""
                  className="mb-ds-4 aspect-square w-full rounded-ds-xl object-cover"
                />
                <div className="flex gap-ds-2">
                  <button
                    type="button"
                    onClick={cancelImageSearch}
                    className={cn(
                      "flex h-12 flex-1 items-center justify-center rounded-ds-xl border border-border text-sm font-semibold",
                      focusRing,
                      transitionFast,
                    )}
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={confirmImageSearch}
                    className={cn(
                      "flex h-12 flex-1 items-center justify-center rounded-ds-xl bg-primary text-sm font-semibold text-white",
                      focusRing,
                      transitionFast,
                    )}
                  >
                    Search
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
