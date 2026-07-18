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
  buildSellerExportExtras,
} from "@/features/analytics/components/AnalyticsExportSection";
import { AnalyticsRangeAction } from "@/features/analytics/components/AnalyticsRangeAction";
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
    <AccountCanonicalShell
      title="Analytics"
      backHref={backHref}
      backLabel="Selling"
      showHeaderTitle
      showBottomNav={false}
      rightAction={
        <AnalyticsRangeAction
          activeRange={range}
          onRangeChange={(nextRange) => void changeRange(nextRange)}
        />
      }
    >
      <div className="flex w-full flex-col gap-ds-4 pb-ds-5">
        {loading ? (
          <p className="sr-only" aria-live="polite">
            Updating analytics
          </p>
        ) : null}

        <AnalyticsOverviewGrid metrics={data.overview} />
        {data.promotions ? <AnalyticsPromotionsSection data={data.promotions} /> : null}
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
      </div>
    </AccountCanonicalShell>
  );
}
