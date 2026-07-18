import { Price } from "@/components/ui/Price";
import { SHIPPING_INCLUDED_LABEL } from "@/lib/checkout/delivery";
import type { OrderTotals } from "@/lib/orders/types";
import { CanonicalCard, CanonicalSection } from "@/src/components/canonical";

type OrderSummaryProps = {
  totals: OrderTotals;
  title?: string;
  listingOffersFreeDelivery?: boolean;
};

function SummaryRow({
  label,
  amount,
  emphasis = false,
}: {
  label: string;
  amount: number;
  emphasis?: boolean;
}) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-ds-3 px-ds-4 text-sm">
      <span className={emphasis ? "font-semibold text-text-primary" : "text-text-secondary"}>
        {label}
      </span>
      <Price
        amount={amount}
        size={emphasis ? "md" : "sm"}
        className={
          emphasis
            ? "[&_span]:text-base [&_span]:font-bold [&_span]:text-text-primary"
            : "[&_span]:font-medium [&_span]:text-text-primary"
        }
      />
    </div>
  );
}

function DeliverySummaryRow({
  totals,
  listingOffersFreeDelivery = false,
}: {
  totals: OrderTotals;
  listingOffersFreeDelivery?: boolean;
}) {
  if (totals.deliveryPending) {
    return (
      <div className="flex min-h-[44px] items-center justify-between gap-ds-3 px-ds-4 text-sm">
        <span className="text-text-secondary">Shipping</span>
        <span className="text-sm font-medium text-text-muted">At checkout</span>
      </div>
    );
  }

  if (listingOffersFreeDelivery) {
    return (
      <div className="flex min-h-[44px] items-center justify-between gap-ds-3 px-ds-4 text-sm">
        <span className="text-text-secondary">Shipping</span>
        <span className="text-sm font-semibold text-primary">{SHIPPING_INCLUDED_LABEL}</span>
      </div>
    );
  }

  return <SummaryRow label="Shipping" amount={totals.delivery} />;
}

/** Checkout totals — compact full-width rows (commerce hierarchy preserved). */
export function OrderSummary({
  totals,
  title = "Summary",
  listingOffersFreeDelivery = false,
}: OrderSummaryProps) {
  return (
    <CanonicalSection title={title}>
      <CanonicalCard variant="list" className="flex w-full flex-col py-1">
        <SummaryRow label="Item" amount={totals.itemPrice} />
        <DeliverySummaryRow totals={totals} listingOffersFreeDelivery={listingOffersFreeDelivery} />
        <SummaryRow label="Platform Fee" amount={totals.platformFee} />
        <div className="border-t border-border">
          <SummaryRow label="Total" amount={totals.total} emphasis />
        </div>
      </CanonicalCard>
    </CanonicalSection>
  );
}
