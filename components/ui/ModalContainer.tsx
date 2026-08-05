"use client";

import { useEffect, useRef, type ReactNode, type MouseEvent, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useFocusTrap } from "@/hooks/use-focus-trap";
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

type DialogSurfaceProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
};

/** Dialog surface with reusable focus trap (Tab / Shift+Tab / restore). */
function DialogSurface({
  children,
  className,
  style,
  ariaLabel,
  ariaLabelledBy,
  onClick,
}: DialogSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={className}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

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
  const zStyle = { ["--rx-modal-z" as string]: zIndex, zIndex } as CSSProperties;

  if (variant === "fullscreen") {
    return (
      <DialogSurface
        className={cn(RX_MODAL_FULLSCREEN, className)}
        style={zStyle}
        ariaLabel={ariaLabel}
        ariaLabelledBy={ariaLabelledBy}
      >
        {children}
      </DialogSurface>
    );
  }

  if (variant === "lightbox") {
    return (
      <div
        className={cn(RX_MODAL_LIGHTBOX, className)}
        style={zStyle}
        role="presentation"
        onClick={handleBackdrop}
      >
        <DialogSurface
          className={cn("rx-modal-shell-lightbox__content", panelClassName)}
          ariaLabel={ariaLabel}
          ariaLabelledBy={ariaLabelledBy}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </DialogSurface>
      </div>
    );
  }

  if (variant === "centered") {
    return (
      <div className={cn(RX_MODAL_CENTERED, className)} style={zStyle} role="presentation">
        <button
          type="button"
          className="rx-modal-shell-centered__backdrop"
          aria-label="Close"
          onClick={handleBackdrop}
        />
        <DialogSurface
          ariaLabel={ariaLabel}
          ariaLabelledBy={ariaLabelledBy}
          className={cn(
            scrollPanel ? "rx-modal-shell-centered__panel rx-sheet" : "relative z-[1]",
            panelClassName,
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </DialogSurface>
      </div>
    );
  }

  return (
    <div className={cn(RX_MODAL_SHELL, className)} style={zStyle} role="presentation">
      <button
        type="button"
        className="rx-modal-shell__backdrop rx-sheet-overlay"
        aria-label="Close"
        onClick={handleBackdrop}
      />
      <DialogSurface
        ariaLabel={ariaLabel}
        ariaLabelledBy={ariaLabelledBy}
        className={cn("rx-sheet", RX_MODAL_PANEL, panelClassName)}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </DialogSurface>
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
