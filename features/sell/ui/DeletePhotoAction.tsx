"use client";

import { useState } from "react";
import { CanonicalConfirmDialog } from "@/src/components/canonical/dialogs/CanonicalConfirmDialog";
import { useSell } from "@/features/sell/context/SellProvider";

type DeletePhotoActionProps = {
  photoId: string;
  ariaLabel: string;
  className?: string;
};

export function DeletePhotoAction({ photoId, ariaLabel, className }: DeletePhotoActionProps) {
  const { removePhoto } = useSell();
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    void removePhoto(photoId);
    setOpen(false);
  };

  return (
    <>
      <button type="button" aria-label={ariaLabel} onClick={() => setOpen(true)} className={className}>
        ×
      </button>

      <CanonicalConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Remove photo"
        description="This photo will be permanently removed from this listing."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
      />
    </>
  );
}
