"use client";

import { useMemo, useState } from "react";
import { CheckoutDeliveryStepV1 } from "@/features/checkout/components/CheckoutDeliveryStepV1";
import { CheckoutPageHeader } from "@/features/checkout/components/CheckoutPageHeader";
import { CheckoutPaymentStepV1 } from "@/features/checkout/components/CheckoutPaymentStepV1";
import { CheckoutReviewStepV1 } from "@/features/checkout/components/CheckoutReviewStepV1";
import { CheckoutStepper } from "@/features/checkout/components/CheckoutStepper";
import type { CheckoutFormController } from "@/features/checkout/hooks/use-checkout-form";
import type { CheckoutStep } from "@/features/checkout/types";
import type { ProductDetail } from "@/lib/products/types";

type CheckoutWizardV1Props = {
  product: ProductDetail;
  form: CheckoutFormController;
  buyerPhone?: string | null;
};

export function CheckoutWizardV1({ product, form, buyerPhone }: CheckoutWizardV1Props) {
  const [step, setStep] = useState<CheckoutStep>("delivery");
  const [orderNotes, setOrderNotes] = useState("");

  const {
    draft,
    totals,
    canPay,
    isSubmitting,
    placeOrder,
    shippingQuotesLoading,
    liveQuotesAttempted,
    selectedQuote,
  } = form;

  const addressComplete = useMemo(
    () =>
      draft.recipientName.trim().length > 0 &&
      draft.addressLine.trim().length > 0 &&
      draft.postcode.trim().length > 0 &&
      draft.country.trim().length > 0,
    [draft.addressLine, draft.country, draft.postcode, draft.recipientName],
  );

  const deliveryResolved =
    product.freeDelivery ||
    selectedQuote != null ||
    (product.shippingPrice != null && product.shippingPrice >= 0);

  const canContinueDelivery =
    addressComplete &&
    deliveryResolved &&
    (product.freeDelivery || liveQuotesAttempted) &&
    !shippingQuotesLoading;

  const footerLabel =
    step === "delivery"
      ? "Continue to Payment"
      : step === "payment"
        ? "Continue to Review"
        : "Place Order";

  const footerDisabled =
    step === "delivery" ? !canContinueDelivery : step === "review" ? !canPay || isSubmitting : false;

  const handleBack = () => {
    if (step === "payment") {
      setStep("delivery");
      return;
    }
    if (step === "review") {
      setStep("payment");
    }
  };

  const handlePrimary = () => {
    if (step === "delivery") {
      setStep("payment");
      return;
    }
    if (step === "payment") {
      setStep("review");
      return;
    }
    void placeOrder();
  };

  return (
    <div className="ckt-v1" data-checkout-version="v1.0">
      <CheckoutPageHeader
        backHref={step === "delivery" ? `/listing/${product.slug}` : undefined}
        onBack={step === "delivery" ? undefined : handleBack}
      />

      <CheckoutStepper step={step} />

      <main className="ckt-v1__main">
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

        {step === "review" ? (
          <CheckoutReviewStepV1
            form={form}
            product={product}
            totals={totals}
            buyerPhone={buyerPhone}
            orderNotes={orderNotes}
            onChangeStep={setStep}
          />
        ) : null}
      </main>

      <div className="ckt-v1__footer">
        <button
          type="button"
          className="ckt-v1__cta"
          disabled={footerDisabled}
          onClick={handlePrimary}
        >
          {step === "review" && isSubmitting ? "Placing order…" : footerLabel}
        </button>
      </div>
    </div>
  );
}
