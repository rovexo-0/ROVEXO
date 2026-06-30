import type { BiSnapshot } from "@/lib/enterprise-business-intelligence/types";
import { formatReportMarkdown } from "@/lib/enterprise-business-intelligence/reports";

export function isValidBiExportFormat(value: string): value is "pdf" | "csv" | "excel" | "json" {
  return ["pdf", "csv", "excel", "json"].includes(value);
}

export function exportBiSnapshot(snapshot: BiSnapshot, format: "pdf" | "csv" | "excel" | "json"): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["label", "value", "changePercent", "period"];
    const rows = snapshot.kpis.map((k) =>
      headers.map((h) => JSON.stringify(String(k[h as keyof typeof k] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") {
    return exportBiSnapshot(snapshot, "csv");
  }
  return [
    "ROVEXO Business Intelligence Report",
    `Revenue: ${snapshot.dashboard.revenue}`,
    `GMV: ${snapshot.dashboard.gmv}`,
    `Orders: ${snapshot.dashboard.orders}`,
    `Platform Health: ${snapshot.dashboard.platformHealth}%`,
  ].join("\n");
}

export function exportReport(report: { title: string; summary: string; metrics: string[] }, format: "pdf" | "json"): string {
  if (format === "json") return JSON.stringify(report, null, 2);
  return formatReportMarkdown(report as never);
}

export function parseBiImportPayload(raw: string): { kpis?: BiSnapshot["kpis"] } {
  try {
    return JSON.parse(raw) as { kpis?: BiSnapshot["kpis"] };
  } catch {
    return {};
  }
}
