import type { IncidentRecord } from "@/lib/incident-command-center-engine/types";
import { assembleLiveIncidents } from "@/lib/incident-command-center-engine/timeline";
import type { IncidentTimelineLiveContext } from "@/lib/incident-timeline-engine/live";
import type {
  DetectionEngine,
  IncidentTimelineFilters,
  IncidentTimelineOriAnalysis,
  OmegaTimelineIntegrity,
  PersistedTimelineRecord,
  TimelineActionRecord,
  TimelineApprovalRecord,
  TimelineEntry,
  TimelineResolution,
} from "@/lib/incident-timeline-engine/types";

function hashEntry(parts: string[]): string {
  let hash = 0;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `itl-${Math.abs(hash).toString(36)}`;
}

function formatDateParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function durationMinutes(start: string, end: string | null): number | null {
  if (!end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / 60_000);
}

function mapDetectionEngine(assignedEngine: string, source: string): DetectionEngine {
  const text = `${assignedEngine} ${source}`.toLowerCase();
  if (text.includes("omega")) return "OMEGA";
  if (text.includes("guardian")) return "Guardian Enterprise X";
  if (text.includes("sentinel")) return "Sentinel X";
  if (text.includes("antivirus")) return "Antivirus Engine X";
  if (text.includes("ori")) return "ORI";
  if (text.includes("disaster") || text.includes("recovery")) return "Disaster Recovery Engine";
  if (text.includes("identity") || text.includes("auth")) return "Identity Engine";
  if (text.includes("payment") || text.includes("stripe")) return "Payment Engine";
  if (text.includes("wallet")) return "Wallet Engine";
  if (text.includes("operations")) return "Operations Center";
  if (text.includes("health") || text.includes("infra") || text.includes("error")) return "Infrastructure Engine";
  return "Monitoring Engine";
}

function mapDetectionMethod(source: string): string {
  if (source === "operations-center") return "Operations incident pipeline";
  if (source === "omega-enterprise") return "OMEGA continuous monitoring";
  if (source === "device-lifecycle") return "Device trust telemetry";
  if (source === "platform-error-log") return "Platform error log ingestion";
  if (source === "health-report") return "Health check degradation";
  if (source === "audit-log") return "Audit log correlation";
  if (source === "persisted-record") return "Append-only timeline record";
  return "Automated platform monitoring";
}

function buildResolution(incident: IncidentRecord): TimelineResolution | null {
  const resolved = incident.status === "resolved" || incident.status === "closed";
  if (!resolved && incident.resolutionProgress < 100) return null;
  const resolutionTime = resolved ? incident.detectionTime : null;
  return {
    resolved,
    resolutionTime,
    resolutionMethod: incident.status === "closed" ? "Manual close" : resolved ? "Automated resolution" : "In progress",
    totalDurationMinutes: durationMinutes(incident.detectionTime, resolutionTime),
    preventiveActions: incident.recommendedAction,
    lessonsLearned: incident.rootCause ? `Root cause documented: ${incident.rootCause.slice(0, 120)}` : "Pending post-incident review",
  };
}

function buildActionsFromIncident(incident: IncidentRecord, ctx: IncidentTimelineLiveContext): TimelineActionRecord[] {
  const actions: TimelineActionRecord[] = [];
  const ops = ctx.operationsIncidentsFull?.find((i) => `ops-${i.id}` === incident.incidentId);
  for (const event of ops?.timeline ?? []) {
    actions.push({
      id: `action-${event.id}`,
      action: event.action,
      executedAt: event.timestamp,
      result: "Completed",
      source: event.actor ?? "Operations Center",
      automatic: !event.actor,
      rollbackAvailable: false,
    });
  }
  for (const h of ctx.incidentHistory.filter((e) => e.incidentId === incident.incidentId)) {
    actions.push({
      id: `hist-${h.id}`,
      action: h.action,
      executedAt: h.timestamp,
      result: h.detail,
      source: h.actorId,
      automatic: false,
      rollbackAvailable: h.action.includes("emergency") ? false : true,
    });
  }
  return actions.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
}

function buildApprovalsFromAudit(incidentId: string, ctx: IncidentTimelineLiveContext): TimelineApprovalRecord[] {
  const approvals: TimelineApprovalRecord[] = [];
  for (const log of ctx.auditLogs ?? []) {
    if (!log.action.includes("incident") && !log.action.includes("emergency") && !log.action.includes("omega")) continue;
    const meta = log.metadata as Record<string, unknown> | null;
    const logIncidentId = typeof meta?.incidentId === "string" ? meta.incidentId : log.resourceId;
    if (logIncidentId && logIncidentId !== incidentId && !incidentId.includes(logIncidentId)) continue;
    const biometric = Boolean(meta?.biometric ?? meta?.requireBiometric);
    const mfa = Boolean(meta?.mfa ?? meta?.requireMfa ?? log.action.includes("emergency"));
    if (!biometric && !mfa && !log.action.includes("emergency")) continue;
    approvals.push({
      id: `approval-${log.id}`,
      approvedBy: log.actorId ?? "System",
      approvedAt: log.createdAt,
      method: biometric && mfa ? "Biometric + MFA" : mfa ? "MFA" : biometric ? "Biometric" : "Super Admin authorization",
      biometricConfirmed: biometric,
      mfaConfirmed: mfa,
    });
  }
  return approvals;
}

function incidentToEntry(incident: IncidentRecord, ctx: IncidentTimelineLiveContext): TimelineEntry {
  const { date, time } = formatDateParts(incident.detectionTime);
  const detectionEngine = mapDetectionEngine(incident.assignedEngine, incident.source);
  const resolution = buildResolution(incident);
  const resolved = incident.status === "resolved" || incident.status === "closed";

  return {
    id: incident.id,
    incidentId: incident.incidentId,
    date,
    time,
    timestamp: incident.detectionTime,
    severity: incident.severity,
    category: incident.category,
    module: incident.affectedModule,
    status: incident.status,
    title: incident.title,
    detectionTime: incident.detectionTime,
    detectionEngine,
    detectionMethod: mapDetectionMethod(incident.source),
    affectedModule: incident.affectedModule,
    impactLevel: incident.estimatedImpact,
    rootCause: incident.rootCause && incident.rootCause !== "Under investigation" ? incident.rootCause : null,
    evidence: incident.evidence,
    recommendedAction: incident.recommendedAction,
    resolutionStatus: resolved ? "Resolved" : incident.status === "investigating" ? "Investigating" : incident.status === "acknowledged" ? "Acknowledged" : "Open",
    resolutionTime: resolved ? incident.detectionTime : null,
    totalDurationMinutes: durationMinutes(incident.detectionTime, resolved ? incident.detectionTime : null),
    actionHistory: buildActionsFromIncident(incident, ctx),
    approvalHistory: buildApprovalsFromAudit(incident.incidentId, ctx),
    resolution,
    immutable: true,
    sourceHash: hashEntry([incident.incidentId, incident.detectionTime, incident.title]),
  };
}

function persistedToEntry(record: PersistedTimelineRecord): TimelineEntry {
  const { date, time } = formatDateParts(record.timestamp);
  return {
    id: record.id,
    incidentId: record.incidentId,
    date,
    time,
    timestamp: record.timestamp,
    severity: "information",
    category: "notifications",
    module: "Incident Timeline",
    status: "closed",
    title: record.detail,
    detectionTime: record.timestamp,
    detectionEngine: "OMEGA",
    detectionMethod: "Append-only timeline record",
    affectedModule: "Incident Timeline",
    impactLevel: "Audit record",
    rootCause: null,
    evidence: record.eventType,
    recommendedAction: "Review audit trail",
    resolutionStatus: "Recorded",
    resolutionTime: record.timestamp,
    totalDurationMinutes: 0,
    actionHistory: [
      {
        id: `persisted-${record.id}`,
        action: record.eventType,
        executedAt: record.timestamp,
        result: record.detail,
        source: record.actorId,
        automatic: false,
        rollbackAvailable: false,
      },
    ],
    approvalHistory: [],
    resolution: {
      resolved: true,
      resolutionTime: record.timestamp,
      resolutionMethod: "Append-only audit",
      totalDurationMinutes: 0,
      preventiveActions: "N/A",
      lessonsLearned: "Immutable record retained per retention policy",
    },
    immutable: true,
    sourceHash: record.sourceHash,
  };
}

export function assembleTimelineEntries(
  ctx: IncidentTimelineLiveContext,
  persisted: PersistedTimelineRecord[],
): TimelineEntry[] {
  const incidents = assembleLiveIncidents(ctx, ctx.overrides);
  const fromIncidents = incidents.map((i) => incidentToEntry(i, ctx));
  const fromPersisted = persisted.map(persistedToEntry);
  const merged = [...fromIncidents, ...fromPersisted];
  const seen = new Set<string>();
  const deduped: TimelineEntry[] = [];
  for (const entry of merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())) {
    const key = entry.sourceHash;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }
  return deduped;
}

export function filterTimelineEntries(entries: TimelineEntry[], filters: IncidentTimelineFilters): TimelineEntry[] {
  return entries.filter((entry) => {
    if (filters.dateFrom && entry.date < filters.dateFrom) return false;
    if (filters.dateTo && entry.date > filters.dateTo) return false;
    if (filters.severity && entry.severity !== filters.severity) return false;
    if (filters.category && entry.category !== filters.category) return false;
    if (filters.module && !entry.module.toLowerCase().includes(filters.module.toLowerCase())) return false;
    if (filters.detectionEngine && entry.detectionEngine !== filters.detectionEngine) return false;
    if (filters.status && entry.status !== filters.status) return false;
    if (filters.resolutionState === "resolved" && !entry.resolution?.resolved) return false;
    if (filters.resolutionState === "open" && entry.resolution?.resolved) return false;
    if (filters.approvalState === "approved" && entry.approvalHistory.length === 0) return false;
    if (filters.approvalState === "pending" && entry.approvalHistory.length > 0) return false;
    const q = filters.query?.trim().toLowerCase();
    if (q) {
      const haystack = `${entry.title} ${entry.incidentId} ${entry.module} ${entry.category} ${entry.detectionEngine}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function buildTimelineStats(entries: TimelineEntry[]) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: entries.length,
    today: entries.filter((e) => e.date === today).length,
    critical: entries.filter((e) => e.severity === "critical").length,
    resolved: entries.filter((e) => e.resolution?.resolved).length,
    open: entries.filter((e) => !e.resolution?.resolved && e.status !== "closed").length,
  };
}

export function buildOriTimelineAnalysis(entries: TimelineEntry[]): IncidentTimelineOriAnalysis {
  const critical = entries.filter((e) => e.severity === "critical");
  const categoryCounts = new Map<string, number>();
  for (const e of entries) categoryCounts.set(e.category, (categoryCounts.get(e.category) ?? 0) + 1);
  const topCategories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const confirmedFindings: string[] = [];
  if (critical.length > 0) confirmedFindings.push(`${critical.length} critical incident(s) in timeline window`);
  if (topCategories[0]) confirmedFindings.push(`Most frequent category: ${topCategories[0][0]} (${topCategories[0][1]} events)`);

  const recurringPatterns = topCategories.map(([cat, count]) => count >= 2 ? `${cat} appears ${count} times` : "").filter(Boolean);
  const relatedIds = entries.slice(0, 5).map((e) => e.incidentId);

  const aiSuggestions = [
    critical.length >= 2 ? "Consider enabling auto-escalation for repeated critical events" : "",
    topCategories[0]?.[0] === "infrastructure" ? "Schedule infrastructure verification scan via OMEGA" : "",
    entries.some((e) => e.detectionEngine === "Guardian Enterprise X") ? "Review device trust policies in Guardian Enterprise X" : "",
  ].filter(Boolean);

  return {
    incidentSummary: entries.length
      ? `${entries.length} timeline events recorded. ${critical.length} critical, ${entries.filter((e) => e.resolution?.resolved).length} resolved.`
      : "No timeline events in current window.",
    recurringPatterns,
    relatedIncidentIds: relatedIds,
    preventiveRecommendations: [
      "Enable suppressRepeatedAlerts in Incident Command settings when alert noise increases",
      "Run OMEGA global scan after critical infrastructure events",
      "Export audit timeline report for compliance retention",
    ],
    riskTrend: critical.length >= 3 ? "Elevated — multiple critical events detected" : critical.length >= 1 ? "Moderate — critical events present" : "Stable — no critical events in window",
    confirmedFindings,
    aiSuggestions,
    confidence: entries.length >= 10 ? "high" : entries.length >= 3 ? "medium" : "low",
  };
}

export function verifyOmegaTimelineIntegrity(entries: TimelineEntry[], ctx: IncidentTimelineLiveContext): OmegaTimelineIntegrity {
  const hashes = entries.map((e) => e.sourceHash);
  const duplicateEvents = hashes.length - new Set(hashes).size;
  const issues: string[] = [];

  if (ctx.operationsError) issues.push(`Operations incidents unavailable: ${ctx.operationsError}`);
  if (ctx.auditError) issues.push(`Audit log sync issue: ${ctx.auditError}`);
  if (duplicateEvents > 0) issues.push(`${duplicateEvents} duplicate timeline hash(es) detected`);

  const incidentCount = assembleLiveIncidents(ctx, ctx.overrides).length;
  const timelineIncidentCount = entries.filter((e) => e.detectionMethod !== "Append-only timeline record").length;
  const missingEvents = Math.max(0, incidentCount - timelineIncidentCount);
  if (missingEvents > 0) issues.push(`${missingEvents} incident(s) may not be fully synchronized`);

  let timelineIntegrity: OmegaTimelineIntegrity["timelineIntegrity"] = "verified";
  if (issues.length >= 3) timelineIntegrity = "failed";
  else if (issues.length > 0) timelineIntegrity = "warning";

  return {
    timelineIntegrity,
    missingEvents,
    duplicateEvents,
    auditConsistency: ctx.auditError ? "inconsistent" : ctx.auditLogs && ctx.auditLogs.length > 0 ? "consistent" : "warning",
    logSynchronization: ctx.auditError ? "out-of-sync" : "synced",
    retentionPolicy: "90-day rolling retention with append-only audit records",
    lastVerifiedAt: new Date().toISOString(),
    issues,
  };
}

export function validateTimelineReadiness(snapshot: {
  omegaIntegrity: OmegaTimelineIntegrity;
  entries: TimelineEntry[];
}): { ready: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (snapshot.omegaIntegrity.timelineIntegrity === "failed") blockers.push("OMEGA timeline integrity check failed");
  if (snapshot.entries.length === 0) blockers.push("No timeline events available");
  return { ready: blockers.length === 0, blockers };
}
