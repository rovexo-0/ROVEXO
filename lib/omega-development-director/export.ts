import type { DevDirectorSnapshot } from "@/lib/omega-development-director/types";
import { EXPORT_FORMATS } from "@/lib/omega-development-director/registry";

export function isValidDevDirectorExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportDevDirectorSnapshot(snapshot: DevDirectorSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["id", "title", "priority", "stage", "riskScore"];
    const rows = snapshot.roadmap.map((item) =>
      headers.map((h) => JSON.stringify(String(item[h as keyof typeof item] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportDevDirectorSnapshot(snapshot, "csv");
  return [
    "ROVEXO OMEGA Development Director Report",
    `Development Progress: ${snapshot.dashboard.developmentProgress}%`,
    `Platform Completion: ${snapshot.dashboard.platformCompletion}%`,
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}%`,
    `Open Findings: ${snapshot.dashboard.openFindings}`,
    `Recommendation Only Mode: ${snapshot.settings.recommendationOnlyMode ? "ENABLED" : "DISABLED"}`,
  ].join("\n");
}
