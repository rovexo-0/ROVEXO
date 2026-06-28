import type { GlobalUiIntegritySnapshot } from "@/lib/omega-global-ui-integrity-engine/types";
import { EXPORT_FORMATS } from "@/lib/omega-global-ui-integrity-engine/registry";

export function isValidGlobalUiIntegrityExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportGlobalUiIntegritySnapshot(snapshot: GlobalUiIntegritySnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["screenId", "label", "domain", "route", "passPercent", "status"];
    const rows = snapshot.screens.map((s) =>
      headers.map((h) => JSON.stringify(String(s[h as keyof typeof s] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportGlobalUiIntegritySnapshot(snapshot, "csv");
  return [
    "ROVEXO OMEGA Global UI Integrity Report",
    `Overall PASS: ${snapshot.dashboard.overallPassPercent}%`,
    `Screens Certified: ${snapshot.dashboard.screensCertified}/${snapshot.dashboard.screensTotal}`,
    `Certification: ${snapshot.dashboard.certificationGranted ? "GRANTED" : "PENDING"}`,
    `Production Ready: ${snapshot.dashboard.productionReady ? "YES" : "NO"}`,
    `Launch Ready: ${snapshot.dashboard.launchReady ? "YES" : "NO"}`,
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}%`,
  ].join("\n");
}
