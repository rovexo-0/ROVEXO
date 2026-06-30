import type { SocSnapshot } from "@/lib/enterprise-security-operations-center/types";
import { formatComplianceReport } from "@/lib/enterprise-security-operations-center/compliance";

export type SocExportFormat = "csv" | "json" | "pdf";

export function isValidSocExportFormat(value: string): value is SocExportFormat {
  return ["csv", "json", "pdf"].includes(value);
}

export function exportSocSnapshot(snapshot: SocSnapshot, format: SocExportFormat): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["id", "category", "level", "summary", "source", "timestamp"];
    const rows = snapshot.events.map((e) =>
      headers.map((h) => JSON.stringify(String(e[h as keyof typeof e] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  return [
    "ROVEXO Security Operations Center Report",
    `Threat Level: ${snapshot.dashboard.threatLevel}`,
    `Security Score: ${snapshot.dashboard.securityScore}%`,
    `Blocked Attacks: ${snapshot.dashboard.blockedAttacks}`,
    formatComplianceReport(snapshot.complianceFrameworks),
  ].join("\n");
}

export function exportThreatReport(snapshot: SocSnapshot, format: SocExportFormat): string {
  if (format === "json") return JSON.stringify(snapshot.threats, null, 2);
  return snapshot.threats.map((t) => `${t.ip} (${t.country}) — confidence ${t.confidence}%`).join("\n");
}

export function parseSocImportPayload(raw: string): { events?: SocSnapshot["events"] } {
  try {
    return JSON.parse(raw) as { events?: SocSnapshot["events"] };
  } catch {
    return {};
  }
}
