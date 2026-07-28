"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { SellPhotoFileInput } from "@/features/sell/ui/SellPhotoFileInput";
import { focusRing } from "@/features/sell/ui/sell-classes";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors, SELL_PHOTO_MAX } from "@/features/sell/types";
import { DeletePhotoAction } from "@/features/sell/ui/DeletePhotoAction";
import { SellInlineError } from "@/features/sell/ui/SellPrimitives";

const LONG_PRESS_MS = 400;
const MOVE_CANCEL_PX = 12;

/** Sell Photo Premium Micro Freeze — 76×114 (4:5), radius 16, gap 6. */
const PHOTO_TILE =
  "sell-photo-tile relative flex h-[114px] w-[76px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[16px]";

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

  const addPhotosControl = (
    <label
      aria-label="Add Photos"
      className={cn(
        PHOTO_TILE,
        "sell-photo-tile--add gap-1",
        photoError && "cds-menu-row--error",
        focusRing,
      )}
    >
      <SellPhotoFileInput multiple onFilesSelected={handleFilesSelected} />
      <CameraLineIcon className="h-5 w-5 text-primary" aria-hidden />
      <span className="sell-photo-tile__add-label">Add Photos</span>
    </label>
  );

  return (
    <div
      role="region"
      className={cn("relative flex w-full max-w-none flex-col gap-2", photoError && "cds-field--error")}
      aria-label="Photos"
      data-blood-code-xxi-photo="1"
    >
      <div className="sell-photo-section__header">
        <span className="text-sm font-medium text-text-primary">Photos</span>
        <span className="text-xs font-medium tabular-nums text-text-muted" aria-live="polite">
          {photos.length} / {SELL_PHOTO_MAX}
        </span>
      </div>

      <div
        className="sell-photo-rail overflow-x-auto"
        onTouchMove={photos.length > 0 ? onTouchMove : undefined}
        onTouchEnd={photos.length > 0 ? onTouchEnd : undefined}
        onTouchCancel={photos.length > 0 ? onTouchEnd : undefined}
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
              PHOTO_TILE,
              "sell-photo-tile--uploaded",
              (dragIndex === index || activeTouch === index) && "ring-2 ring-primary",
            )}
          >
            <button
              type="button"
              onClick={() => setPreviewId(photo.id)}
              aria-label={index === 0 ? "Preview cover photo" : `Preview photo ${index + 1}`}
              className="sell-photo-tile__preview"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- blob:/draft preview; SafeImage uses next/image */}
              <img
                src={photo.previewUrl?.trim() || photo.url?.trim() || "/placeholder-product.svg"}
                alt={index === 0 ? "Cover photo" : `Listing photo ${index + 1}`}
                className="sell-photo-tile__image"
                loading="lazy"
                decoding="async"
                draggable={false}
                style={{ objectFit: "cover", objectPosition: "center center" }}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/placeholder-product.svg";
                }}
              />
            </button>

            <DeletePhotoAction
              photoId={photo.id}
              ariaLabel={`Delete photo ${index + 1}`}
              className="sell-photo-tile__delete"
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
                className="absolute inset-x-0 bottom-0 flex min-h-[44px] items-end justify-center rounded-b-[16px] bg-gradient-to-t from-black/70 to-transparent px-1 pb-1 text-[0.625rem] font-semibold text-white"
              >
                <span className="rounded-ds-sm bg-danger px-1.5 py-0.5">Retry</span>
              </button>
            ) : null}
          </div>
        ))}

        {canAdd ? addPhotosControl : null}
      </div>

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
            {/* eslint-disable-next-line @next/next/no-img-element -- blob:/draft preview; SafeImage uses next/image */}
            <img
              src={
                previewPhoto.url?.trim() ||
                previewPhoto.previewUrl?.trim() ||
                "/placeholder-product.svg"
              }
              alt="Photo preview"
              className="max-h-[70vh] max-w-full rounded-ds-lg object-contain"
              decoding="async"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/placeholder-product.svg";
              }}
            />
            <label
              className={cn(
                "relative flex min-h-[44px] min-w-[8rem] items-center justify-center rounded-ds-md bg-white px-ds-4 text-sm font-semibold text-text-primary",
                focusRing,
              )}
            >
              <SellPhotoFileInput
                multiple={false}
                onFilesSelected={(files) => handleReplaceSelected(previewPhoto.id, files)}
              />
              Replace
            </label>
          </div>
        ) : null}
      </ModalContainer>

      <SellInlineError message={photoError} />
    </div>
  );
});
