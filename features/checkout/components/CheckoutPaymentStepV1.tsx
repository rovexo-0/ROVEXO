"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import {
  getAvailablePaymentMethods,
  getPaymentMethodLabel,
  type PaymentMethodId,
} from "@/lib/checkout/payment";
import { useSavedPaymentMethods } from "@/lib/checkout/use-saved-payment-methods";
import { formatSavedCardDetail, formatSavedCardMask } from "@/lib/payments/format";
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

export function CheckoutPaymentStepV1({ form, totals }: CheckoutPaymentStepV1Props) {
  const { draft, updateDraft } = form;
  const [{ isIOS, isAndroid }] = useState(detectMobilePlatform);
  const { defaultMethod } = useSavedPaymentMethods();
  const savedCardDetail = defaultMethod ? formatSavedCardDetail(defaultMethod) : null;

  const methods = getAvailablePaymentMethods({ isIOS, isAndroid, savedCardDetail }).filter(
    (method) => method.id !== "paypal",
  );

  useEffect(() => {
    if (defaultMethod && draft.paymentMethod !== "saved_card") {
      updateDraft({ paymentMethod: "saved_card" });
    }
  }, [defaultMethod, draft.paymentMethod, updateDraft]);

  const paymentDetail = (methodId: PaymentMethodId): string | null => {
    if (methodId === "saved_card" && defaultMethod) {
      return formatSavedCardMask(defaultMethod);
    }
    return null;
  };

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

        <p className="ckt-v1__manage-payments">
          <a href="/wallet/payment-methods" className="ckt-v1__manage-payments-link">
            Manage Payment Methods
          </a>
        </p>
      </section>

      <section className="ckt-v1__section" aria-labelledby="ckt-order-summary">
        <h2 id="ckt-order-summary" className="ckt-v1__section-title">
          Order Summary
        </h2>
        <OrderSummaryTotals totals={mapOrderToCommerceTotals(totals)} accentTotal />
      </section>

      <p className="sr-only">
        Selected payment method:{" "}
        {getPaymentMethodLabel(draft.paymentMethod, { isIOS, isAndroid, savedCardDetail })}
        {savedCardDetail ? ` ${savedCardDetail}` : ""}
      </p>
    </div>
  );
}
