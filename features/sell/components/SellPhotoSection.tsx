"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { SellFormController } from "@/features/sell/hooks/use-sell-wizard";

type SellPhotoSectionProps = {
  form: SellFormController;
  uploadProgress?: number;
  quickMode?: boolean;
};

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

function GripIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="9" cy="8" r="1.5" />
      <circle cx="15" cy="8" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="16" r="1.5" />
      <circle cx="15" cy="16" r="1.5" />
    </svg>
  );
}

export function SellPhotoSection({ form, uploadProgress = 0, quickMode = false }: SellPhotoSectionProps) {
  const { draft, addPhotos, removePhoto, replacePhoto, reorderPhotos, retryPhotoUpload, isPublishing } =
    form;
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const remainingSlots = 8 - draft.photos.length;

  const handleGalleryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) addPhotos(event.target.files);
    event.target.value = "";
  };

  const handleCameraChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) addPhotos(event.target.files);
    event.target.value = "";
  };

  const handleReplaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && replaceTargetId) replacePhoto(replaceTargetId, file);
    event.target.value = "";
    setReplaceTargetId(null);
  };

  const openReplace = (photoId: string) => {
    setReplaceTargetId(photoId);
    replaceInputRef.current?.click();
  };

  return (
    <section aria-labelledby="sell-photos-heading" className="flex flex-col gap-ds-3">
      <div>
        <h2 id="sell-photos-heading" className="text-base font-semibold text-text-primary">
          Photos
        </h2>
        <p className="mt-ds-1 text-sm text-text-secondary">Add up to 8 photos</p>
        {isPublishing && uploadProgress > 0 && (
          <div className="mt-ds-2">
            <div className="h-1.5 overflow-hidden rounded-ds-full bg-surface-muted">
              <div
                className="h-full rounded-ds-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-ds-1 text-xs text-text-secondary">Uploading photos… {uploadProgress}%</p>
          </div>
        )}
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        onChange={handleGalleryChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        className="sr-only"
        onChange={handleCameraChange}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        onChange={handleReplaceChange}
      />

      {draft.photos.length === 0 ? (
        <div className={cn("flex gap-ds-2", quickMode && "flex-col sm:flex-row")}>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className={cn(
              "premium-upload-zone flex min-h-[88px] flex-1 flex-col items-center justify-center gap-ds-2 px-ds-4 py-ds-4 text-primary",
              focusRing,
            )}
          >
            <CameraIcon className="h-8 w-8" />
            <span className="text-sm font-semibold">Add Photos</span>
            <span className="text-xs text-text-secondary">Upload up to 8 images</span>
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className={cn(
              "premium-btn flex min-h-ds-7 flex-1 items-center justify-center rounded-ds-md border border-border/80 bg-surface/80 px-ds-4 py-ds-3 text-sm font-semibold text-text-primary",
              focusRing,
              quickMode && "min-h-[56px]",
            )}
          >
            Take photo
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-ds-3">
          <div className="flex gap-ds-2 overflow-x-auto overscroll-x-contain pb-ds-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {draft.photos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null) reorderPhotos(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={cn(
                  "relative h-20 w-20 shrink-0 snap-start overflow-hidden rounded-ds-md bg-surface-muted",
                  dragIndex === index && "opacity-70 ring-2 ring-primary",
                )}
              >
                <Image
                  src={photo.previewUrl}
                  alt={index === 0 ? "Main photo" : `Listing photo ${index + 1}`}
                  fill
                  className={cn("object-cover", photo.uploading && "opacity-60")}
                  sizes="80px"
                  draggable={false}
                />

                {photo.uploading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-overlay/40 text-[0.625rem] font-semibold text-text-primary">
                    …
                  </span>
                )}

                {photo.uploadError && (
                  <button
                    type="button"
                    onClick={() => void retryPhotoUpload(photo.id)}
                    className="absolute inset-x-1 bottom-7 rounded-ds-sm bg-danger px-1 py-0.5 text-[0.625rem] font-semibold text-white"
                  >
                    Retry
                  </button>
                )}

                <button
                  type="button"
                  aria-label={`Reorder photo ${index + 1}`}
                  className="absolute bottom-1 left-1 flex h-6 w-6 items-center justify-center rounded-ds-full bg-overlay text-text-primary"
                >
                  <GripIcon className="h-3 w-3" />
                </button>

                <div className="absolute right-1 top-1 flex flex-col gap-0.5">
                  <button
                    type="button"
                    aria-label={`Replace photo ${index + 1}`}
                    onClick={() => openReplace(photo.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-ds-full bg-overlay text-[0.625rem] font-bold text-text-primary"
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove photo ${index + 1}`}
                    onClick={() => void removePhoto(photo.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-ds-full bg-overlay text-sm font-bold text-text-primary"
                  >
                    ×
                  </button>
                </div>

                {index === 0 && (
                  <span className="absolute bottom-1 right-1 rounded-ds-full bg-primary px-ds-2 py-0.5 text-[0.625rem] font-semibold text-primary-foreground">
                    Main
                  </span>
                )}
              </div>
            ))}

            {remainingSlots > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className={cn(
                    "flex h-20 w-20 shrink-0 snap-start flex-col items-center justify-center rounded-ds-md border border-dashed border-border bg-surface-muted text-xs font-semibold text-primary",
                    focusRing,
                  )}
                >
                  + Add
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className={cn(
                    "premium-glass flex h-20 w-20 shrink-0 snap-start flex-col items-center justify-center gap-ds-1 rounded-ds-md text-xs font-semibold text-text-primary",
                    focusRing,
                  )}
                >
                  <CameraIcon className="h-5 w-5" />
                  Camera
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
