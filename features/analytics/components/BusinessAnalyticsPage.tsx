"use client";

import dynamic from "next/dynamic";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { DashboardPerformanceSection } from "@/features/dashboard/components/DashboardPerformanceSection";
const AnalyticsDoughnutChart = dynamic(
  () =>
    import("@/features/analytics/components/AnalyticsDoughnutChart").then(
      (module) => module.AnalyticsDoughnutChart,
    ),
  { ssr: false },
);
import {
  AnalyticsExportSection,
  buildBusinessExportExtras,
} from "@/features/analytics/components/AnalyticsExportSection";
import { AnalyticsGeographicSection } from "@/features/analytics/components/AnalyticsGeographicSection";
import { AnalyticsRangeAction } from "@/features/analytics/components/AnalyticsRangeAction";
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
    <AccountCanonicalShell
      title="Analytics"
      backHref={backHref}
      backLabel="Business"
      showHeaderTitle
      showBottomNav={false}
      rightAction={
        <AnalyticsRangeAction
          activeRange={range}
          onRangeChange={(nextRange) => void changeRange(nextRange)}
        />
      }
    >
      <div className="flex w-full flex-col gap-ds-4 px-ds-4 pb-ds-5">
        {loading ? (
          <p className="sr-only" aria-live="polite">
            Updating analytics
          </p>
        ) : null}

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
      </div>
    </AccountCanonicalShell>
  );
}
