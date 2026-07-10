"use client";

import { memo, useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { focusRing } from "@/components/ui/tokens";
import { useSell } from "@/features/sell/context/SellProvider";
import { SELL_PHOTO_MAX } from "@/features/sell/types";
import styles from "@/features/sell/components/PhotoUploader.module.css";

const LONG_PRESS_MS = 450;
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

export const PhotoUploader = memo(function PhotoUploader() {
  const {
    draft,
    addPhotos,
    removePhoto,
    reorderPhotos,
    retryPhotoUpload,
    isPublishing,
    uploadProgress,
  } = useSell();

  const longPressTimerRef = useRef<number | null>(null);
  const touchDragIndexRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; index: number } | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleFilesSelected = useCallback(
    (files: FileList) => {
      void addPhotos(files);
    },
    [addPhotos],
  );
  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = (index: number) => (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, index };
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      if (!touchStartRef.current || touchStartRef.current.index !== index) return;
      touchDragIndexRef.current = index;
      setTouchDragIndex(index);
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;

    const touch = event.touches[0];
    if (!touch) return;

    const dx = Math.abs(touch.clientX - start.x);
    const dy = Math.abs(touch.clientY - start.y);

    if (touchDragIndexRef.current === null) {
      if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
        clearLongPress();
        touchStartRef.current = null;
      }
      return;
    }

    event.preventDefault();
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const thumb = target?.closest<HTMLElement>("[data-photo-index]");
    if (!thumb) return;
    const nextIndex = Number(thumb.dataset.photoIndex);
    if (Number.isNaN(nextIndex) || nextIndex === touchDragIndexRef.current) return;
    reorderPhotos(touchDragIndexRef.current, nextIndex);
    touchDragIndexRef.current = nextIndex;
    setTouchDragIndex(nextIndex);
  };

  const handleTouchEnd = () => {
    clearLongPress();
    touchStartRef.current = null;
    touchDragIndexRef.current = null;
    setTouchDragIndex(null);
  };

  const photos = draft.photos;
  const canAddPhotos = photos.length < SELL_PHOTO_MAX;
  const isFull = photos.length >= SELL_PHOTO_MAX;

  const handleFileDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (photos.length >= SELL_PHOTO_MAX) return;
      const files = event.dataTransfer.files;
      if (files?.length) void addPhotos(files);
    },
    [addPhotos, photos.length],
  );

  const previewPhoto = previewId ? photos.find((photo) => photo.id === previewId) ?? null : null;

  return (
    <section aria-label="Photos" className={cn("rx-form-section", styles.card)}>
      <div className="flex items-center justify-between gap-ds-2">
        <h2 className="text-sm font-semibold text-text-primary">Photos</h2>
        <span className="text-xs font-semibold text-text-muted tabular-nums" aria-live="polite">
          {photos.length} / {SELL_PHOTO_MAX}
        </span>
      </div>

      {isPublishing && uploadProgress > 0 ? (
        <div className="mt-ds-3">
          <div className="h-1.5 overflow-hidden rounded-ds-full bg-surface-muted">
            <div
              className="h-full rounded-ds-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-ds-1 text-xs text-text-secondary">Uploading photos… {uploadProgress}%</p>
        </div>
      ) : null}

      {photos.length === 0 ? (
        <div className={styles.emptyState}>
          <label className={cn(styles.emptyCard, focusRing)} aria-label="Add photo from gallery">
            <NativeImageFileInput
              intent="gallery"
              placement="overlay"
              multiple
              onFilesSelected={handleFilesSelected}
            />
            <PlusIcon className={cn(styles.emptyCardIcon, "pointer-events-none")} />
            <span className="pointer-events-none">Add Photo</span>
          </label>

          <label className={cn(styles.takePhotoButton, focusRing)} aria-label="Take photo with camera">
            <NativeImageFileInput intent="camera" placement="overlay" onFilesSelected={handleFilesSelected} />
            <CameraIcon className={cn(styles.takePhotoIcon, "pointer-events-none")} />
            <span className="pointer-events-none">Take Photo</span>
          </label>
        </div>
      ) : (
        <div
          className={styles.gallery}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleFileDrop}
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
              onTouchStart={handleTouchStart(index)}
              className={cn(
                styles.thumb,
                (dragIndex === index || touchDragIndex === index) && styles.thumbDragging,
              )}
            >
              <button
                type="button"
                className={styles.thumbButton}
                onClick={() => setPreviewId(photo.id)}
                aria-label={
                  index === 0 ? "Preview main photo" : `Preview photo ${index + 1}`
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={index === 0 ? "Main photo" : `Listing photo ${index + 1}`}
                  className={styles.thumbImage}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </button>

              {photo.uploading ? <span className={styles.uploading}>…</span> : null}

              {index === 0 ? <span className={styles.badgeMainCover}>Main</span> : null}

              <button
                type="button"
                aria-label={`Delete photo ${index + 1}`}
                className={styles.deleteButton}
                onClick={() => void removePhoto(photo.id)}
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>

              {photo.uploadError ? (
                <button
                  type="button"
                  onClick={() => void retryPhotoUpload(photo.id)}
                  className="absolute inset-x-1 bottom-1 rounded-ds-sm bg-danger px-1 py-0.5 text-[0.625rem] font-semibold text-danger-foreground touch-manipulation"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ))}

          {canAddPhotos ? (
            <>
              <label className={cn(styles.addTile, focusRing)} aria-label="Add photo from gallery">
                <NativeImageFileInput
                  intent="gallery"
                  placement="overlay"
                  multiple
                  onFilesSelected={handleFilesSelected}
                />
                <PlusIcon className={cn(styles.addTileIcon, "pointer-events-none")} />
                <span className="pointer-events-none">Add Photo</span>
              </label>

              <label className={cn(styles.cameraTile, focusRing)} aria-label="Take photo with camera">
                <NativeImageFileInput intent="camera" placement="overlay" onFilesSelected={handleFilesSelected} />
                <CameraIcon className={cn(styles.addTileIcon, "pointer-events-none")} />
              </label>
            </>
          ) : null}        </div>
      )}

      {isFull ? (
        <p className="mt-ds-2 text-xs font-medium text-text-muted" aria-live="polite">
          Maximum {SELL_PHOTO_MAX} photos
        </p>
      ) : (
        <p className="mt-ds-2 text-xs text-text-muted">
          Tap a photo to preview. Drag to reorder — the first photo is your Main image.
        </p>
      )}

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
          className={cn(styles.previewClose, focusRing)}
          onClick={() => setPreviewId(null)}
        >
          <CloseIcon className="h-6 w-6" />
        </button>
        {previewPhoto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewPhoto.url ?? previewPhoto.previewUrl}
            alt="Photo preview"
            className={styles.previewImage}
            decoding="async"
          />
        ) : null}
      </ModalContainer>
    </section>
  );
});
