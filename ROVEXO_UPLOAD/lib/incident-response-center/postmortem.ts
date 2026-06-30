import type { IncidentRecord, PostmortemReport, RootCauseAnalysis } from "@/lib/incident-response-center/types";

export function generatePostmortem(
  incident: IncidentRecord,
  analysis?: RootCauseAnalysis,
): PostmortemReport {
  return {
    id: `pm-${incident.id}`,
    incidentId: incident.id,
    summary: `Post-incident review for ${incident.title}`,
    impact: `${incident.priority.toUpperCase()} severity incident affecting ${incident.affectedService}. Duration: ${incident.durationMinutes} minutes.`,
    timeline: analysis?.timeline ?? [
      `${incident.startedAt}: Detected`,
      `Investigation initiated`,
      incident.resolvedAt ? `${incident.resolvedAt}: Resolved` : "Resolution pending",
    ],
    rootCause: analysis?.aiExplanation ?? "Root cause under investigation",
    fixApplied: incident.status === "resolved"
      ? "Mitigation applied and service restored to normal operation"
      : "Fix in progress",
    lessonsLearned: [
      "Improve monitoring coverage for early detection",
      "Update runbook for similar incident types",
      "Review escalation thresholds",
    ],
    recommendations: [
      "Add automated health checks for affected service",
      "Schedule preventive maintenance window",
      "Update on-call rotation documentation",
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function formatPostmortemMarkdown(report: PostmortemReport): string {
  return [
    `# Postmortem: ${report.incidentId}`,
    "",
    "## Summary",
    report.summary,
    "",
    "## Impact",
    report.impact,
    "",
    "## Timeline",
    ...report.timeline.map((t) => `- ${t}`),
    "",
    "## Root Cause",
    report.rootCause,
    "",
    "## Fix Applied",
    report.fixApplied,
    "",
    "## Lessons Learned",
    ...report.lessonsLearned.map((l) => `- ${l}`),
    "",
    "## Recommendations",
    ...report.recommendations.map((r) => `- ${r}`),
  ].join("\n");
}

export function formatPostmortemPdfContent(report: PostmortemReport): string {
  return formatPostmortemMarkdown(report);
}
