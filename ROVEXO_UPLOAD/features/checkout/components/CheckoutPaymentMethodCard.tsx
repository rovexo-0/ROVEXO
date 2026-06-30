"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import {
  getAvailablePaymentMethods,
  getPaymentMethodLabel,
  type PaymentMethodId,
} from "@/lib/checkout/payment";
import type { CheckoutFormController } from "@/features/checkout/hooks/use-checkout-form";

type CheckoutPaymentMethodCardProps = {
  form: CheckoutFormController;
};

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

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

export function CheckoutPaymentMethodCard({ form }: CheckoutPaymentMethodCardProps) {
  const { draft, updateDraft } = form;
  const [isChanging, setIsChanging] = useState(false);
  const [{ isIOS, isAndroid }] = useState(detectMobilePlatform);

  const methods = getAvailablePaymentMethods({ isIOS, isAndroid });
  const selectedLabel = getPaymentMethodLabel(draft.paymentMethod, { isIOS, isAndroid });

  return (
    <section aria-labelledby="checkout-payment-heading" className="flex flex-col gap-ds-3">
      <div className="flex items-center justify-between gap-ds-3">
        <h2 id="checkout-payment-heading" className="text-base font-semibold text-text-primary">
          Payment Method
        </h2>
        <button
          type="button"
          onClick={() => setIsChanging((current) => !current)}
          className={cn(
            "inline-flex min-h-ds-7 items-center gap-ds-1 text-sm font-medium text-primary",
            focusRing,
          )}
        >
          {isChanging ? "Done" : "Change"}
          {!isChanging && <ChevronRightIcon className="h-4 w-4" />}
        </button>
      </div>

      <Card padding="md" className="">
        {isChanging ? (
          <div className="flex flex-col gap-ds-2">
            {methods.map((method) => {
              const selected = draft.paymentMethod === method.id;

              return (
                <label
                  key={method.id}
                  className={cn(
                    "flex min-h-ds-7 cursor-pointer items-center gap-ds-3 rounded-ds-md border px-ds-3 py-ds-3",
                    selected ? "border-primary bg-primary/5" : "border-border bg-surface",
                  )}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    checked={selected}
                    onChange={() => updateDraft({ paymentMethod: method.id as PaymentMethodId })}
                    className="h-4 w-4 shrink-0 border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">
                    {method.detail ? `${method.label} · ${method.detail}` : method.label}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-sm font-medium text-text-primary">{selectedLabel}</p>
        )}
      </Card>
    </section>
  );
}
