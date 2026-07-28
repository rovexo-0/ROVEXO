import { CanonicalCard } from "@/src/components/canonical";
import { cn } from "@/lib/cn";
import { formatGBP } from "@/features/commerce-ui/lib/format";
import type { OrderTotals } from "@/lib/orders/types";

type SellerOrderSummaryTotalsProps = {
  totals: OrderTotals;
  title?: string;
  className?: string;
};

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-ds-3 px-ds-4 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

/**
 * Seller-facing order money summary (UI isolation).
 * Never shows buyer total, platform fee paid by buyer, or buyer payment summary.
 * You'll Receive = full sale price (buyer-paid Platform Fee is never deducted from seller).
 */
export function SellerOrderSummaryTotals({
  totals,
  title = "Summary",
  className,
}: SellerOrderSummaryTotalsProps) {
  const shipping = totals.deliveryPending ? 0 : totals.delivery;
  const youllReceive = totals.itemPrice;

  return (
    <div
      className={cn("flex w-full flex-col gap-ds-2", className)}
      data-order-summary-role="seller"
      data-buyer-fee-isolated="true"
    >
      {title ? <h2 className="text-sm font-semibold text-text-primary">{title}</h2> : null}

      <CanonicalCard variant="list" className="flex w-full flex-col py-1">
        <Row label="Sale Price" value={formatGBP(totals.itemPrice)} />
        <Row label="Shipping" value={formatGBP(shipping)} />
        <div className="border-t border-border">
          <div className="flex min-h-[44px] items-center justify-between gap-ds-3 px-ds-4">
            <span className="text-sm font-semibold text-text-primary">You&apos;ll Receive</span>
            <span className="text-base font-bold text-text-primary">{formatGBP(youllReceive)}</span>
          </div>
        </div>
      </CanonicalCard>
    </div>
  );
}
