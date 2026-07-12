"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import {
  RX_MODAL_BODY,
  RX_MODAL_CENTERED,
  RX_MODAL_FULLSCREEN,
  RX_MODAL_LIGHTBOX,
  RX_MODAL_PANEL,
  RX_MODAL_SHELL,
} from "@/lib/mobile-ui/scroll-standard";

export type ModalContainerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** sheet | fullscreen | centered | lightbox */
  variant?: "sheet" | "fullscreen" | "centered" | "lightbox";
  zIndex?: number;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  panelClassName?: string;
  lockScroll?: boolean;
  onBackdropClick?: () => void;
  /** When false, children render directly (lightbox media). Default true for sheet/centered. */
  scrollPanel?: boolean;
};

/**
 * Canonical modal / bottom-sheet / fullscreen / lightbox shell.
 */
export function ModalContainer({
  open,
  onClose,
  children,
  variant = "sheet",
  zIndex = 100,
  ariaLabel,
  ariaLabelledBy,
  className,
  panelClassName,
  lockScroll = variant === "sheet" || variant === "centered",
  onBackdropClick,
  scrollPanel = variant === "sheet" || variant === "centered",
}: ModalContainerProps) {
  useBodyScrollLock(open && lockScroll);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdrop = onBackdropClick ?? onClose;

  if (variant === "fullscreen") {
    return (
      <div
        className={cn(RX_MODAL_FULLSCREEN, className)}
        style={{ ["--rx-modal-z" as string]: zIndex, zIndex }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      >
        {children}
      </div>
    );
  }

  if (variant === "lightbox") {
    return (
      <div
        className={cn(RX_MODAL_LIGHTBOX, className)}
        style={{ ["--rx-modal-z" as string]: zIndex, zIndex }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={handleBackdrop}
      >
        <div
          className={cn("rx-modal-shell-lightbox__content", panelClassName)}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  }

  if (variant === "centered") {
    return (
      <div
        className={cn(RX_MODAL_CENTERED, className)}
        style={{ ["--rx-modal-z" as string]: zIndex, zIndex }}
        role="presentation"
      >
        <button
          type="button"
          className="rx-modal-shell-centered__backdrop"
          aria-label="Close"
          onClick={handleBackdrop}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            scrollPanel ? "rx-modal-shell-centered__panel rx-sheet" : "relative z-[1]",
            panelClassName,
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(RX_MODAL_SHELL, className)}
      style={{ ["--rx-modal-z" as string]: zIndex, zIndex }}
      role="presentation"
    >
      <button
        type="button"
        className="rx-modal-shell__backdrop rx-sheet-overlay"
        aria-label="Close"
        onClick={handleBackdrop}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn("rx-sheet", RX_MODAL_PANEL, panelClassName)}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export type ModalBodyProps = {
  children: ReactNode;
  className?: string;
};

/** Scrollable body inside a fullscreen ModalContainer. */
export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn(RX_MODAL_BODY, className)}>{children}</div>;
}
