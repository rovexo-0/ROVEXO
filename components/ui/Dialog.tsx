"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ModalContainer } from "@/components/ui/ModalContainer";
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
  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      zIndex={100}
      ariaLabelledBy="rx-dialog-title"
      panelClassName={cn("p-ds-5", focusRing, className)}
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
    </ModalContainer>
  );
}
