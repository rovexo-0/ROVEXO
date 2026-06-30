import type { ObservabilitySnapshot } from "@/lib/enterprise-observability-center/types";
import { EXPORT_FORMATS } from "@/lib/enterprise-observability-center/registry";

export function isValidObservabilityExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportObservabilitySnapshot(snapshot: ObservabilitySnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["id", "label", "status", "latencyMs", "uptime"];
    const rows = snapshot.subsystems.map((s) =>
      headers.map((h) => JSON.stringify(String(s[h as keyof typeof s] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportObservabilitySnapshot(snapshot, "csv");
  return [
    "ROVEXO Enterprise Observability Center Report",
    `Platform Health: ${snapshot.dashboard.platformHealth}%`,
    `Availability: ${snapshot.dashboard.availability}%`,
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}%`,
    `Active Alerts: ${snapshot.dashboard.activeAlerts}`,
    `Read-Only Monitoring: ${snapshot.settings.readOnlyMonitoring ? "ENABLED" : "DISABLED"}`,
  ].join("\n");
}
