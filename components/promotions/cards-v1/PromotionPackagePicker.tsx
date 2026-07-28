"use client";

import { useCallback, useState } from "react";
import {
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalModal,
} from "@/src/components/canonical";
import { PromotionPaymentMethodSelector } from "@/components/promotions/cards-v1/PromotionPaymentMethodSelector";
import { BOOST_PACKAGE_TIERS } from "@/lib/promotions/canonical-tools";
import { formatPromotionPrice } from "@/lib/promotions/catalog";
import {
  sanitizePromotionCheckoutError,
  type PromotionPaymentMethodId,
} from "@/lib/promotions/payment-safe";
import {
  PROMOTE_PAYMENT_CONTINUE_LABEL,
  PROMOTE_PAYMENT_PROCESSING_LABEL,
} from "@/lib/promotions/promote-payment-freeze-v1";
import "@/styles/rovexo/promotion-payment-v1.css";

type PromotionPackagePickerProps = {
  open: boolean;
  onClose: () => void;
};

export function PromotionPackagePicker({ open, onClose }: PromotionPackagePickerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PromotionPaymentMethodId | null>(null);
  const [hasPayableMethod, setHasPayableMethod] = useState(false);

  const selectedTier = BOOST_PACKAGE_TIERS.find((tier) => tier.id === selectedPackageId) ?? null;

  const reset = () => {
    setSelectedPackageId(null);
    setPaymentMethod(null);
    setHasPayableMethod(false);
    setError(null);
    setBusy(false);
  };

  const startCheckout = useCallback(async (packageId: string, method: PromotionPaymentMethodId) => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/promotions/seller-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "boost_package",
          packageId,
          paymentMethod: method,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.success) {
        setError(sanitizePromotionCheckoutError(payload.error));
        return;
      }

      window.location.href = payload.url ?? "/promote?promotion=success&type=boost_package";
    } catch {
      setError(sanitizePromotionCheckoutError(null));
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <CanonicalModal
      open={open}
      variant="information"
      title={selectedTier ? "Boost Package" : "Choose Boost Package"}
      cancelLabel="Close"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <div className="flex flex-col gap-ds-3">
        {!selectedTier ? (
          <div role="listbox" aria-label="Boost packages">
            {BOOST_PACKAGE_TIERS.map((tier) => (
              <CanonicalMenuRow
                key={tier.id}
                title={tier.label}
                value={formatPromotionPrice(tier.priceCents)}
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setSelectedPackageId(tier.id);
                }}
              />
            ))}
          </div>
        ) : (
          <>
            <CanonicalInfoBlock variant="description">
              {selectedTier.label} · {formatPromotionPrice(selectedTier.priceCents)}
            </CanonicalInfoBlock>

            <PromotionPaymentMethodSelector
              amountCents={selectedTier.priceCents}
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

            <div className="promo-pay__actions">
              <button
                type="button"
                className="promo-pay__secondary"
                disabled={busy}
                onClick={() => {
                  setSelectedPackageId(null);
                  setPaymentMethod(null);
                  setHasPayableMethod(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="promo-pay__primary"
                disabled={!paymentMethod || !hasPayableMethod || busy}
                onClick={() => {
                  if (paymentMethod) void startCheckout(selectedTier.id, paymentMethod);
                }}
              >
                {busy ? PROMOTE_PAYMENT_PROCESSING_LABEL : PROMOTE_PAYMENT_CONTINUE_LABEL}
              </button>
            </div>
          </>
        )}

        {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}
      </div>
    </CanonicalModal>
  );
}
