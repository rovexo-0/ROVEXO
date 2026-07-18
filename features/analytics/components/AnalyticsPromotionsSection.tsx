"use client";

import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { PromotionAnalyticsSummary } from "@/lib/analytics/types";

type AnalyticsPromotionsSectionProps = {
  data: PromotionAnalyticsSummary;
};

function formatCurrency(cents: number): string {
  return `£${(cents / 100).toFixed(2)}`;
}

/** One Product — promotions as Master Menu rows. */
export function AnalyticsPromotionsSection({ data }: AnalyticsPromotionsSectionProps) {
  return (
    <CanonicalSection title="Promotions">
      <CanonicalCard variant="list">
        <CanonicalMenuRow title="Impressions" value={String(data.impressions)} showChevron={false} />
        <CanonicalMenuRow title="Clicks" value={String(data.clicks)} showChevron={false} />
        <CanonicalMenuRow title="CTR" value={`${data.ctr}%`} showChevron={false} />
        <CanonicalMenuRow title="Purchases" value={String(data.purchases)} showChevron={false} />
        <CanonicalMenuRow
          title="Promotion revenue"
          value={formatCurrency(data.revenueCents)}
          showChevron={false}
        />
      </CanonicalCard>
    </CanonicalSection>
  );
}
