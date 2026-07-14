"use client";

import { useId, useState } from "react";
import { formatListingPrice } from "@/lib/listing-card/format";
import type { OrderTotals } from "@/lib/orders/types";

type CheckoutPriceSummaryProps = {
  totals: OrderTotals;
  freeDelivery?: boolean;
};

/** Buyer-facing price summary — Platform Fee visible to buyer only. */
export function CheckoutPriceSummary({ totals, freeDelivery = false }: CheckoutPriceSummaryProps) {
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const delivery = freeDelivery ? 0 : totals.delivery;

  return (
    <section className="ckt-v1__card ckt-v1__price" aria-label="Price summary">
      <div className="ckt-v1__price-row">
        <span>Item</span>
        <span>{formatListingPrice(totals.itemPrice)}</span>
      </div>
      <div className="ckt-v1__price-row">
        <span>Delivery</span>
        <span>{freeDelivery || delivery === 0 ? "Included" : formatListingPrice(delivery)}</span>
      </div>
      <div className="ckt-v1__price-row">
        <span className="ckt-v1__price-fee-label">
          Platform Fee
          <button
            type="button"
            className="ckt-v1__price-info"
            aria-expanded={open}
            aria-controls={tipId}
            onClick={() => setOpen((value) => !value)}
          >
            i
            <span className="sr-only">About Platform Fee</span>
          </button>
        </span>
        <span>{formatListingPrice(totals.platformFee)}</span>
      </div>
      {open ? (
        <p id={tipId} className="ckt-v1__price-tip" role="note">
          Platform Fee covers secure payment processing and buyer protection. Sellers never see this
          line.
        </p>
      ) : null}
      <div className="ckt-v1__price-total">
        <span>TOTAL</span>
        <span>{formatListingPrice(totals.total)}</span>
      </div>
    </section>
  );
}
