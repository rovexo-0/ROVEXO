"use client";

import { ModalContainer } from "@/components/ui/ModalContainer";

type BuyNowPublicErrorDialogProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

/**
 * Absolute UX Law — user sees only Sorry + OK.
 * Never RVX codes, never engine names, never technical copy.
 */
export function BuyNowPublicErrorDialog({ open, message, onClose }: BuyNowPublicErrorDialogProps) {
  const lines = message.split("\n").filter(Boolean);

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      variant="centered"
      zIndex={240}
      ariaLabel="Notice"
      lockScroll
      panelClassName="bn-public-error"
    >
      <div
        className="bn-public-error__panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bn-public-error-title"
        data-buy-now-public-error="1"
      >
        <p id="bn-public-error-title" className="bn-public-error__title">
          {lines[0] ?? "Sorry."}
        </p>
        {lines.slice(1).map((line) => (
          <p key={line} className="bn-public-error__body">
            {line}
          </p>
        ))}
        <button type="button" className="bn-public-error__ok" onClick={onClose}>
          OK
        </button>
      </div>
    </ModalContainer>
  );
}
