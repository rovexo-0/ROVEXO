import type { IncidentRecord, IncidentSnapshot, PostmortemReport } from "@/lib/incident-response-center/types";
import { formatPostmortemMarkdown } from "@/lib/incident-response-center/postmortem";

export type ExportFormat = "csv" | "json" | "pdf";

export function exportIncidents(incidents: IncidentRecord[], format: ExportFormat): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), incidents }, null, 2);
  }
  if (format === "csv") {
    const headers = ["id", "priority", "category", "detectedBy", "affectedService", "startedAt", "durationMinutes", "owner", "status", "title"];
    const rows = incidents.map((i) =>
      headers.map((h) => JSON.stringify(String(i[h as keyof IncidentRecord] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  return incidents.map((i) => `${i.id}: [${i.priority}] ${i.title} (${i.status})`).join("\n");
}

export function exportSnapshot(snapshot: IncidentSnapshot, format: ExportFormat): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    return exportIncidents(snapshot.incidents, "csv");
  }
  return `Incident Response Center Export\nActive: ${snapshot.dashboard.activeIncidents}\nCritical: ${snapshot.dashboard.critical}`;
}

export function exportPostmortem(report: PostmortemReport, format: ExportFormat): string {
  if (format === "json") return JSON.stringify(report, null, 2);
  if (format === "pdf") return formatPostmortemMarkdown(report);
  return formatPostmortemMarkdown(report);
}

export function isValidExportFormat(value: string): value is ExportFormat {
  return ["csv", "json", "pdf"].includes(value);
}

export function parseImportPayload(raw: string): { incidents?: IncidentRecord[] } {
  try {
    const parsed = JSON.parse(raw) as { incidents?: IncidentRecord[] };
    return parsed;
  } catch {
    return {};
  }
}
