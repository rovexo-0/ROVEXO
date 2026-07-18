"use client";

import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import {
  getDeliveryPrice,
  shouldShowUnavailableShippingPrice,
  SHIPPING_INCLUDED_LABEL,
  UNAVAILABLE_SHIPPING_PRICE_LABEL,
} from "@/lib/checkout/delivery";
import type { CheckoutFormController } from "@/features/checkout/hooks/use-checkout-form";

type CheckoutDeliverySectionProps = {
  form: CheckoutFormController;
  listingOffersFreeDelivery?: boolean;
  listingShippingPrice?: number | null;
};

export function CheckoutDeliverySection({
  form,
  listingOffersFreeDelivery = false,
  listingShippingPrice = null,
}: CheckoutDeliverySectionProps) {
  const {
    draft,
    updateDraft,
    shippingQuotes,
    shippingQuotesLoading,
    liveQuotesAttempted,
    liveShippingEnabled,
    selectedQuote,
  } = form;

  const showLiveQuotes =
    liveShippingEnabled && !listingOffersFreeDelivery && shippingQuotes.length > 0;
  const showStaticPrice =
    !listingOffersFreeDelivery &&
    listingShippingPrice != null &&
    listingShippingPrice >= 0 &&
    !showLiveQuotes;
  const showUnavailable = shouldShowUnavailableShippingPrice({
    listingOffersFreeDelivery,
    listingShippingPrice,
    liveQuotesAttempted: liveQuotesAttempted || !liveShippingEnabled,
    liveQuotesLoading: shippingQuotesLoading,
    selectedQuote,
  });

  return (
    <section aria-labelledby="checkout-delivery-heading" className="flex flex-col gap-ds-3">
      <h2 id="checkout-delivery-heading" className="text-base font-semibold text-text-primary">
        Shipping
      </h2>

      {listingOffersFreeDelivery ? (
        <p className="text-sm font-medium text-primary">{SHIPPING_INCLUDED_LABEL}</p>
      ) : null}

      <Card padding="md" className="flex flex-col gap-ds-3">
        {shippingQuotesLoading ? (
          <p className="text-sm text-text-secondary">Retrieving live shipping prices…</p>
        ) : null}

        {showLiveQuotes
          ? shippingQuotes.map((option) => {
              const selected = draft.deliveryOption === option.id;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex min-h-ds-7 cursor-pointer items-start gap-ds-3 rounded-ds-md border px-ds-3 py-ds-3",
                    selected ? "border-primary bg-primary/5" : "border-border bg-surface",
                    focusRing,
                  )}
                >
                  <input
                    type="radio"
                    name="delivery-option"
                    checked={selected}
                    onChange={() => updateDraft({ deliveryOption: option.id })}
                    className="mt-1 h-4 w-4 shrink-0 border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-ds-3">
                      <span className="text-sm font-semibold text-text-primary">{option.carrier}</span>
                      <Price
                        amount={option.price}
                        size="sm"
                        className="shrink-0 [&_span]:font-semibold [&_span]:text-text-primary"
                      />
                    </span>
                    <span className="mt-0.5 block text-xs text-text-secondary">
                      {option.serviceName} · {option.eta}
                    </span>
                  </span>
                </label>
              );
            })
          : null}

        {showStaticPrice ? (
          <div className="flex items-center justify-between rounded-ds-md border border-border bg-surface px-ds-3 py-ds-3">
            <span className="text-sm font-semibold text-text-primary">Standard Delivery</span>
            <Price
              amount={
                getDeliveryPrice({
                  listingShippingPrice,
                }) ?? 0
              }
              size="sm"
              className="shrink-0 [&_span]:font-semibold [&_span]:text-text-primary"
            />
          </div>
        ) : null}

        {showUnavailable ? (
          <p className="text-sm font-medium text-text-secondary">{UNAVAILABLE_SHIPPING_PRICE_LABEL}</p>
        ) : null}
      </Card>
    </section>
  );
}
