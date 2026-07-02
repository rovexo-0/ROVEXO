import type { OmegaSnapshot } from "@/lib/omega-command-center/types";
import { REPORT_EXPORT_FORMATS } from "@/lib/omega-command-center/registry";

export function isValidOmegaExportFormat(value: string): value is (typeof REPORT_EXPORT_FORMATS)[number] {
  return (REPORT_EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportOmegaSnapshot(snapshot: OmegaSnapshot, format: (typeof REPORT_EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["domain", "label", "score", "status"];
    const rows = snapshot.dashboard.healthCards.map((c) =>
      headers.map((h) => JSON.stringify(String(c[h as keyof typeof c] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") {
    return exportOmegaSnapshot(snapshot, "csv");
  }
  return [
    "ROVEXO OMEGA Executive Report",
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}`,
    snapshot.dashboard.executiveReport?.executiveSummary ?? "No report generated",
    snapshot.dashboard.executiveReport?.riskSummary ?? "",
  ].join("\n");
}
