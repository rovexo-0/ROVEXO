"use client";

import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { DELIVERY_OPTIONS, getDeliveryPrice } from "@/lib/checkout/delivery";
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
  const { draft, updateDraft } = form;

  return (
    <section aria-labelledby="checkout-delivery-heading" className="flex flex-col gap-ds-3">
      <h2 id="checkout-delivery-heading" className="text-base font-semibold text-text-primary">
        Delivery
      </h2>

      {listingOffersFreeDelivery ? (
        <p className="text-sm font-medium text-primary">This seller offers free delivery.</p>
      ) : null}

      <Card padding="md" className="flex flex-col gap-ds-3">
        {DELIVERY_OPTIONS.map((option) => {
          const selected = draft.deliveryOption === option.id;
          const optionPrice = getDeliveryPrice(option.id, {
            listingOffersFreeDelivery,
            listingShippingPrice,
          });

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
                  <span className="text-sm font-semibold text-text-primary">{option.label}</span>
                  {optionPrice === 0 ? (
                    <span className="shrink-0 text-sm font-semibold text-primary">Free</span>
                  ) : optionPrice != null ? (
                    <Price
                      amount={optionPrice}
                      size="sm"
                      className="shrink-0 [&_span]:font-semibold [&_span]:text-text-primary"
                    />
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-text-secondary">
                      Price at dispatch
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-text-secondary">{option.eta}</span>
              </span>
            </label>
          );
        })}
      </Card>
    </section>
  );
}
