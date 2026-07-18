"use client";

import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { formatChangePercent, formatCurrency } from "@/lib/wallet/utils";
import type { WalletSummaryMetric } from "@/lib/wallet/types";

type MonthSummaryGridProps = {
  revenue: WalletSummaryMetric;
  withdrawn: WalletSummaryMetric;
  fees: WalletSummaryMetric;
};

function metricDescription(metric: WalletSummaryMetric): string {
  return `${formatChangePercent(metric.changePercent)} vs last month`;
}

/** Wallet month summary — One Product Master Menu rows. */
export function MonthSummaryGrid({ revenue, withdrawn, fees }: MonthSummaryGridProps) {
  return (
    <CanonicalSection title="This month">
      <CanonicalCard variant="list">
        <CanonicalMenuRow
          title="Revenue"
          description={metricDescription(revenue)}
          value={formatCurrency(revenue.value)}
          showChevron={false}
        />
        <CanonicalMenuRow
          title="Withdrawn"
          description={metricDescription(withdrawn)}
          value={formatCurrency(withdrawn.value)}
          showChevron={false}
        />
        <CanonicalMenuRow
          title="Fees"
          description={metricDescription(fees)}
          value={formatCurrency(fees.value)}
          showChevron={false}
        />
      </CanonicalCard>
    </CanonicalSection>
  );
}
