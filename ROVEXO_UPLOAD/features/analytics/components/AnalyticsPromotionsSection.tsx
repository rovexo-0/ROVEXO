"use client";

import { Card } from "@/components/ui/Card";
import type { PromotionAnalyticsSummary } from "@/lib/analytics/types";

type AnalyticsPromotionsSectionProps = {
  data: PromotionAnalyticsSummary;
};

function formatCurrency(cents: number): string {
  return `£${(cents / 100).toFixed(2)}`;
}

export function AnalyticsPromotionsSection({ data }: AnalyticsPromotionsSectionProps) {
  return (
    <section aria-labelledby="analytics-promotions-heading" className="flex flex-col gap-ds-3">
      <h2 id="analytics-promotions-heading" className="text-base font-semibold text-text-primary">
        Promotions
      </h2>

      <Card padding="sm" className="">
        <div className="grid grid-cols-2 gap-ds-3 sm:grid-cols-3">
          <div>
            <p className="text-lg font-bold tabular-nums text-text-primary">{data.impressions}</p>
            <p className="text-xs text-text-secondary">Impressions</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-text-primary">{data.clicks}</p>
            <p className="text-xs text-text-secondary">Clicks</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-text-primary">{data.ctr}%</p>
            <p className="text-xs text-text-secondary">CTR</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-text-primary">{data.purchases}</p>
            <p className="text-xs text-text-secondary">Purchases</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-lg font-bold tabular-nums text-text-primary">
              {formatCurrency(data.revenueCents)}
            </p>
            <p className="text-xs text-text-secondary">Promotion revenue</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
