"use client";

import { useEffect, useId, useRef } from "react";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { CanonicalButton } from "@/src/components/canonical/CanonicalButton";
import { cdsModalClass } from "@/src/components/canonical/utils";

export type CanonicalConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive confirm action (delete, remove, etc.). */
  destructive?: boolean;
  loading?: boolean;
  confirmDisabled?: boolean;
  /** Close when the backdrop is tapped. Default: true. */
  closeOnBackdropClick?: boolean;
};

/**
 * Canonical confirmation dialog — replaces window.confirm / alert / prompt in product UI.
 */
export function CanonicalConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  confirmDisabled = false,
  closeOnBackdropClick = true,
}: CanonicalConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(open);
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdrop = () => {
    if (closeOnBackdropClick) onClose();
  };

  return (
    <div
      className="cds-confirm-dialog-backdrop cds-modal-backdrop"
      role="presentation"
      onClick={handleBackdrop}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cdsModalClass(destructive ? "delete" : "confirm", "cds-confirm-dialog")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cds-modal__header cds-confirm-dialog__header">
          <h2 id={titleId} className="cds-modal__title">
            {title}
          </h2>
        </div>

        {description ? (
          <div className="cds-modal__body">
            <p id={descriptionId} className="cds-confirm-dialog__description">
              {description}
            </p>
          </div>
        ) : null}

        <div className="cds-modal__footer">
          <CanonicalButton variant="outline" fullWidth onClick={onClose} disabled={loading}>
            {cancelLabel}
          </CanonicalButton>
          <CanonicalButton
            variant={destructive ? "danger" : "primary"}
            fullWidth
            loading={loading}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </CanonicalButton>
        </div>
      </div>
    </div>
  );
}
