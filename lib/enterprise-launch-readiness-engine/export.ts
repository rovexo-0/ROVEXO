import type { LaunchReadinessSnapshot } from "@/lib/enterprise-launch-readiness-engine/types";
import { EXPORT_FORMATS } from "@/lib/enterprise-launch-readiness-engine/registry";

export function isValidLaunchReadinessExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportLaunchReadinessSnapshot(snapshot: LaunchReadinessSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["check", "category", "status", "findings", "message"];
    const rows = snapshot.launchScan.checks.map((c) =>
      headers.map((h) => JSON.stringify(String(c[h as keyof typeof c] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportLaunchReadinessSnapshot(snapshot, "csv");
  return [
    "ROVEXO Enterprise Launch Readiness Report",
    `Overall PASS: ${snapshot.dashboard.overallPassPercent}%`,
    `Launch Ready: ${snapshot.dashboard.launchReady ? "YES" : "NO"}`,
    `Production Ready: ${snapshot.dashboard.productionReady ? "YES" : "NO"}`,
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}%`,
    `Active Blockers: ${snapshot.blockers.filter((b) => b.active).length}`,
  ].join("\n");
}
