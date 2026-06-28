import type { GovernanceSnapshot } from "@/lib/enterprise-governance-center/types";
import { EXPORT_FORMATS } from "@/lib/enterprise-governance-center/registry";

export function isValidGovernanceExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportGovernanceSnapshot(snapshot: GovernanceSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["domain", "score", "label"];
    const rows = snapshot.enterpriseScores.map((s) =>
      headers.map((h) => JSON.stringify(String(s[h as keyof typeof s] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportGovernanceSnapshot(snapshot, "csv");
  return [
    "ROVEXO Enterprise Governance Report",
    `Overall Score: ${snapshot.overallScore}%`,
    `Constitution Version: ${snapshot.settings.constitutionVersion}`,
    `Modules Compliant: ${snapshot.moduleCompliance.filter((m) => m.status === "pass").length}/${snapshot.moduleCompliance.length}`,
  ].join("\n");
}
