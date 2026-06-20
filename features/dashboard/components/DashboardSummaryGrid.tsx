"use client";

import { Card } from "@/components/ui/Card";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import type { DashboardSummaryCard } from "@/features/dashboard/types";

type DashboardSummaryGridProps = {
  title?: string;
  cards: DashboardSummaryCard[];
};

function formatSummaryValue(value: number, format?: DashboardSummaryCard["format"]): string {
  if (format === "currency") return `€${(value / 100).toFixed(2)}`;
  return value.toLocaleString();
}

function SummaryCard({ label, value, format }: DashboardSummaryCard) {
  return (
    <Card padding="sm" className="flex min-h-[88px] flex-col justify-center gap-ds-1 shadow-ds-soft">
      <span className="text-lg font-bold text-text-primary">
        <AnimatedCounter
          value={value}
          format={(next) => formatSummaryValue(next, format)}
        />
      </span>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </Card>
  );
}

export function DashboardSummaryGrid({
  title = "Today's Summary",
  cards,
}: DashboardSummaryGridProps) {
  return (
    <section aria-labelledby="dashboard-summary-heading" className="flex flex-col gap-ds-3">
      <h2 id="dashboard-summary-heading" className="text-base font-semibold text-text-primary">
        {title}
      </h2>

      <div className="grid grid-cols-2 gap-ds-3">
        {cards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}
