"use client";

import { memo, useId, useState } from "react";
import { formatListingPrice } from "@/lib/listing-card/format";
import type { OrderTotals } from "@/lib/orders/types";

type CheckoutPriceSummaryProps = {
  totals: OrderTotals;
  freeDelivery?: boolean;
};

/** Buyer-facing price lines — total lives on the PAY CTA only. */
export const CheckoutPriceSummary = memo(function CheckoutPriceSummary({
  totals,
  freeDelivery = false,
}: CheckoutPriceSummaryProps) {
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const delivery = freeDelivery ? 0 : totals.delivery;

  return (
    <section className="ckt-v1__price" aria-label="Payment summary">
      <div className="ckt-v1__price-row">
        <span>Product</span>
        <span>{formatListingPrice(totals.itemPrice)}</span>
      </div>
      <div className="ckt-v1__price-row">
        <span className="ckt-v1__price-fee-label">
          Buyer Protection
          <button
            type="button"
            className="ckt-v1__price-info"
            aria-expanded={open}
            aria-controls={tipId}
            onClick={() => setOpen((value) => !value)}
          >
            i
            <span className="sr-only">About Buyer Protection</span>
          </button>
        </span>
        <span>{formatListingPrice(totals.platformFee)}</span>
      </div>
      <div className="ckt-v1__price-row">
        <span>Shipping</span>
        <span>
          {freeDelivery
            ? "Included"
            : totals.deliveryPending
              ? "Calculated at checkout"
              : delivery === 0
                ? "Included"
                : formatListingPrice(delivery)}
        </span>
      </div>
      {open ? (
        <p id={tipId} className="ckt-v1__price-tip" role="note">
          Buyer Protection covers secure payment processing, escrow protection, and platform security.
          Sellers never see this line.
        </p>
      ) : null}
    </section>
  );
});
