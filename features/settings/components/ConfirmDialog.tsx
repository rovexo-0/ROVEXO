"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      onClose={onCancel}
      zIndex={120}
      ariaLabelledBy="confirm-dialog-title"
      panelClassName="p-ds-5"
    >
      <h2 id="confirm-dialog-title" className="text-base font-semibold text-text-primary">
        {title}
      </h2>
      <p id="confirm-dialog-description" className="mt-ds-2 text-sm text-text-secondary">
        {description}
      </p>
      {children}

      <div className="mt-ds-4 flex flex-col gap-ds-2">
        <Button
          variant="outline"
          fullWidth
          size="md"
          disabled={confirmDisabled}
          className={cn("min-h-ds-7 rounded-ds-lg", destructive && "text-danger")}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className={cn(
            "min-h-ds-7 rounded-ds-lg px-ds-4 py-ds-3 text-sm font-semibold text-text-primary",
            focusRing,
          )}
        >
          {cancelLabel}
        </button>
      </div>
    </ModalContainer>
  );
}
