import type { QaSnapshot } from "@/lib/omega-quality-assurance-center/types";
import { EXPORT_FORMATS } from "@/lib/omega-quality-assurance-center/registry";

export function isValidQaExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportQaSnapshot(snapshot: QaSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["moduleId", "label", "buttonCoverage", "workflowCoverage", "apiCoverage", "status"];
    const rows = snapshot.moduleStatuses.map((m) =>
      headers.map((h) => JSON.stringify(String(m[h as keyof typeof m] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportQaSnapshot(snapshot, "csv");
  return [
    "ROVEXO OMEGA Quality Assurance Report",
    `Platform Health: ${snapshot.dashboard.platformHealth}%`,
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}%`,
    `Button Coverage: ${snapshot.dashboard.buttonCoverage}%`,
    `Workflow Coverage: ${snapshot.dashboard.workflowCoverage}%`,
    `Certification Rate: ${snapshot.dashboard.certificationRate}%`,
    `Open Issues: ${snapshot.dashboard.openIssues}`,
  ].join("\n");
}
