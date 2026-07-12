"use client";

import { useEffect, type ReactNode } from "react";
import {
  CheckLineIcon,
  InfoLineIcon,
  ShieldLineIcon,
} from "@/components/icons/RvxLineIcons";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { CanonicalButton } from "./CanonicalButton";
import { cdsModalClass } from "./utils";
import type { CanonicalModalVariant } from "./tokens";

export type CanonicalModalProps = {
  open: boolean;
  onClose: () => void;
  variant?: CanonicalModalVariant;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  loading?: boolean;
  confirmDisabled?: boolean;
  className?: string;
};

function ModalIcon({ variant }: { variant: CanonicalModalVariant }) {
  if (variant === "success") return <CheckLineIcon />;
  if (variant === "delete" || variant === "warning") return <ShieldLineIcon />;
  return <InfoLineIcon />;
}

/**
 * Canonical modal — confirm, delete, warning, success, information.
 */
export function CanonicalModal({
  open,
  onClose,
  variant = "confirm",
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  confirmDisabled = false,
  className,
}: CanonicalModalProps) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirmVariant = variant === "delete" || variant === "warning" ? "danger" : "primary";

  return (
    <div className="cds-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cds-modal-title"
        className={cdsModalClass(variant, className)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cds-modal__header">
          <div className="cds-modal__icon" aria-hidden>
            <ModalIcon variant={variant} />
          </div>
          <h2 id="cds-modal-title" className="cds-modal__title">
            {title}
          </h2>
        </div>
        {children ? <div className="cds-modal__body">{children}</div> : null}
        <div className="cds-modal__footer">
          <CanonicalButton variant="ghost" fullWidth onClick={onClose} disabled={loading}>
            {cancelLabel}
          </CanonicalButton>
          {onConfirm ? (
            <CanonicalButton
              variant={confirmVariant}
              fullWidth
              loading={loading}
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </CanonicalButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
