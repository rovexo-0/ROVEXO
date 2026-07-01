"use client";

import { memo, useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { useSell } from "@/features/sell/context/SellProvider";
import type { SellPhoto } from "@/features/sell/types";
import styles from "@/features/sell/components/PhotoUploader.module.css";

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 12;
const PHOTO_SLOT_COUNT = 8;
const GALLERY_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/*";
const CAMERA_ACCEPT = "image/jpeg,image/png,image/*";

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
    </svg>
  );
}

export const PhotoUploader = memo(function PhotoUploader() {
  const {
    draft,
    addPhotos,
    removePhoto,
    replacePhoto,
    reorderPhotos,
    setMainPhoto,
    retryPhotoUpload,
    isPublishing,
    uploadProgress,
  } = useSell();

  const galleryInputId = useId();
  const cameraInputId = useId();
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetIdRef = useRef<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const touchDragIndexRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; index: number } | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);

  const handleFilesSelected = useCallback(
    (files: FileList | null) => {
      if (files?.length) void addPhotos(files);
    },
    [addPhotos],
  );

  const handleGalleryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(event.target.files);
    event.target.value = "";
  };

  const handleCameraChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(event.target.files);
    event.target.value = "";
  };

  const handleReplaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const targetId = replaceTargetIdRef.current;
    if (file && targetId) replacePhoto(targetId, file);
    event.target.value = "";
    replaceTargetIdRef.current = null;
  };

  const openReplace = (photoId: string) => {
    replaceTargetIdRef.current = photoId;
    const input = replaceInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  };

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

  const slots: Array<SellPhoto | null> = Array.from({ length: PHOTO_SLOT_COUNT }, (_, index) => {
    return draft.photos[index] ?? null;
  });

  const canAddPhotos = draft.photos.length < PHOTO_SLOT_COUNT;

  return (
    <section aria-label="Photos" className="flex flex-col gap-ds-3">
      {isPublishing && uploadProgress > 0 ? (
        <div>
          <div className="h-1.5 overflow-hidden rounded-ds-full bg-surface-muted">
            <div
              className="h-full rounded-ds-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-ds-1 text-xs text-text-secondary">Uploading photos… {uploadProgress}%</p>
        </div>
      ) : null}

      <div className={cn("rx-upload", styles.card)}>
        <input
          ref={replaceInputRef}
          type="file"
          accept={GALLERY_ACCEPT}
          className={styles.hiddenFileInput}
          onChange={handleReplaceChange}
          tabIndex={-1}
          aria-hidden
        />

        <div className={styles.header}>
          <label htmlFor={galleryInputId} className={cn(styles.primaryAction, focusRing)}>
            <input
              id={galleryInputId}
              type="file"
              accept={GALLERY_ACCEPT}
              multiple
              className={styles.hiddenFileInput}
              onChange={handleGalleryChange}
            />
            <CameraIcon className="h-6 w-6 shrink-0" />
            <span className="text-sm font-semibold">Add Photos</span>
          </label>
          <label htmlFor={cameraInputId} className={cn(styles.secondaryAction, focusRing)}>
            <input
              id={cameraInputId}
              type="file"
              accept={CAMERA_ACCEPT}
              capture="environment"
              className={styles.hiddenFileInput}
              onChange={handleCameraChange}
            />
            Take Photo
          </label>
        </div>

        <div
          className={styles.gallery}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          aria-label="Photo gallery slots"
        >
          {slots.map((photo, index) => {
            if (photo) {
              return (
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt={index === 0 ? "Main photo" : `Listing photo ${index + 1}`}
                    className={styles.thumbImage}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />

                  {photo.uploading ? <span className={styles.uploading}>…</span> : null}

                  <span className={styles.thumbIndex} aria-hidden>
                    {index + 1}
                  </span>

                  <div className={styles.thumbOverlay}>
                    {index === 0 ? <span className={styles.badgeMain}>Main</span> : <span />}
                    <div className={styles.thumbActions}>
                      {index > 0 ? (
                        <button
                          type="button"
                          className={styles.actionButtonPrimary}
                          onClick={() => setMainPhoto(photo.id)}
                        >
                          Set as Main
                        </button>
                      ) : (
                        <span />
                      )}
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label={`Replace photo ${index + 1}`}
                          className={styles.actionButton}
                          onClick={() => openReplace(photo.id)}
                        >
                          ↻
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove photo ${index + 1}`}
                          className={styles.actionButton}
                          onClick={() => void removePhoto(photo.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>

                  {photo.uploadError ? (
                    <button
                      type="button"
                      onClick={() => void retryPhotoUpload(photo.id)}
                      className="absolute inset-x-2 bottom-14 rounded-ds-sm bg-danger px-2 py-1 text-[0.625rem] font-semibold text-danger-foreground touch-manipulation"
                    >
                      Retry
                    </button>
                  ) : null}
                </div>
              );
            }

            return (
              <label
                key={`empty-slot-${index}`}
                htmlFor={canAddPhotos ? galleryInputId : undefined}
                data-photo-index={index}
                aria-label={`Add photo to slot ${index + 1}`}
                className={cn(
                  styles.addSlot,
                  !canAddPhotos && styles.addSlotDisabled,
                  focusRing,
                )}
              >
                <span className={styles.slotNumber}>{index + 1}</span>
                {canAddPhotos ? <span className={styles.addSlotLabel}>+</span> : null}
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
});
