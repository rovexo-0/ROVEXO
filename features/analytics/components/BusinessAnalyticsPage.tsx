"use client";

import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { DashboardPerformanceSection } from "@/features/dashboard/components/DashboardPerformanceSection";
import { AnalyticsDoughnutChart } from "@/features/analytics/components/AnalyticsDoughnutChart";
import {
  AnalyticsExportSection,
  buildBusinessExportExtras,
} from "@/features/analytics/components/AnalyticsExportSection";
import { AnalyticsGeographicSection } from "@/features/analytics/components/AnalyticsGeographicSection";
import { AnalyticsHeader } from "@/features/analytics/components/AnalyticsHeader";
import { AnalyticsOverviewGrid } from "@/features/analytics/components/AnalyticsOverviewGrid";
import { AnalyticsTopProductsSection } from "@/features/analytics/components/AnalyticsTopProductsSection";
import { useAnalyticsData } from "@/features/analytics/hooks/use-analytics-data";
import type { BusinessAnalyticsData } from "@/lib/analytics/types";

type BusinessAnalyticsPageProps = {
  initialData: BusinessAnalyticsData;
  backHref?: string;
};

export function BusinessAnalyticsPage({
  initialData,
  backHref = "/business/dashboard",
}: BusinessAnalyticsPageProps) {
  const { data, range, loading, changeRange } = useAnalyticsData("business", initialData);

  return (
    <BetaAppShell showBottomNav={false}>
      <AnalyticsHeader
        backHref={backHref}
        activeRange={range}
        onRangeChange={(nextRange) => void changeRange(nextRange)}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {loading && (
          <p className="sr-only" aria-live="polite">
            Updating analytics
          </p>
        )}

        <AnalyticsOverviewGrid metrics={data.overview} />

        <DashboardPerformanceSection performance={data.performance} />

        <AnalyticsDoughnutChart
          title="Sales Channels"
          headingId="business-sales-channels-heading"
          segments={data.salesChannels}
        />

        <AnalyticsTopProductsSection title="Top 5 Products" products={data.topProducts} />

        <AnalyticsGeographicSection countries={data.geographicSales} />

        <AnalyticsExportSection
          title="Export"
          rangeLabel={data.rangeLabel}
          overview={data.overview}
          topProducts={data.topProducts}
          extraRows={buildBusinessExportExtras(data)}
        />
      </main>
    </BetaAppShell>
  );
}
