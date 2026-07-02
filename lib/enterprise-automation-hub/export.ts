import type { AutomationSnapshot } from "@/lib/enterprise-automation-hub/types";
import { EXPORT_FORMATS } from "@/lib/enterprise-automation-hub/registry";

export function isValidAutomationExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportAutomationSnapshot(snapshot: AutomationSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "yaml") {
    const lines = [
      `exportedAt: ${new Date().toISOString()}`,
      "workflows:",
      ...snapshot.workflows.map((w) => `  - id: ${w.id}\n    name: ${w.name}\n    type: ${w.type}`),
    ];
    return lines.join("\n");
  }
  const headers = ["id", "name", "type", "mode", "enabled", "steps"];
  const rows = snapshot.workflows.map((w) =>
    headers.map((h) => JSON.stringify(String(w[h as keyof typeof w] ?? ""))).join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

export function parseAutomationImportPayload(raw: string): Partial<AutomationSnapshot> {
  try {
    return JSON.parse(raw) as Partial<AutomationSnapshot>;
  } catch {
    return {};
  }
}
