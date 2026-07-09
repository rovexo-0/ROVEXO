"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  getAvailablePaymentMethods,
  getPaymentMethodLabel,
  SAVED_CARD_DETAIL,
  type PaymentMethodId,
} from "@/lib/checkout/payment";
import { OrderSummaryTotals } from "@/features/commerce-ui/components/OrderSummaryTotals";
import { mapOrderToCommerceTotals } from "@/lib/commerce/mappers";
import type { CheckoutFormController } from "@/features/checkout/hooks/use-checkout-form";
import type { OrderTotals } from "@/lib/orders/types";

type CheckoutPaymentStepV1Props = {
  form: CheckoutFormController;
  totals: OrderTotals;
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

function PaymentBrand({ methodId }: { methodId: PaymentMethodId }) {
  if (methodId === "saved_card" || methodId === "card") {
    return <span className="ckt-v1__pay-brand ckt-v1__pay-brand--visa">VISA</span>;
  }
  if (methodId === "apple_pay") {
    return <span className="ckt-v1__pay-brand ckt-v1__pay-brand--apple"> Apple Pay</span>;
  }
  if (methodId === "google_pay") {
    return <span className="ckt-v1__pay-brand ckt-v1__pay-brand--google">Google Pay</span>;
  }
  return <span className="ckt-v1__pay-brand">PayPal</span>;
}

function paymentDetail(methodId: PaymentMethodId): string | null {
  if (methodId === "saved_card") return "**** **** **** 4242";
  return null;
}

export function CheckoutPaymentStepV1({ form, totals }: CheckoutPaymentStepV1Props) {
  const { draft, updateDraft } = form;
  const [{ isIOS, isAndroid }] = useState(detectMobilePlatform);
  const methods = getAvailablePaymentMethods({ isIOS, isAndroid }).filter(
    (method) => method.id !== "paypal",
  );

  return (
    <div className="ckt-v1__step">
      <section className="ckt-v1__section" aria-labelledby="ckt-payment-method">
        <h2 id="ckt-payment-method" className="ckt-v1__section-title">
          Payment Method
        </h2>

        <div className="ckt-v1__card ckt-v1__card--list">
          {methods.map((method, index) => {
            const selected = draft.paymentMethod === method.id;
            const detail = paymentDetail(method.id) ?? method.detail ?? null;

            return (
              <label
                key={method.id}
                className={cn(
                  "ckt-v1__pay-option",
                  index > 0 && "ckt-v1__pay-option--divider",
                  selected && "ckt-v1__pay-option--selected",
                )}
              >
                <span className="ckt-v1__pay-leading">
                  <PaymentBrand methodId={method.id} />
                  {detail ? <span className="ckt-v1__pay-detail">{detail}</span> : null}
                  {!detail ? (
                    <span className="ckt-v1__pay-detail">{method.label}</span>
                  ) : null}
                </span>
                <input
                  type="radio"
                  name="payment-method"
                  checked={selected}
                  onChange={() => updateDraft({ paymentMethod: method.id })}
                  className="ckt-v1__radio"
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="ckt-v1__section" aria-labelledby="ckt-order-summary">
        <h2 id="ckt-order-summary" className="ckt-v1__section-title">
          Order Summary
        </h2>
        <OrderSummaryTotals totals={mapOrderToCommerceTotals(totals)} accentTotal />
      </section>

      <p className="sr-only">
        Selected payment method: {getPaymentMethodLabel(draft.paymentMethod, { isIOS, isAndroid })}
        {SAVED_CARD_DETAIL ? ` ${SAVED_CARD_DETAIL}` : ""}
      </p>
    </div>
  );
}
