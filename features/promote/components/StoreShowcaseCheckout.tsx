"use client";

/**
 * Store Showcase checkout — compact premium payment sheet.
 * My Wallet · Default Saved Card only. CTA = Continue (frozen).
 */

import { useState } from "react";
import { getStoreShowcaseOffer } from "@/lib/master-engine";
import { PromotionPaymentMethodSelector } from "@/components/promotions/cards-v1/PromotionPaymentMethodSelector";
import type { PromotionPaymentMethodId } from "@/lib/promotions/payment-safe";
import {
  PROMOTE_PAYMENT_CONTINUE_LABEL,
  PROMOTE_PAYMENT_PROCESSING_LABEL,
} from "@/lib/promotions/promote-payment-freeze-v1";

export type StoreShowcaseCheckoutProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: (paymentMethod: PromotionPaymentMethodId) => void;
  onCancel: () => void;
};

export function StoreShowcaseCheckout({
  open,
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: StoreShowcaseCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<PromotionPaymentMethodId | null>(null);
  const [hasPayableMethod, setHasPayableMethod] = useState(false);

  if (!open) return null;

  const offer = getStoreShowcaseOffer();
  const canContinue = Boolean(paymentMethod) && hasPayableMethod && !busy;

  return (
    <div
      className="store-showcase-v1__checkout"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ss-checkout-title"
      data-promo-checkout="store_showcase"
    >
      <div className="store-showcase-v1__checkout-panel">
        <h2 id="ss-checkout-title" className="store-showcase-v1__title">
          {offer.title}
        </h2>
        <p className="store-showcase-v1__meta">
          {offer.durationLabel} · {offer.priceLabel}
        </p>

        <div className="store-showcase-v1__promotes">
          <p className="store-showcase-v1__promotes-label">Promotes</p>
          <ul className="store-showcase-v1__checkout-list">
            {offer.promotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <PromotionPaymentMethodSelector
          amountCents={offer.priceCents}
          selected={paymentMethod}
          onSelect={setPaymentMethod}
          disabled={busy}
          onOptionsLoaded={(options) => {
            setHasPayableMethod(Boolean(options?.wallet.canPay || options?.defaultCard));
            if (!options?.wallet.canPay && !options?.defaultCard) {
              setPaymentMethod(null);
            }
          }}
        />

        {error ? (
          <p className="store-showcase-v1__hint" role="alert">
            {error}
          </p>
        ) : null}

        <div className="store-showcase-v1__actions">
          <button
            type="button"
            className="store-showcase-v1__secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="store-showcase-v1__cta"
            onClick={() => {
              if (paymentMethod) onConfirm(paymentMethod);
            }}
            disabled={!canContinue}
            data-testid="promo-pay-confirm-store"
          >
            {busy ? PROMOTE_PAYMENT_PROCESSING_LABEL : PROMOTE_PAYMENT_CONTINUE_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
