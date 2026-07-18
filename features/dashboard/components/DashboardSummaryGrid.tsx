"use client";

import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { DashboardSummaryCard } from "@/features/dashboard/types";
import { formatCurrency } from "@/lib/wallet/utils";

type DashboardSummaryGridProps = {
  title?: string;
  cards: DashboardSummaryCard[];
};

function formatSummaryValue(value: number, format?: DashboardSummaryCard["format"]): string {
  if (format === "currency") return formatCurrency(value / 100);
  return value.toLocaleString("en-GB");
}

/** Absolute Final: summary as Master Menu rows — no animated counters / card grid. */
export function DashboardSummaryGrid({
  title = "Today's Summary",
  cards,
}: DashboardSummaryGridProps) {
  return (
    <CanonicalSection title={title} titleId="dashboard-summary-heading">
      <CanonicalCard variant="list">
        {cards.map((card) => (
          <CanonicalMenuRow
            key={card.label}
            title={card.label}
            value={formatSummaryValue(card.value, card.format)}
            showChevron={false}
          />
        ))}
      </CanonicalCard>
    </CanonicalSection>
  );
}
