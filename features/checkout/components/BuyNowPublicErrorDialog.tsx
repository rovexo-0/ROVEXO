"use client";

import { ModalContainer } from "@/components/ui/ModalContainer";

type BuyNowPublicErrorDialogProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  /** Contextual label for the failed action (e.g. Buy Now). */
  actionContext?: string;
  /** When provided, shows Retry for safely retryable actions. */
  onRetry?: () => void;
};

/**
 * Action-contextual error — keeps the underlying message visible.
 * Close/OK dismisses without remounting the listing. Retry only when provided.
 */
export function BuyNowPublicErrorDialog({
  open,
  message,
  onClose,
  actionContext,
  onRetry,
}: BuyNowPublicErrorDialogProps) {
  const lines = message.split("\n").filter(Boolean);
  const title = actionContext?.trim() || lines[0] || "Sorry.";
  const bodyLines = actionContext?.trim() ? lines : lines.slice(1);

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      variant="centered"
      zIndex={240}
      ariaLabel={title}
      lockScroll
      panelClassName="bn-public-error"
    >
      <div
        className="bn-public-error__panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bn-public-error-title"
        aria-describedby={bodyLines.length ? "bn-public-error-body" : undefined}
        data-buy-now-public-error="1"
        data-error-context={actionContext ? "action" : "default"}
      >
        <p id="bn-public-error-title" className="bn-public-error__title">
          {title}
        </p>
        {bodyLines.length > 0 ? (
          <div id="bn-public-error-body" className="bn-public-error__body-stack">
            {bodyLines.map((line) => (
              <p key={line} className="bn-public-error__body">
                {line}
              </p>
            ))}
          </div>
        ) : null}
        <div className="bn-public-error__actions">
          {onRetry ? (
            <button type="button" className="bn-public-error__retry" onClick={onRetry}>
              Retry
            </button>
          ) : null}
          <button type="button" className="bn-public-error__ok" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}
