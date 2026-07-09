"use client";

import { useState } from "react";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { formatListingPrice } from "@/lib/listing-card/format";
import {
  getDeliveryPrice,
  resolveCheckoutShippingMessage,
  SHIPPING_INCLUDED_LABEL,
  shouldShowUnavailableShippingPrice,
  UNAVAILABLE_SHIPPING_PRICE_LABEL,
} from "@/lib/checkout/delivery";
import type { CheckoutFormController } from "@/features/checkout/hooks/use-checkout-form";
import type { ProductDetail } from "@/lib/products/types";

type CheckoutDeliveryStepV1Props = {
  form: CheckoutFormController;
  product: ProductDetail;
  buyerPhone?: string | null;
  orderNotes: string;
  onOrderNotesChange: (value: string) => void;
};

const fieldClassName = "ckt-v1__field";

export function CheckoutDeliveryStepV1({
  form,
  product,
  buyerPhone,
  orderNotes,
  onOrderNotesChange,
}: CheckoutDeliveryStepV1Props) {
  const {
    draft,
    updateDraft,
    shippingQuotes,
    shippingQuotesLoading,
    liveQuotesAttempted,
    liveShippingEnabled,
    selectedQuote,
    retryShippingQuotes,
    shippingQuoteReason,
  } = form;

  const [editingAddress, setEditingAddress] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);

  const listingOffersFreeDelivery = product.freeDelivery;
  const listingShippingPrice = product.shippingPrice ?? null;
  const showLiveQuotes =
    liveShippingEnabled && !listingOffersFreeDelivery && shippingQuotes.length > 0;

  const staticDeliveryPrice = getDeliveryPrice({
    listingOffersFreeDelivery,
    listingShippingPrice,
    selectedQuote,
    liveQuotesAttempted: liveQuotesAttempted || !liveShippingEnabled,
  });

  const shippingUnavailable = shouldShowUnavailableShippingPrice({
    listingOffersFreeDelivery,
    listingShippingPrice,
    liveQuotesAttempted,
    liveQuotesLoading: shippingQuotesLoading,
    selectedQuote,
  });

  const userShippingMessage = resolveCheckoutShippingMessage(shippingQuoteReason);

  const shippingTitle = "Shipping";
  const shippingSubtitle = selectedQuote
    ? selectedQuote.eta
    : listingOffersFreeDelivery
      ? SHIPPING_INCLUDED_LABEL
      : shippingQuotesLoading
        ? "Fetching live rates…"
        : "2-3 working days";

  const shippingPriceLabel = listingOffersFreeDelivery
    ? SHIPPING_INCLUDED_LABEL
    : shippingQuotesLoading
      ? "Loading…"
      : staticDeliveryPrice == null
        ? userShippingMessage ??
          (shippingUnavailable ? UNAVAILABLE_SHIPPING_PRICE_LABEL : "Calculated at checkout")
        : formatListingPrice(staticDeliveryPrice);

  const formattedAddress = [
    draft.addressLine,
    draft.postcode,
    draft.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="ckt-v1__step">
      <section className="ckt-v1__section" aria-labelledby="ckt-delivery-info">
        <h2 id="ckt-delivery-info" className="ckt-v1__section-title">
          Delivery Information
        </h2>

        <div className="ckt-v1__card">
          {editingAddress ? (
            <div className="ckt-v1__form">
              <label className="ckt-v1__label">
                <span>Full Name</span>
                <input
                  type="text"
                  className={cn(fieldClassName, focusRing)}
                  value={draft.recipientName}
                  onChange={(event) => updateDraft({ recipientName: event.target.value })}
                />
              </label>
              <label className="ckt-v1__label">
                <span>Phone</span>
                <input
                  type="tel"
                  className={cn(fieldClassName, focusRing)}
                  value={buyerPhone ?? ""}
                  readOnly
                  aria-readonly="true"
                />
              </label>
              <label className="ckt-v1__label">
                <span>Address</span>
                <input
                  type="text"
                  className={cn(fieldClassName, focusRing)}
                  value={draft.addressLine}
                  onChange={(event) => updateDraft({ addressLine: event.target.value })}
                />
              </label>
              <label className="ckt-v1__label">
                <span>Postcode</span>
                <input
                  type="text"
                  className={cn(fieldClassName, focusRing)}
                  value={draft.postcode}
                  onChange={(event) => updateDraft({ postcode: event.target.value })}
                />
              </label>
              <label className="ckt-v1__label">
                <span>Country</span>
                <input
                  type="text"
                  className={cn(fieldClassName, focusRing)}
                  value={draft.country}
                  onChange={(event) => updateDraft({ country: event.target.value })}
                />
              </label>
              <button
                type="button"
                className={cn("ckt-v1__inline-action", focusRing)}
                onClick={() => setEditingAddress(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={cn("ckt-v1__row-button", focusRing)}
              onClick={() => setEditingAddress(true)}
            >
              <div className="ckt-v1__row-copy">
                <p className="ckt-v1__row-label">Full Name</p>
                <p className="ckt-v1__row-value">{draft.recipientName || "Add your name"}</p>
                {buyerPhone ? (
                  <>
                    <p className="ckt-v1__row-label">Phone</p>
                    <p className="ckt-v1__row-value">{buyerPhone}</p>
                  </>
                ) : null}
                <p className="ckt-v1__row-label">Address</p>
                <p className="ckt-v1__row-value">{formattedAddress || "Add delivery address"}</p>
              </div>
              <ChevronRightLineIcon />
            </button>
          )}
        </div>
      </section>

      <section className="ckt-v1__section" aria-labelledby="ckt-shipping-method">
        <h2 id="ckt-shipping-method" className="ckt-v1__section-title">
          Shipping Method
        </h2>

        <div className="ckt-v1__card">
          {editingShipping && showLiveQuotes ? (
            <div className="ckt-v1__shipping-options">
              {shippingQuotes.map((option) => {
                const selected = draft.deliveryOption === option.id;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "ckt-v1__shipping-option",
                      selected && "ckt-v1__shipping-option--selected",
                    )}
                  >
                    <input
                      type="radio"
                      name="delivery-option"
                      checked={selected}
                      onChange={() => updateDraft({ deliveryOption: option.id })}
                    />
                    <span className="ckt-v1__shipping-copy">
                      <span className="ckt-v1__shipping-title">{option.serviceName}</span>
                      <span className="ckt-v1__shipping-subtitle">{option.eta}</span>
                    </span>
                    <span className="ckt-v1__shipping-price">{formatListingPrice(option.price)}</span>
                  </label>
                );
              })}
              <button
                type="button"
                className={cn("ckt-v1__inline-action", focusRing)}
                onClick={() => setEditingShipping(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={cn("ckt-v1__row-button", focusRing)}
              onClick={() => setEditingShipping(true)}
              disabled={shippingQuotesLoading}
            >
              <div className="ckt-v1__row-copy">
                <p className="ckt-v1__row-value">{shippingTitle}</p>
                <p className="ckt-v1__row-subtitle">{shippingSubtitle}</p>
              </div>
              <span className="ckt-v1__shipping-price">{shippingPriceLabel}</span>
              <ChevronRightLineIcon />
            </button>
          )}
        </div>
        {shippingUnavailable ? (
          <button
            type="button"
            className={cn("ckt-v1__inline-action", focusRing)}
            onClick={retryShippingQuotes}
          >
            Retry shipping quote
          </button>
        ) : null}
      </section>

      <section className="ckt-v1__section" aria-labelledby="ckt-order-notes">
        <h2 id="ckt-order-notes" className="ckt-v1__section-title">
          Order Notes <span className="ckt-v1__optional">(optional)</span>
        </h2>
        <textarea
          className={cn("ckt-v1__notes", focusRing)}
          placeholder="Leave a note for the seller..."
          value={orderNotes}
          onChange={(event) => onOrderNotesChange(event.target.value)}
          rows={4}
        />
      </section>
    </div>
  );
}
