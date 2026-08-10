"use client";

import { useEffect, useRef } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { formatCurrency } from "@/lib/wallet/utils";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import type { ConversationOfferView } from "@/lib/inbox/conversation-view";

type OfferBundleDetailsSheetProps = {
  open: boolean;
  offer: ConversationOfferView | null;
  /** True when the timeline card is a seller counter offer. */
  isCounter?: boolean;
  onClose: () => void;
};

/**
 * Conversation Hub — Bundle Details sheet (Owner Messages UX).
 * Reads only the offer.bundle payload already on the timeline card.
 * Not an Offer Composer · not a checkout path · no extra fetch.
 */
export function OfferBundleDetailsSheet({
  open,
  offer,
  isCounter = false,
  onClose,
}: OfferBundleDetailsSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !offer?.bundle) return null;

  const bundle = offer.bundle;
  const lines = Array.isArray(bundle.lines) ? bundle.lines : [];
  const offerLabel = isCounter ? "Counter offer" : "Offer";

  return (
    <div
      ref={dialogRef}
      className="conv-hub__bundle-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conv-hub-bundle-sheet-title"
      data-offer-bundle-details="true"
    >
      <button
        type="button"
        className="conv-hub__bundle-sheet-backdrop"
        aria-label="Close bundle details"
        onClick={onClose}
      />
      <div className="conv-hub__bundle-sheet-panel">
        <header className="conv-hub__bundle-sheet-header">
          <h2 id="conv-hub-bundle-sheet-title" className="conv-hub__bundle-sheet-title">
            Bundle · {bundle.itemCount} {bundle.itemCount === 1 ? "item" : "items"}
          </h2>
          <button
            type="button"
            className="conv-hub__bundle-sheet-close"
            aria-label="Close"
            onClick={onClose}
          >
            Close
          </button>
        </header>

        <ul className="conv-hub__bundle-sheet-list" aria-label="Bundle products">
          {lines.map((line, index) => {
            const title =
              typeof line.title === "string" && line.title.trim()
                ? line.title.trim()
                : `Item ${index + 1}`;
            const qty =
              typeof line.quantity === "number" && line.quantity > 0 ? line.quantity : 1;
            const unit =
              typeof line.unitPrice === "number" && Number.isFinite(line.unitPrice)
                ? line.unitPrice
                : null;
            const imageSrc =
              typeof line.imageUrl === "string" && isRenderableImageSrc(line.imageUrl.trim())
                ? line.imageUrl.trim()
                : "/placeholder-product.svg";
            return (
              <li
                key={`${line.productId || "line"}-${index}`}
                className="conv-hub__bundle-sheet-row"
                data-bundle-line={line.productId || index}
              >
                <span className="conv-hub__bundle-sheet-thumb" aria-hidden>
                  <SafeImage
                    src={imageSrc}
                    alt=""
                    width={56}
                    height={56}
                    className="conv-hub__bundle-sheet-thumb-img"
                  />
                </span>
                <div className="conv-hub__bundle-sheet-copy">
                  <p className="conv-hub__bundle-sheet-product">{title}</p>
                  {unit != null ? (
                    <p className="conv-hub__bundle-sheet-price">{formatCurrency(unit)}</p>
                  ) : null}
                  <p className="conv-hub__bundle-sheet-qty">Qty {qty}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="conv-hub__bundle-sheet-summary" aria-label="Bundle summary">
          <div className="conv-hub__bundle-sheet-summary-row">
            <span>List total</span>
            <span className="conv-hub__bundle-sheet-list-total">
              {formatCurrency(bundle.listSubtotal)}
            </span>
          </div>
          <div className="conv-hub__bundle-sheet-summary-row conv-hub__bundle-sheet-summary-row--offer">
            <span>{offerLabel}</span>
            <strong>{formatCurrency(offer.amount)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
