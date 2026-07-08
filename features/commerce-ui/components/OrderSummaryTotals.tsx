import { Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
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
    <div className="flex items-center justify-between gap-ds-3 text-sm">
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
    <Card padding="lg" className={cn("flex flex-col gap-ds-4", className)}>
      {title ? <h2 className="text-base font-semibold text-text-primary">{title}</h2> : null}

      <div className="flex flex-col gap-ds-3">
        <Row label="Products" value={formatGBP(totals.products)} />
        <Row label="Shipping" value={formatGBP(totals.shipping)} />
        <Row label="Platform Fee" value={formatGBP(totals.platformFee)} info />
      </div>

      <div className="flex items-center justify-between gap-ds-3 border-t border-border pt-ds-4">
        <span className="text-base font-semibold text-text-primary">Total</span>
        <span
          className={cn(
            "text-lg font-bold",
            accentTotal ? "text-primary" : "text-text-primary",
          )}
        >
          {formatGBP(totals.total)}
        </span>
      </div>
    </Card>
  );
}
