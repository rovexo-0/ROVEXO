import { Info } from "lucide-react";
import { CanonicalCard } from "@/src/components/canonical";
import { cn } from "@/lib/cn";
import { formatGBP } from "@/features/commerce-ui/lib/format";
import type { CommerceTotals } from "@/features/commerce-ui/types";

type OrderSummaryTotalsProps = {
  totals: CommerceTotals;
  /** Optional card heading (omitted when the section title lives outside). */
  title?: string;
  /** Render the grand total in ROVEXO Purple (checkout) vs primary text (order details). */
  accentTotal?: boolean;
  className?: string;
};

function Row({
  label,
  value,
  info = false,
}: {
  label: string;
  value: string;
  info?: boolean;
}) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-ds-3 px-ds-4 text-sm">
      <span className="inline-flex items-center gap-ds-1 text-text-secondary">
        {label}
        {info ? <Info className="h-3.5 w-3.5 text-text-muted" aria-hidden /> : null}
      </span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

/**
 * Canonical order totals: Products, Shipping, Platform Fee, Total.
 * The fee percentage and parcel/label counts are never shown.
 */
export function OrderSummaryTotals({
  totals,
  title,
  accentTotal = false,
  className,
}: OrderSummaryTotalsProps) {
  return (
    <div className={cn("flex w-full flex-col gap-ds-2", className)}>
      {title ? <h2 className="text-sm font-semibold text-text-primary">{title}</h2> : null}

      <CanonicalCard variant="list" className="flex w-full flex-col py-1">
        <Row label="Products" value={formatGBP(totals.products)} />
        <Row label="Shipping" value={formatGBP(totals.shipping)} />
        <Row label="Platform Fee" value={formatGBP(totals.platformFee)} info />
        <div className="border-t border-border">
          <div className="flex min-h-[44px] items-center justify-between gap-ds-3 px-ds-4">
            <span className="text-sm font-semibold text-text-primary">Total</span>
            <span
              className={cn(
                "text-base font-bold",
                accentTotal ? "text-primary" : "text-text-primary",
              )}
            >
              {formatGBP(totals.total)}
            </span>
          </div>
        </div>
      </CanonicalCard>
    </div>
  );
}
