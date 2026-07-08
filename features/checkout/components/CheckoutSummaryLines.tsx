import { formatListingPrice } from "@/lib/listing-card/format";
import type { OrderTotals } from "@/lib/orders/types";

type CheckoutSummaryLinesProps = {
  totals: OrderTotals;
  itemCount?: number;
  shippingLabel?: string;
  className?: string;
};

export function CheckoutSummaryLines({
  totals,
  itemCount = 1,
  shippingLabel = "Shipping",
  className,
}: CheckoutSummaryLinesProps) {
  const deliveryAmount = totals.deliveryPending ? 0 : totals.delivery;

  return (
    <div className={className ?? "ckt-v1__summary-lines"}>
      <div className="ckt-v1__summary-row">
        <span>Items ({itemCount})</span>
        <span>{formatListingPrice(totals.itemPrice)}</span>
      </div>
      <div className="ckt-v1__summary-row">
        <span>{shippingLabel}</span>
        <span>
          {totals.deliveryPending ? "Calculated at checkout" : formatListingPrice(deliveryAmount)}
        </span>
      </div>
      <div className="ckt-v1__summary-row">
        <span>Platform Fee</span>
        <span>{formatListingPrice(totals.platformFee)}</span>
      </div>
      <div className="ckt-v1__summary-total">
        <span>Total</span>
        <span>{formatListingPrice(totals.total)}</span>
      </div>
    </div>
  );
}
