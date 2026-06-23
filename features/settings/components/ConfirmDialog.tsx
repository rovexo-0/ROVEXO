"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
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
    <div className="fixed inset-0 z-[120] flex items-end justify-center px-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 premium-sheet-overlay"
        onClick={onCancel}
      />

      <Card
        padding="md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="premium-sheet relative w-full max-w-sm"
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-text-primary">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-ds-2 text-sm text-text-secondary">
          {description}
        </p>

        <div className="mt-ds-4 flex flex-col gap-ds-2">
          <Button
            variant="outline"
            fullWidth
            size="md"
            className="min-h-ds-7 rounded-ds-lg text-danger"
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
      </Card>
    </div>
  );
}
