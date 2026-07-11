"use client";

import { memo, useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { focusRing } from "@/features/sell/ui/sell-classes";
import { useSell } from "@/features/sell/context/SellProvider";
import { SELL_PHOTO_MAX } from "@/features/sell/types";

const LONG_PRESS_MS = 400;
const MOVE_CANCEL_PX = 12;

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export const SellPhotoRail = memo(function SellPhotoRail() {
  const { draft, addPhotos, removePhoto, reorderPhotos, retryPhotoUpload } = useSell();

  const longPressTimer = useRef<number | null>(null);
  const touchDragIndex = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number; index: number } | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [activeTouch, setActiveTouch] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const photos = draft.photos;
  const canAdd = photos.length < SELL_PHOTO_MAX;

  const handleFilesSelected = useCallback(
    (files: FileList) => {
      void addPhotos(files);
    },
    [addPhotos],
  );

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const onTouchStart = (index: number) => (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY, index };
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      if (touchStart.current?.index !== index) return;
      touchDragIndex.current = index;
      setActiveTouch(index);
    }, LONG_PRESS_MS);
  };

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    const touch = event.touches[0];
    if (!start || !touch) return;

    if (touchDragIndex.current === null) {
      if (Math.abs(touch.clientX - start.x) > MOVE_CANCEL_PX || Math.abs(touch.clientY - start.y) > MOVE_CANCEL_PX) {
        clearLongPress();
        touchStart.current = null;
      }
      return;
    }

    event.preventDefault();
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const tile = target?.closest<HTMLElement>("[data-photo-index]");
    if (!tile) return;
    const next = Number(tile.dataset.photoIndex);
    if (Number.isNaN(next) || next === touchDragIndex.current) return;
    reorderPhotos(touchDragIndex.current, next);
    touchDragIndex.current = next;
    setActiveTouch(next);
  };

  const onTouchEnd = () => {
    clearLongPress();
    touchStart.current = null;
    touchDragIndex.current = null;
    setActiveTouch(null);
  };

  const onFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (!canAdd) return;
    if (event.dataTransfer.files?.length) void addPhotos(event.dataTransfer.files);
  };

  const previewPhoto = previewId ? photos.find((photo) => photo.id === previewId) ?? null : null;

  const tileBase =
    "relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-ds-lg";

  return (
    <section aria-label="Add Photos" className="rx-form-section flex flex-col gap-ds-3 rounded-ds-lg border border-border bg-surface p-ds-4 shadow-ds-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Add Photos</h2>
        <span className="text-xs font-semibold tabular-nums text-text-muted" aria-live="polite">
          {photos.length} / {SELL_PHOTO_MAX}
        </span>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col gap-ds-2">
          <label
            aria-label="Add photo from gallery"
            className={cn(
              "relative flex min-h-[8rem] w-full touch-manipulation flex-col items-center justify-center gap-ds-2 rounded-ds-lg border-2 border-dashed border-primary/40 bg-primary/5 text-primary transition-colors active:bg-primary/10",
              focusRing,
            )}
          >
            <NativeImageFileInput
              intent="gallery"
              placement="overlay"
              multiple
              onFilesSelected={handleFilesSelected}
            />
            <CameraIcon className="pointer-events-none h-7 w-7" />
            <span className="pointer-events-none text-sm font-semibold">Add Photos</span>
            <span className="pointer-events-none text-xs font-normal text-text-muted">
              Maximum {SELL_PHOTO_MAX} photos
            </span>
          </label>

          <label
            aria-label="Take photo with camera"
            className={cn(
              "relative flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-ds-2 rounded-ds-lg border border-border bg-surface text-sm font-semibold text-text-primary active:bg-surface-muted",
              focusRing,
            )}
          >
            <NativeImageFileInput intent="camera" placement="overlay" onFilesSelected={handleFilesSelected} />
            <CameraIcon className="pointer-events-none h-5 w-5 text-primary" />
            <span className="pointer-events-none">Take Photo</span>
          </label>
        </div>
      ) : (
        <div
          className="-mx-ds-1 flex gap-ds-2 overflow-x-auto px-ds-1 pb-ds-1"
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onFileDrop}
          aria-label="Photo rail"
        >
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              data-photo-index={index}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex !== null) reorderPhotos(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              onTouchStart={onTouchStart(index)}
              className={cn(
                tileBase,
                "border border-border bg-surface-muted",
                (dragIndex === index || activeTouch === index) && "scale-95 opacity-80 ring-2 ring-primary",
              )}
            >
              <button
                type="button"
                onClick={() => setPreviewId(photo.id)}
                aria-label={index === 0 ? "Preview main photo" : `Preview photo ${index + 1}`}
                className="h-full w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={index === 0 ? "Cover photo" : `Listing photo ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </button>

              {index === 0 ? (
                <span className="absolute bottom-1 left-1 rounded-ds-sm bg-primary px-1.5 py-0.5 text-[0.625rem] font-semibold text-white">
                  Cover
                </span>
              ) : null}

              <span className="absolute bottom-1 right-1 rounded-ds-sm bg-black/60 px-1.5 py-0.5 text-[0.625rem] font-semibold tabular-nums text-white">
                {index + 1} / {SELL_PHOTO_MAX}
              </span>

              <button
                type="button"
                aria-label={`Delete photo ${index + 1}`}
                onClick={() => void removePhoto(photo.id)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-ds-full bg-black/60 text-white"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>

              {photo.uploadError ? (
                <button
                  type="button"
                  onClick={() => void retryPhotoUpload(photo.id)}
                  className="absolute inset-x-1 bottom-1 rounded-ds-sm bg-danger px-1 py-0.5 text-[0.625rem] font-semibold text-white"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ))}

          {canAdd ? (
            <>
              <label
                aria-label="Add photo from gallery"
                className={cn(
                  tileBase,
                  "touch-manipulation flex-col gap-1 border-2 border-dashed border-primary/40 bg-primary/5 text-primary",
                  focusRing,
                )}
              >
                <NativeImageFileInput
                  intent="gallery"
                  placement="overlay"
                  multiple
                  onFilesSelected={handleFilesSelected}
                />
                <PlusIcon className="pointer-events-none h-6 w-6" />
                <span className="pointer-events-none text-xs font-semibold">Add Photos</span>
              </label>

              <label
                aria-label="Take photo with camera"
                className={cn(
                  tileBase,
                  "touch-manipulation border border-border bg-surface text-primary",
                  focusRing,
                )}
              >
                <NativeImageFileInput intent="camera" placement="overlay" onFilesSelected={handleFilesSelected} />
                <CameraIcon className="pointer-events-none h-6 w-6" />
              </label>
            </>
          ) : null}
        </div>
      )}

      {photos.length > 0 ? (
        <p className="text-xs text-text-muted" aria-live="polite">
          {canAdd
            ? "Tap to preview · long-press or drag to reorder · first photo is your cover image."
            : `Maximum ${SELL_PHOTO_MAX} photos reached.`}
        </p>
      ) : null}

      <ModalContainer
        open={Boolean(previewPhoto)}
        onClose={() => setPreviewId(null)}
        variant="lightbox"
        zIndex={210}
        ariaLabel="Photo preview"
      >
        <button
          type="button"
          aria-label="Close preview"
          onClick={() => setPreviewId(null)}
          className={cn("absolute right-ds-4 top-[max(env(safe-area-inset-top),1rem)] z-10 grid h-11 w-11 place-items-center rounded-ds-full bg-white/10 text-white", focusRing)}
        >
          <CloseIcon className="h-6 w-6" />
        </button>
        {previewPhoto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewPhoto.url ?? previewPhoto.previewUrl}
            alt="Photo preview"
            className="max-h-full max-w-full rounded-ds-lg object-contain"
            decoding="async"
          />
        ) : null}
      </ModalContainer>
    </section>
  );
});
