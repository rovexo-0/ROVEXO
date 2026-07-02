import type { HomepageCertificationSnapshot } from "@/lib/homepage-enterprise-certification-engine/types";
import { EXPORT_FORMATS } from "@/lib/homepage-enterprise-certification-engine/registry";

export function isValidHomepageCertificationExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportHomepageCertificationSnapshot(snapshot: HomepageCertificationSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["section", "status", "passPercent", "componentRef"];
    const rows = snapshot.sections.map((s) =>
      headers.map((h) => JSON.stringify(String(s[h as keyof typeof s] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportHomepageCertificationSnapshot(snapshot, "csv");
  return [
    "ROVEXO Homepage Enterprise Certification Report",
    `Overall PASS: ${snapshot.dashboard.overallPassPercent}%`,
    `Sections Certified: ${snapshot.dashboard.sectionsCertified}/${snapshot.dashboard.sectionsTotal}`,
    `Certification Granted: ${snapshot.dashboard.certificationGranted ? "YES" : "NO"}`,
    `Production Ready: ${snapshot.dashboard.productionReady ? "YES" : "NO"}`,
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}%`,
    `Protected Areas Enforced: ${snapshot.settings.validationOnlyMode ? "YES" : "NO"}`,
  ].join("\n");
}
