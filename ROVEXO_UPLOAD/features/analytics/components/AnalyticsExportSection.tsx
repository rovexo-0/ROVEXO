"use client";

import { Button } from "@/components/ui/Button";
import {
  buildAnalyticsCsv,
  downloadFile,
  formatAnalyticsCurrency,
  formatOverviewValue,
} from "@/lib/analytics/utils";
import type {
  AnalyticsOverviewMetric,
  AnalyticsTopProduct,
  SellerAnalyticsData,
  BusinessAnalyticsData,
} from "@/lib/analytics/types";

type AnalyticsExportSectionProps = {
  title: string;
  rangeLabel: string;
  overview: AnalyticsOverviewMetric[];
  topProducts: AnalyticsTopProduct[];
  extraRows?: string[][];
};

function buildExportRows(
  rangeLabel: string,
  overview: AnalyticsOverviewMetric[],
  topProducts: AnalyticsTopProduct[],
  extraRows: string[][] = [],
): string[][] {
  return [
    ["ROVEXO Analytics Export"],
    ["Range", rangeLabel],
    [],
    ["Overview", "Value"],
    ...overview.map((metric) => [
      metric.label,
      formatOverviewValue(metric.value, metric.format),
    ]),
    [],
    ["Top Products", "Revenue", "Orders"],
    ...topProducts.map((product) => [
      product.title,
      formatAnalyticsCurrency(product.revenue),
      product.orders.toString(),
    ]),
    [],
    ...extraRows,
  ];
}

export function AnalyticsExportSection({
  title,
  rangeLabel,
  overview,
  topProducts,
  extraRows = [],
}: AnalyticsExportSectionProps) {
  const rows = buildExportRows(rangeLabel, overview, topProducts, extraRows);

  const exportCsv = () => {
    downloadFile(
      "rovexo-analytics.csv",
      buildAnalyticsCsv(rows),
      "text/csv;charset=utf-8;",
    );
  };

  const exportPdf = () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>ROVEXO Analytics</title></head>
        <body>
          <h1>ROVEXO Analytics</h1>
          <p>${rangeLabel}</p>
          ${rows
            .map((row) => `<p>${row.join(" · ")}</p>`)
            .join("")}
        </body>
      </html>
    `;

    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <section aria-labelledby="analytics-export-heading" className="flex flex-col gap-ds-3">
      <h2 id="analytics-export-heading" className="text-base font-semibold text-text-primary">
        {title}
      </h2>

      <div className="grid grid-cols-2 gap-ds-3">
        <Button
          variant="outline"
          fullWidth
          size="md"
          className="min-h-ds-7 rounded-ds-lg"
          onClick={exportPdf}
        >
          Export PDF
        </Button>
        <Button
          variant="outline"
          fullWidth
          size="md"
          className="min-h-ds-7 rounded-ds-lg"
          onClick={exportCsv}
        >
          Export CSV
        </Button>
      </div>
    </section>
  );
}

export function buildSellerExportExtras(data: SellerAnalyticsData): string[][] {
  return [
    ["Traffic Sources", "Share"],
    ...data.trafficSources.map((segment) => [segment.label, segment.value.toString()]),
    [],
    ["Recent Activity", "Count"],
    ["New Followers", data.recentActivity.followers.toString()],
    ["New Reviews", data.recentActivity.reviews.toString()],
    ["New Saves", data.recentActivity.saves.toString()],
  ];
}

export function buildBusinessExportExtras(data: BusinessAnalyticsData): string[][] {
  return [
    ["Sales Channels", "Share"],
    ...data.salesChannels.map((segment) => [segment.label, segment.value.toString()]),
    [],
    ["Top Countries", "Revenue", "Orders"],
    ...data.geographicSales.map((country) => [
      country.name,
      formatAnalyticsCurrency(country.revenue),
      country.orders.toString(),
    ]),
  ];
}
