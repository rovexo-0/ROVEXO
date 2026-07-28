"use client";

/**
 * Promote payment method selector — My Wallet · Default Saved Card only.
 * Shared by Bump · Store Showcase · Boost (no duplicate payment systems).
 */

import { useEffect, useState } from "react";
import type { PromotionPaymentMethodId } from "@/lib/promotions/payment-safe";
import { sanitizePromotionCheckoutError } from "@/lib/promotions/payment-safe";
import { PROMOTE_PAYMENT_NO_METHOD_COPY } from "@/lib/promotions/promote-payment-freeze-v1";

export type PromotionPaymentOptionsClient = {
  wallet: {
    availableBalance: number;
    availableLabel: string;
    canPay: boolean;
  };
  defaultCard: {
    brand: string;
    last4: string;
    label: string;
  } | null;
  hasPayableMethod?: boolean;
};

type PromotionPaymentMethodSelectorProps = {
  /** Promotion price in pence — wallet enabled only when balance covers this. */
  amountCents: number;
  selected: PromotionPaymentMethodId | null;
  onSelect: (method: PromotionPaymentMethodId) => void;
  disabled?: boolean;
  onOptionsLoaded?: (options: PromotionPaymentOptionsClient | null) => void;
};

export function PromotionPaymentMethodSelector({
  amountCents,
  selected,
  onSelect,
  disabled = false,
  onOptionsLoaded,
}: PromotionPaymentMethodSelectorProps) {
  const [options, setOptions] = useState<PromotionPaymentOptionsClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/promotions/payment-options?amountCents=${encodeURIComponent(String(amountCents))}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          },
        );
        const payload = (await response.json()) as {
          success?: boolean;
          options?: PromotionPaymentOptionsClient;
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok || !payload.options) {
          setError(sanitizePromotionCheckoutError(payload.error));
          setOptions(null);
          onOptionsLoaded?.(null);
          return;
        }
        setOptions(payload.options);
        onOptionsLoaded?.(payload.options);
        if (payload.options.wallet.canPay) onSelect("wallet");
        else if (payload.options.defaultCard) onSelect("default_card");
      } catch {
        if (!cancelled) {
          setError(sanitizePromotionCheckoutError(null));
          setOptions(null);
          onOptionsLoaded?.(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Reload when promotion amount changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountCents]);

  if (loading) {
    return <p className="promo-pay__hint">Loading payment methods…</p>;
  }

  if (error) {
    return (
      <p className="promo-pay__error" role="alert">
        {error}
      </p>
    );
  }

  if (!options) {
    return (
      <p className="promo-pay__error" role="alert">
        Unable to process payment. Please try again.
      </p>
    );
  }

  const noMethods = !options.wallet.canPay && !options.defaultCard;

  return (
    <div className="promo-pay" role="radiogroup" aria-label="Payment method">
      <button
        type="button"
        role="radio"
        aria-checked={selected === "wallet"}
        className={`promo-pay__option${selected === "wallet" ? " promo-pay__option--selected" : ""}${
          options.wallet.canPay ? "" : " promo-pay__option--unavailable"
        }`}
        disabled={disabled || !options.wallet.canPay}
        onClick={() => onSelect("wallet")}
        data-testid="promo-pay-wallet"
      >
        <span className="promo-pay__option-title">MY WALLET</span>
        <span className="promo-pay__option-meta">
          Available Balance
          <strong>{options.wallet.availableLabel}</strong>
        </span>
        <span
          className={`promo-pay__option-status${
            options.wallet.canPay ? " promo-pay__option-status--ok" : " promo-pay__option-status--off"
          }`}
        >
          {options.wallet.canPay ? "✓ Available for payment." : "Unavailable for payment."}
        </span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={selected === "default_card"}
        className={`promo-pay__option${selected === "default_card" ? " promo-pay__option--selected" : ""}${
          options.defaultCard ? "" : " promo-pay__option--unavailable"
        }`}
        disabled={disabled || !options.defaultCard}
        onClick={() => {
          if (options.defaultCard) onSelect("default_card");
        }}
        data-testid="promo-pay-card"
      >
        <span className="promo-pay__option-title">DEFAULT SAVED CARD</span>
        <span className="promo-pay__option-meta">
          {options.defaultCard ? options.defaultCard.label : "No default payment method."}
        </span>
        {options.defaultCard ? (
          <>
            <span className="promo-pay__option-copy">Secure Stripe Payment.</span>
            <span className="promo-pay__option-status promo-pay__option-status--ok">
              ✓ Available for payment.
            </span>
          </>
        ) : (
          <span className="promo-pay__option-status promo-pay__option-status--off">
            Unavailable for payment.
          </span>
        )}
      </button>

      {noMethods ? (
        <p className="promo-pay__hint" role="status" data-testid="promo-pay-no-method">
          {PROMOTE_PAYMENT_NO_METHOD_COPY}
        </p>
      ) : null}
    </div>
  );
}
