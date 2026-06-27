"use client";

import { cn } from "@/lib/cn";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { focusRing } from "@/components/ui/tokens";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Dialog({ open, onClose, title, children, footer, className }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-ds-4 sm:items-center" role="presentation">
      <button type="button" className="rx-sheet-overlay absolute inset-0" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rx-dialog-title"
        className={cn("rx-sheet relative z-[101] w-full max-w-lg p-ds-5", focusRing, className)}
      >
        <div className="mb-ds-4 flex items-start justify-between gap-ds-3">
          <h2 id="rx-dialog-title" className="text-title text-text-primary">
            {title}
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <div className="text-body text-text-secondary">{children}</div>
        {footer ? <div className="mt-ds-5 flex flex-wrap justify-end gap-ds-2">{footer}</div> : null}
      </div>
    </div>
  );
}
