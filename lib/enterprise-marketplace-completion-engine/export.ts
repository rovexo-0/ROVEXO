import type { MarketplaceCompletionSnapshot } from "@/lib/enterprise-marketplace-completion-engine/types";
import { EXPORT_FORMATS } from "@/lib/enterprise-marketplace-completion-engine/registry";

export function isValidMarketplaceCompletionExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportMarketplaceCompletionSnapshot(snapshot: MarketplaceCompletionSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["moduleId", "label", "route", "passPercent", "status"];
    const rows = snapshot.modules.map((m) => headers.map((h) => JSON.stringify(String(m[h as keyof typeof m] ?? ""))).join(","));
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportMarketplaceCompletionSnapshot(snapshot, "csv");
  return [
    "ROVEXO Marketplace Completion Report",
    `Overall PASS: ${snapshot.dashboard.overallPassPercent}%`,
    `Modules Complete: ${snapshot.dashboard.modulesComplete}/${snapshot.dashboard.modulesTotal}`,
    `Marketplace Ready: ${snapshot.dashboard.marketplaceReady ? "YES" : "NO"}`,
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}%`,
  ].join("\n");
}
