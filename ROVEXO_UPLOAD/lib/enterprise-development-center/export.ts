import type { DevelopmentSnapshot } from "@/lib/enterprise-development-center/types";
import { EXPORT_FORMATS } from "@/lib/enterprise-development-center/registry";

export function isValidDevelopmentExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportDevelopmentSnapshot(snapshot: DevelopmentSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  if (format === "csv") {
    const headers = ["id", "label", "version", "enterpriseScore"];
    const rows = snapshot.modules.map((m) => headers.map((h) => JSON.stringify(String(m[h as keyof typeof m] ?? ""))).join(","));
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportDevelopmentSnapshot(snapshot, "csv");
  return [
    "ROVEXO Enterprise Development Report",
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}%`,
    `Modules: ${snapshot.dashboard.modules}`,
    `APIs: ${snapshot.dashboard.apis}`,
    `Certification Readiness: ${snapshot.dashboard.certificationReadiness}%`,
  ].join("\n");
}
