import type { ExecutiveReport, ReportType } from "@/lib/enterprise-business-intelligence/types";
import { REPORT_TYPES } from "@/lib/enterprise-business-intelligence/registry";

const TITLES: Record<ReportType, string> = {
  revenue: "Revenue Report",
  marketplace: "Marketplace Report",
  seller: "Seller Performance Report",
  buyer: "Buyer Activity Report",
  business: "Business Accounts Report",
  security: "Security Summary Report",
  incident: "Incident Summary Report",
  deployment: "Deployment Summary Report",
};

export function isValidReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
}

export function generateReport(type: ReportType): ExecutiveReport {
  return {
    id: `report-${type}-${Date.now()}`,
    type,
    title: TITLES[type],
    generatedAt: new Date().toISOString(),
    summary: `Executive ${TITLES[type]} generated for leadership review`,
    metrics: [`${type} KPIs`, "Period comparison", "Trend analysis"],
  };
}

export function createDefaultReports(): ExecutiveReport[] {
  return (["revenue", "marketplace", "seller", "buyer"] as ReportType[]).map(generateReport);
}

export function formatReportMarkdown(report: ExecutiveReport): string {
  return [
    `# ${report.title}`,
    "",
    report.summary,
    "",
    "## Metrics",
    ...report.metrics.map((m) => `- ${m}`),
    "",
    `Generated: ${report.generatedAt}`,
  ].join("\n");
}
