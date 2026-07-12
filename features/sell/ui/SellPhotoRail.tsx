"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { CanonicalCard } from "@/src/components/canonical";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { focusRing } from "@/features/sell/ui/sell-classes";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors, SELL_PHOTO_MAX } from "@/features/sell/types";
import { DeletePhotoAction } from "@/features/sell/ui/DeletePhotoAction";
import { SellInlineError } from "@/features/sell/ui/SellPrimitives";

const LONG_PRESS_MS = 400;
const MOVE_CANCEL_PX = 12;

export const SellPhotoRail = memo(function SellPhotoRail({
  onPhotosAdded,
}: {
  onPhotosAdded?: () => void;
}) {
  const { draft, addPhotos, replacePhoto, reorderPhotos, retryPhotoUpload, showValidation } = useSell();

  const photoError = useMemo(() => {
    if (!showValidation) return undefined;
    return getListingValidationErrors(draft, { mode: "quick", showErrors: true }).photos;
  }, [draft, showValidation]);

  const longPressTimer = useRef<number | null>(null);
  const touchDragIndex = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number; index: number } | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [activeTouch, setActiveTouch] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const photos = draft.photos;
  const canAdd = photos.length < SELL_PHOTO_MAX;
  const onPhotosAddedRef = useRef(onPhotosAdded);
  onPhotosAddedRef.current = onPhotosAdded;
  const announcedPhotos = useRef(false);

  useEffect(() => {
    if (!announcedPhotos.current && photos.length > 0) {
      announcedPhotos.current = true;
      onPhotosAddedRef.current?.();
    }
    if (photos.length === 0) {
      announcedPhotos.current = false;
    }
  }, [photos.length]);

  const handleFilesSelected = useCallback(
    (files: FileList) => {
      void addPhotos(files);
    },
    [addPhotos],
  );

  const handleReplaceSelected = useCallback(
    (photoId: string, files: FileList) => {
      const file = files[0];
      if (!file) return;
      replacePhoto(photoId, file);
      void retryPhotoUpload(photoId);
      setPreviewId(null);
    },
    [replacePhoto, retryPhotoUpload],
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
    "relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--cds-radius-md)]";

  const addPhotosControl = (
    <label
      aria-label="Add Photos"
      className={cn(
        "sell-photo-upload relative flex min-h-[7rem] w-full flex-col items-center justify-center gap-ds-2",
        photoError && "border-destructive/50",
        focusRing,
      )}
    >
      <NativeImageFileInput
        intent="gallery"
        placement="overlay"
        multiple
        onFilesSelected={handleFilesSelected}
      />
      <Plus className="h-6 w-6 text-primary" aria-hidden />
      <span className="text-sm font-medium text-text-primary">Add Photos</span>
    </label>
  );

  return (
    <CanonicalCard
      variant="medium"
      role="region"
      className={cn(
        "relative flex flex-col gap-ds-3 overflow-hidden p-ds-4",
        photoError && "ring-2 ring-destructive/40",
      )}
      aria-label="Add Photos"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">Add Photos</span>
        <span className="text-xs font-medium tabular-nums text-text-muted" aria-live="polite">
          {photos.length}/{SELL_PHOTO_MAX}
        </span>
      </div>

      {photos.length === 0 ? (
        addPhotosControl
      ) : (
        <div
          className="flex gap-ds-2 overflow-x-auto pb-ds-1"
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onFileDrop}
          aria-label="Photo gallery"
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
                (dragIndex === index || activeTouch === index) && "ring-2 ring-primary",
              )}
            >
              <button
                type="button"
                onClick={() => setPreviewId(photo.id)}
                aria-label={index === 0 ? "Preview cover photo" : `Preview photo ${index + 1}`}
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

              <DeletePhotoAction
                photoId={photo.id}
                ariaLabel={`Delete photo ${index + 1}`}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-ds-full bg-black/60 text-xs text-white"
              />

              {photo.uploading ? (
                <div className="absolute inset-0 grid place-items-center bg-black/40">
                  <span
                    className="h-6 w-6 animate-spin rounded-ds-full border-2 border-white border-t-transparent"
                    aria-hidden
                  />
                  <span className="sr-only">Uploading photo</span>
                </div>
              ) : null}

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
            <label
              aria-label="Add Photos"
              className={cn(tileBase, "sell-photo-upload flex-col gap-1", focusRing)}
            >
              <NativeImageFileInput
                intent="gallery"
                placement="overlay"
                multiple
                onFilesSelected={handleFilesSelected}
              />
              <Plus className="h-5 w-5 text-primary" aria-hidden />
              <span className="text-[0.625rem] font-medium text-text-primary">Add</span>
            </label>
          ) : null}
        </div>
      )}

      <ModalContainer
        open={Boolean(previewPhoto)}
        onClose={() => setPreviewId(null)}
        variant="lightbox"
        zIndex={210}
        ariaLabel="Photo preview"
        lockScroll={false}
      >
        <button
          type="button"
          aria-label="Close preview"
          onClick={() => setPreviewId(null)}
          className={cn(
            "absolute right-ds-4 top-[max(env(safe-area-inset-top),1rem)] z-10 grid h-11 w-11 place-items-center rounded-ds-full bg-black/50 text-white",
            focusRing,
          )}
        >
          ×
        </button>
        {previewPhoto ? (
          <div className="flex max-h-full max-w-full flex-col items-center gap-ds-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto.url ?? previewPhoto.previewUrl}
              alt="Photo preview"
              className="max-h-[70vh] max-w-full rounded-ds-lg object-contain"
              decoding="async"
            />
            <label
              className={cn(
                "relative flex min-h-[44px] min-w-[8rem] items-center justify-center rounded-ds-md bg-white px-ds-4 text-sm font-semibold text-text-primary",
                focusRing,
              )}
            >
              <NativeImageFileInput
                intent="gallery"
                placement="overlay"
                onFilesSelected={(files) => handleReplaceSelected(previewPhoto.id, files)}
              />
              Replace
            </label>
          </div>
        ) : null}
      </ModalContainer>

      <SellInlineError message={photoError} />
    </CanonicalCard>
  );
});
