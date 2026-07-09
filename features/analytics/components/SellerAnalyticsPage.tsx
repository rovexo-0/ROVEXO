"use client";

import dynamic from "next/dynamic";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
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
  buildSellerExportExtras,
} from "@/features/analytics/components/AnalyticsExportSection";
import { AnalyticsHeader } from "@/features/analytics/components/AnalyticsHeader";
import { AnalyticsOverviewGrid } from "@/features/analytics/components/AnalyticsOverviewGrid";
import { AnalyticsPromotionsSection } from "@/features/analytics/components/AnalyticsPromotionsSection";
import { AnalyticsRecentActivitySection } from "@/features/analytics/components/AnalyticsRecentActivitySection";
import { AnalyticsTopProductsSection } from "@/features/analytics/components/AnalyticsTopProductsSection";
import { useAnalyticsData } from "@/features/analytics/hooks/use-analytics-data";
import type { SellerAnalyticsData } from "@/lib/analytics/types";

type SellerAnalyticsPageProps = {
  initialData: SellerAnalyticsData;
  backHref?: string;
};

export function SellerAnalyticsPage({
  initialData,
  backHref = "/seller",
}: SellerAnalyticsPageProps) {
  const { data, range, loading, changeRange } = useAnalyticsData("seller", initialData);

  return (
    <BetaAppShell showBottomNav={false}>
      <AnalyticsHeader
        backHref={backHref}
        activeRange={range}
        onRangeChange={(nextRange) => void changeRange(nextRange)}
      />

      <HubPageMain withBottomNav={false} className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 ">
        {loading && (
          <p className="sr-only" aria-live="polite">
            Updating analytics
          </p>
        )}

        <AnalyticsOverviewGrid metrics={data.overview} />

        {data.promotions && <AnalyticsPromotionsSection data={data.promotions} />}

        <DashboardPerformanceSection
          performance={data.performance}
          title="Charts"
          headingId="seller-analytics-charts-heading"
        />

        <AnalyticsTopProductsSection
          title="Top 5 Best Selling Products"
          products={data.topProducts}
        />

        <AnalyticsDoughnutChart
          title="Traffic Sources"
          headingId="seller-traffic-sources-heading"
          segments={data.trafficSources}
        />

        <AnalyticsRecentActivitySection activity={data.recentActivity} />

        <AnalyticsExportSection
          title="Export"
          rangeLabel={data.rangeLabel}
          overview={data.overview}
          topProducts={data.topProducts}
          extraRows={buildSellerExportExtras(data)}
        />
      </HubPageMain>
    </BetaAppShell>
  );
}
