"use client";

import { Card } from "@/components/ui/Card";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import { cn } from "@/lib/cn";
import { formatChangePercent, formatCurrency } from "@/lib/wallet/utils";
import type { WalletSummaryMetric } from "@/lib/wallet/types";

type MonthSummaryGridProps = {
  revenue: WalletSummaryMetric;
  withdrawn: WalletSummaryMetric;
  fees: WalletSummaryMetric;
};

type SummaryCardProps = {
  label: string;
  metric: WalletSummaryMetric;
};

function SummaryCard({ label, metric }: SummaryCardProps) {
  const changeClassName =
    metric.changePercent >= 0 ? "text-success" : "text-danger";

  return (
    <Card padding="sm" className="flex min-h-[96px] flex-col justify-center gap-ds-1">
      <span className="text-lg font-bold tabular-nums text-text-primary">
        <AnimatedCounter
          value={Math.round(metric.value * 100)}
          format={(value) => formatCurrency(value / 100)}
        />
      </span>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <span className={cn("text-xs font-semibold tabular-nums", changeClassName)}>
        {formatChangePercent(metric.changePercent)} vs last month
      </span>
    </Card>
  );
}

export function MonthSummaryGrid({ revenue, withdrawn, fees }: MonthSummaryGridProps) {
  return (
    <section aria-labelledby="wallet-month-summary-heading" className="flex flex-col gap-ds-3">
      <h2 id="wallet-month-summary-heading" className="text-base font-semibold text-text-primary">
        Month Summary
      </h2>

      <div className="grid grid-cols-3 gap-ds-3">
        <SummaryCard label="Revenue" metric={revenue} />
        <SummaryCard label="Paid out" metric={withdrawn} />
        <SummaryCard label="Fees" metric={fees} />
      </div>
    </section>
  );
}
