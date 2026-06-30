import type { ExecutionEngineSnapshot } from "@/lib/enterprise-autonomous-execution-engine/types";
import { EXPORT_FORMATS } from "@/lib/enterprise-autonomous-execution-engine/registry";

export function isValidExecutionExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportExecutionEngineSnapshot(snapshot: ExecutionEngineSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["id", "title", "queue", "status", "priority"];
    const rows = snapshot.tasks.map((t) =>
      headers.map((h) => JSON.stringify(String(t[h as keyof typeof t] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportExecutionEngineSnapshot(snapshot, "csv");
  return [
    "ROVEXO Enterprise Autonomous Execution Engine Report",
    `Running Workflows: ${snapshot.dashboard.runningWorkflows}`,
    `Waiting Approval: ${snapshot.dashboard.waitingApproval}`,
    `Platform Readiness: ${snapshot.dashboard.platformReadiness}%`,
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}%`,
    `Protected Areas Enforced: ${snapshot.settings.neverBypassProtectedAreas ? "YES" : "NO"}`,
  ].join("\n");
}
