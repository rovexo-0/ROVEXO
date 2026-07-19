"use client";

import "@/styles/rovexo/checkout-v1.css";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { CheckoutPageHeader } from "@/features/checkout/components/CheckoutPageHeader";
import { CheckoutPriceSummary } from "@/features/checkout/components/CheckoutPriceSummary";
import { CheckoutProductSummary } from "@/features/checkout/components/CheckoutProductSummary";
import { formatListingPrice } from "@/lib/listing-card/format";
import {
  getPaymentMethodLabel,
} from "@/lib/checkout/payment";
import { useSavedPaymentMethods } from "@/lib/checkout/use-saved-payment-methods";
import { formatSavedCardDetail } from "@/lib/payments/format";
import type { CheckoutFormController } from "@/features/checkout/hooks/use-checkout-form";
import type { CheckoutStep } from "@/features/checkout/types";
import type { ProductDetail } from "@/lib/products/types";

type CheckoutWizardV1Props = {
  product: ProductDetail;
  form: CheckoutFormController;
  buyerPhone?: string | null;
  embedded?: boolean;
  onClose?: () => void;
  /** Ignored — Absolute Final: one surface only. */
  initialStep?: CheckoutStep;
};

function detectMobilePlatform() {
  if (typeof navigator === "undefined") {
    return { isIOS: false, isAndroid: false };
  }
  const ua = navigator.userAgent;
  return {
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
  };
}

/**
 * Checkout — Absolute Final Freeze.
 * Products → Shipping → Platform Fee → Total → Confirm & Pay.
 * No address step · no payment step · no review step · no wizard · one URL.
 */
export function CheckoutWizardV1({
  product,
  form,
  buyerPhone,
  embedded = false,
  onClose,
}: CheckoutWizardV1Props) {
  const { isIOS, isAndroid } = detectMobilePlatform();
  const { defaultMethod } = useSavedPaymentMethods();
  const savedCardDetail = defaultMethod ? formatSavedCardDetail(defaultMethod) : null;

  const {
    draft,
    totals,
    canPay,
    isSubmitting,
    isResolvingAddress,
    resolveDeliveryAddress,
    placeOrder,
    shippingQuotesLoading,
    liveQuotesAttempted,
    selectedQuote,
    shippingQuoteReason,
  } = form;

  const hasListingShippingPrice =
    product.shippingPrice != null && product.shippingPrice >= 0;

  const shippingBlocked =
    shippingQuoteReason === "seller_dispatch_not_ready" &&
    !hasListingShippingPrice &&
    !product.freeDelivery;

  const addressComplete = useMemo(
    () =>
      draft.recipientName.trim().length > 0 &&
      draft.addressLine.trim().length > 0 &&
      draft.postcode.trim().length > 0 &&
      draft.country.trim().length > 0,
    [draft.addressLine, draft.country, draft.postcode, draft.recipientName],
  );

  const deliveryResolved =
    product.freeDelivery || selectedQuote != null || hasListingShippingPrice;

  // Resolve saved address quietly on mount — no separate Address step UI.
  useEffect(() => {
    if (!addressComplete && !isResolvingAddress) {
      void resolveDeliveryAddress();
    }
  }, [addressComplete, isResolvingAddress, resolveDeliveryAddress]);

  const paymentLabel = getPaymentMethodLabel(draft.paymentMethod, {
    isIOS,
    isAndroid,
    savedCardDetail,
  });

  const shippingPrice = product.freeDelivery ? 0 : totals.delivery;
  const shippingMethodLabel = product.freeDelivery
    ? "Free delivery"
    : selectedQuote?.serviceName || selectedQuote?.carrier || "Standard delivery";
  const etaLabel = selectedQuote?.eta || null;

  const footerDisabled =
    !canPay ||
    isSubmitting ||
    isResolvingAddress ||
    shippingQuotesLoading ||
    shippingBlocked ||
    !addressComplete ||
    !deliveryResolved ||
    (!product.freeDelivery && !liveQuotesAttempted && !hasListingShippingPrice);

  const handlePay = () => {
    void (async () => {
      if (!addressComplete) {
        const resolved = await resolveDeliveryAddress();
        if (!resolved) return;
      }
      void placeOrder();
    })();
  };

  return (
    <div
      className="ckt-v1"
      data-checkout-version="v1.0"
      data-checkout-sprint="3-qa"
      data-checkout-freeze="ABSOLUTE-FINAL"
      data-checkout-step="confirm"
      data-checkout-embedded={embedded ? "true" : undefined}
    >
      <CheckoutPageHeader
        backHref={embedded ? undefined : `/listing/${product.slug}`}
        backLabel={embedded ? "Back" : "Listing"}
        onBack={embedded ? onClose : undefined}
      />

      <ScrollContainer as="main" withBottomNav={false} className="ckt-v1__main">
        <div className="ckt-v1__sections">
          <section className="ckt-v1__section" aria-label="Products">
            <h2 className="ckt-v1__section-title">Products</h2>
            <CheckoutProductSummary product={product} />
          </section>

          <section className="ckt-v1__section" aria-labelledby="ckt-shipping-title">
            <h2 id="ckt-shipping-title" className="ckt-v1__section-title">
              Delivery
            </h2>
            <div className="ckt-v1__card ckt-v1__card--pad">
              {addressComplete ? (
                <>
                  <p className="ckt-v1__review-value">{draft.recipientName}</p>
                  {buyerPhone ? <p className="ckt-v1__review-subvalue">{buyerPhone}</p> : null}
                  <p className="ckt-v1__review-subvalue">
                    {[draft.addressLine, draft.postcode, draft.country].filter(Boolean).join(", ")}
                  </p>
                  <p className="ckt-v1__review-subvalue">{shippingMethodLabel}</p>
                  {etaLabel ? <p className="ckt-v1__review-subvalue">{etaLabel}</p> : null}
                  <p className="ckt-v1__review-subvalue">
                    {product.freeDelivery || shippingPrice === 0
                      ? "Shipping included"
                      : formatListingPrice(shippingPrice)}
                  </p>
                </>
              ) : (
                <p className="ckt-v1__review-subvalue">
                  Add a delivery address in{" "}
                  <Link href="/account/addresses" className="ckt-v1__manage-payments-link">
                    Settings
                  </Link>{" "}
                  to continue.
                </p>
              )}
            </div>
          </section>

          <section className="ckt-v1__section" aria-labelledby="ckt-payment-title">
            <h2 id="ckt-payment-title" className="ckt-v1__section-title">
              Payment
            </h2>
            <div className="ckt-v1__card ckt-v1__card--pad">
              <p className="ckt-v1__review-value">{paymentLabel}</p>
              <p className="ckt-v1__review-subvalue">
                Managed in{" "}
                <Link href="/wallet/payment-methods" className="ckt-v1__manage-payments-link">
                  Wallet
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="ckt-v1__section" aria-labelledby="ckt-price-title">
            <h2 id="ckt-price-title" className="sr-only">
              Platform Fee and Total
            </h2>
            <CheckoutPriceSummary totals={totals} freeDelivery={Boolean(product.freeDelivery)} />
          </section>
        </div>
      </ScrollContainer>

      <div className="ckt-v1__footer">
        <button
          type="button"
          className="ckt-v1__cta"
          disabled={footerDisabled}
          onClick={handlePay}
        >
          {isSubmitting || isResolvingAddress ? "Confirming…" : "Confirm & Pay"}
        </button>
      </div>
    </div>
  );
}
