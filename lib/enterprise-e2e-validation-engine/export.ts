import type { E2eValidationSnapshot } from "@/lib/enterprise-e2e-validation-engine/types";
import { EXPORT_FORMATS } from "@/lib/enterprise-e2e-validation-engine/registry";

export function isValidE2eExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportE2eValidationSnapshot(snapshot: E2eValidationSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["key", "label", "score", "status"];
    const rows = snapshot.omegaScores.map((s) =>
      headers.map((h) => JSON.stringify(String(s[h as keyof typeof s] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportE2eValidationSnapshot(snapshot, "csv");
  return [
    "ROVEXO Enterprise E2E Validation Engine Report",
    `Overall Pass Rate: ${snapshot.dashboard.overallPassRate}%`,
    `UI Coverage: ${snapshot.dashboard.uiCoverage}%`,
    `Workflow Coverage: ${snapshot.dashboard.workflowCoverage}%`,
    `API Coverage: ${snapshot.dashboard.apiCoverage}%`,
    `Certification Eligible: ${snapshot.dashboard.certificationEligible ? "YES" : "NO"}`,
    `Validation Only Mode: ${snapshot.settings.validationOnlyMode ? "ENABLED" : "DISABLED"}`,
  ].join("\n");
}
