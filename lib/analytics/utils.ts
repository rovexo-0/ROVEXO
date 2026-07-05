import type { AnalyticsDateRange } from "@/lib/analytics/types";

const RANGE_LABELS: Record<AnalyticsDateRange, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "1y": "Last 1 Year",
};

const RANGE_MULTIPLIERS: Record<AnalyticsDateRange, number> = {
  "7d": 0.28,
  "30d": 1,
  "90d": 2.75,
  "1y": 11.5,
};

export function getAnalyticsRangeLabel(range: AnalyticsDateRange): string {
  return RANGE_LABELS[range];
}

export function getAnalyticsRangeMultiplier(range: AnalyticsDateRange): number {
  return RANGE_MULTIPLIERS[range];
}

export function formatAnalyticsCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatOverviewValue(
  value: number,
  format?: "currency" | "number" | "percent",
): string {
  if (format === "currency") return formatAnalyticsCurrency(value / 100);
  if (format === "percent") return `${(value / 100).toFixed(2)}%`;
  return value.toLocaleString();
}

export function buildAnalyticsCsv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
