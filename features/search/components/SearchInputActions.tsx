"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { storeImageSearchQuery } from "@/lib/image-search/storage";
import { prepareSearchImage } from "@/lib/search/image-pipeline";
import { SearchBarCameraIcon } from "@/features/search/components/SearchBarIcons";
import { useSearchOverlay } from "@/features/search/hooks/use-search-overlay";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import "@/styles/rovexo/image-search.css";

type SearchInputActionsProps = {
  className?: string;
};

const STEP_MS = CAMERA_SEARCH_V1.stepDurationMs;
const STEPS = CAMERA_SEARCH_V1.loadingSteps;
const ABSOLUTE_MAX_MS = CAMERA_SEARCH_V1.targetsMs.absoluteMaximum;

/**
 * Camera entry UI only — does NOT own close/navigate/replace.
 * After Promise.all → SearchProvider.setResults + setResultsReady.
 * SearchProvider closes overlay then gated navigation to results.
 */
export function SearchInputActions({ className }: SearchInputActionsProps) {
  const search = useSearchOverlay();
  const cameraInputId = useId();
  const [processing, setProcessing] = useState(false);
  const [pendingDataUrl, setPendingDataUrl] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const loading = search.loading;

  useEffect(() => {
    if (!loading) return;
    setStepIndex(0);
    const timer = window.setInterval(() => {
      setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function runAutoSearch(dataUrl: string | null) {
    if (dataUrl) storeImageSearchQuery(dataUrl);
    setPendingDataUrl(null);
    search.setLoading(true);
    search.setResultsReady(false);

    const controller = new AbortController();
    const hardCap = window.setTimeout(() => controller.abort(), ABSOLUTE_MAX_MS);

    try {
      const { runCameraSearchMaster } = await import("@/lib/image-search/search");
      const minUx = new Promise<void>((resolve) => {
        window.setTimeout(resolve, STEPS.length * STEP_MS);
      });

      const [payload] = await Promise.all([
        runCameraSearchMaster(dataUrl, controller.signal),
        minUx,
      ]);

      // Provider owns results + ready → close → navigate (not this component).
      search.setResults(payload);
      search.setLoading(false);
      search.setResultsReady(true);
    } catch {
      try {
        const { runCameraSearchMaster } = await import("@/lib/image-search/search");
        const payload = await runCameraSearchMaster(dataUrl);
        search.setResults(payload);
      } catch {
        search.setResults({
          queryDataUrl: dataUrl,
          matches: [],
          categories: [],
          filters: { brands: [], priceRanges: [] },
          hasExactMatch: false,
          readyAt: Date.now(),
        });
      }
      search.setLoading(false);
      search.setResultsReady(true);
    } finally {
      window.clearTimeout(hardCap);
    }
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
        void runAutoSearch(null);
        return;
      }
      setPendingDataUrl(prepared.dataUrl);
    } catch {
      void runAutoSearch(null);
    } finally {
      setProcessing(false);
    }
  }

  function confirmPhoto() {
    if (!pendingDataUrl || loading) return;
    void CAMERA_SEARCH_V1.autoSearchAfterConfirm;
    void runAutoSearch(pendingDataUrl);
  }

  function retakePhoto() {
    if (loading) return;
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
            (processing || loading) && "pointer-events-none opacity-60",
          )}
          aria-label="Camera search"
        >
          {processing || loading ? (
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
            disabled={processing || loading}
            onFilesSelected={(files) => void handleImageSearchFiles(files)}
          />
        </label>
      </div>

      {pendingDataUrl && !loading
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

      {loading
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-ds-4 sm:items-center"
              role="status"
              aria-live="polite"
              aria-label="Searching"
            >
              <div className="w-full max-w-md rounded-2xl bg-white p-ds-4 shadow-lg">
                <p className="mb-ds-3 text-sm font-semibold text-text-primary">AUTO SEARCH</p>
                <ol className="rx-image-search-results__checklist">
                  {STEPS.map((label, index) => {
                    const done = index <= stepIndex;
                    return (
                      <li
                        key={label}
                        className={
                          done
                            ? "rx-image-search-results__check rx-image-search-results__check--done"
                            : "rx-image-search-results__check"
                        }
                      >
                        <span aria-hidden>{done ? "✓" : "·"}</span>
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
