"use client";

import "@/styles/rovexo/checkout-v1.css";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { CheckoutDeliveryStepV1 } from "@/features/checkout/components/CheckoutDeliveryStepV1";
import { CheckoutPageHeader } from "@/features/checkout/components/CheckoutPageHeader";
import { CheckoutPaymentStepV1 } from "@/features/checkout/components/CheckoutPaymentStepV1";
import { CheckoutPriceSummary } from "@/features/checkout/components/CheckoutPriceSummary";
import { CheckoutProductSummary } from "@/features/checkout/components/CheckoutProductSummary";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
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
  /** Sprint 1 foundation: delivery | payment | review (summary). */
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

export function CheckoutWizardV1({
  product,
  form,
  buyerPhone,
  embedded = false,
  onClose,
  initialStep = "review",
}: CheckoutWizardV1Props) {
  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>(initialStep);
  const [orderNotes, setOrderNotes] = useState("");
  const [{ isIOS, isAndroid }] = useState(detectMobilePlatform);
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

  const canContinueDelivery =
    addressComplete &&
    deliveryResolved &&
    (product.freeDelivery || liveQuotesAttempted || hasListingShippingPrice) &&
    !shippingBlocked &&
    !shippingQuotesLoading &&
    !isResolvingAddress;

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

  const goAddress = () => {
    if (embedded) {
      setStep("delivery");
      return;
    }
    router.push(`/checkout/${product.slug}/address`);
  };

  const goPayment = () => {
    if (embedded) {
      setStep("payment");
      return;
    }
    router.push(`/checkout/${product.slug}/payment`);
  };

  const goReview = () => {
    if (embedded) {
      setStep("review");
      return;
    }
    router.push(`/checkout/${product.slug}`);
  };

  const footerLabel =
    step === "delivery"
      ? "Continue to Payment"
      : step === "payment"
        ? "Continue to Review"
        : "Confirm & Pay";

  const footerDisabled =
    step === "delivery"
      ? !canContinueDelivery
      : step === "payment"
        ? false
        : !canPay || isSubmitting || !addressComplete || !deliveryResolved;

  const handleBack = () => {
    if (step === "delivery" || step === "payment") {
      goReview();
      return;
    }
    if (embedded && onClose) {
      onClose();
    }
  };

  const handlePrimary = () => {
    if (step === "delivery") {
      void (async () => {
        const resolved = await resolveDeliveryAddress();
        if (resolved) {
          if (embedded) {
            setStep("payment");
          } else {
            router.push(`/checkout/${product.slug}/payment`);
          }
        }
      })();
      return;
    }
    if (step === "payment") {
      goReview();
      return;
    }
    // Sprint 1 UI foundation: existing place-order path retained (no new payment API).
    void placeOrder();
  };

  const backHref =
    step === "review" && !embedded ? `/listing/${product.slug}` : undefined;
  const onHeaderBack =
    step === "review"
      ? embedded
        ? onClose
        : undefined
      : handleBack;

  return (
    <div
      className="ckt-v1"
      data-checkout-version="v1.0"
      data-checkout-sprint="3-qa"
      data-checkout-freeze="FROZEN"
      data-checkout-step={step}
      data-checkout-embedded={embedded ? "true" : undefined}
    >
      <CheckoutPageHeader
        backHref={backHref}
        backLabel={step === "review" && !embedded ? "Listing" : "Back"}
        onBack={onHeaderBack}
      />

      <ScrollContainer as="main" withBottomNav={false} className="ckt-v1__main">
        {step === "review" ? (
          <div className="ckt-v1__sections">
            <section className="ckt-v1__section" aria-label="Product summary">
              <CheckoutProductSummary product={product} />
            </section>

            <section className="ckt-v1__section" aria-labelledby="ckt-delivery-title">
              <div className="ckt-v1__section-head">
                <h2 id="ckt-delivery-title" className="ckt-v1__section-title">
                  Delivery
                </h2>
                <button
                  type="button"
                  className={cn("ckt-v1__change", focusRing)}
                  onClick={goAddress}
                >
                  Change
                </button>
              </div>
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
                  <p className="ckt-v1__review-subvalue">Add a delivery address to continue.</p>
                )}
              </div>
            </section>

            <section className="ckt-v1__section" aria-labelledby="ckt-payment-title">
              <div className="ckt-v1__section-head">
                <h2 id="ckt-payment-title" className="ckt-v1__section-title">
                  Payment
                </h2>
                <button
                  type="button"
                  className={cn("ckt-v1__change", focusRing)}
                  onClick={goPayment}
                >
                  Change
                </button>
              </div>
              <div className="ckt-v1__card ckt-v1__card--pad">
                <p className="ckt-v1__review-value">{paymentLabel}</p>
                {draft.paymentMethod === "saved_card" && savedCardDetail ? (
                  <p className="ckt-v1__review-subvalue">{savedCardDetail}</p>
                ) : null}
                <p className="ckt-v1__review-subvalue">
                  Visa · Mastercard · Apple Pay · Google Pay
                </p>
                <p className="ckt-v1__manage-hint">
                  Managed in{" "}
                  <Link href="/wallet/payment-methods" className="ckt-v1__manage-payments-link">
                    Wallet
                  </Link>
                </p>
              </div>
            </section>

            <section className="ckt-v1__section" aria-labelledby="ckt-price-title">
              <h2 id="ckt-price-title" className="ckt-v1__section-title">
                Price summary
              </h2>
              <CheckoutPriceSummary totals={totals} freeDelivery={Boolean(product.freeDelivery)} />
            </section>
          </div>
        ) : null}

        {step === "delivery" ? (
          <CheckoutDeliveryStepV1
            form={form}
            product={product}
            buyerPhone={buyerPhone}
            orderNotes={orderNotes}
            onOrderNotesChange={setOrderNotes}
          />
        ) : null}

        {step === "payment" ? <CheckoutPaymentStepV1 form={form} totals={totals} /> : null}
      </ScrollContainer>

      <div className="ckt-v1__footer">
        <button
          type="button"
          className="ckt-v1__cta"
          disabled={footerDisabled}
          onClick={handlePrimary}
        >
          {step === "review" && isSubmitting
            ? "Confirming…"
            : step === "delivery" && isResolvingAddress
              ? "Confirming address…"
              : footerLabel}
        </button>
      </div>
    </div>
  );
}
