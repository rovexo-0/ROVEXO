"use client";

import { useSellActions } from "@/features/sell/context/SellProvider";

type DeletePhotoActionProps = {
  photoId: string;
  ariaLabel: string;
  className?: string;
  /** FLIP measurement before optimistic remove. */
  onBeforeDelete?: (photoId: string) => void;
  /** After local remove commits — play slide-left (150–200ms). */
  onAfterDelete?: (photoId: string) => void;
};

/**
 * Instant photo delete — Photo Delete UX v1.0.
 * Tap × → remove immediately. NO confirmation dialog. NO popup.
 */
export function DeletePhotoAction({
  photoId,
  ariaLabel,
  className,
  onBeforeDelete,
  onAfterDelete,
}: DeletePhotoActionProps) {
  const { removePhoto } = useSellActions();

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      data-photo-delete-ux="v1.0"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onBeforeDelete?.(photoId);
        void removePhoto(photoId).then(() => {
          // Double rAF: wait for React commit + layout before FLIP play.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              onAfterDelete?.(photoId);
            });
          });
        });
      }}
    >
      ×
    </button>
  );
}
