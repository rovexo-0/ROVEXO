import type { IncidentLiveContext } from "@/lib/incident-command-center-engine/live";
import type {
  IncidentAnalytics,
  IncidentCategory,
  IncidentDashboardCounts,
  IncidentOriAnalysis,
  IncidentRecord,
  IncidentRiskLevel,
  IncidentSeverity,
  IncidentStateOverride,
  IncidentStatus,
} from "@/lib/incident-command-center-engine/types";

function classifyCategory(input: { module: string; title: string; source: string }): IncidentCategory {
  const text = `${input.module} ${input.title} ${input.source}`.toLowerCase();
  const rules: Array<[IncidentCategory, string[]]> = [
    ["guardian", ["guardian"]],
    ["sentinel", ["sentinel"]],
    ["antivirus", ["antivirus"]],
    ["ori", ["ori"]],
    ["compliance", ["compliance", "gdpr", "soc"]],
    ["certification", ["certification", "certificate"]],
    ["payments", ["payment", "stripe"]],
    ["wallet", ["wallet", "withdrawal"]],
    ["identity", ["identity", "auth", "login", "biometric"]],
    ["authentication", ["authentication", "mfa", "session"]],
    ["database", ["database", "db", "postgres", "supabase"]],
    ["api", ["api", "gateway", "endpoint"]],
    ["infrastructure", ["infrastructure", "infra", "server"]],
    ["network", ["network", "latency", "cdn"]],
    ["performance", ["performance", "latency", "slow"]],
    ["storage", ["storage", "disk"]],
    ["backup", ["backup"]],
    ["recovery", ["recovery", "disaster"]],
    ["queue", ["queue", "email"]],
    ["jobs", ["job", "worker"]],
    ["cron", ["cron", "scheduled"]],
    ["marketplace", ["marketplace", "listing", "order"]],
    ["security", ["security", "tamper", "root", "jailbreak", "threat"]],
    ["notifications", ["notification", "push"]],
    ["application", ["application", "app"]],
    ["cloud", ["cloud"]],
    ["server", ["server"]],
  ];
  for (const [category, keywords] of rules) {
    if (keywords.some((k) => text.includes(k))) return category;
  }
  return "infrastructure";
}

function mapSeverity(priority: string): IncidentSeverity {
  if (priority === "critical") return "critical";
  if (priority === "high") return "high";
  if (priority === "medium" || priority === "warning") return "medium";
  if (priority === "low") return "low";
  return "information";
}

function mapRisk(severity: IncidentSeverity): IncidentRiskLevel {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

function buildIncidentRecord(input: {
  id: string;
  title: string;
  module: string;
  source: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectionTime: string;
  recommendedAction: string;
  rootCause: string;
  evidence: string;
  assignedEngine: string;
  override?: IncidentStateOverride;
}): IncidentRecord {
  const category = classifyCategory({ module: input.module, title: input.title, source: input.source });
  const status = input.override?.status ?? input.status;
  const resolutionProgress =
    input.override?.resolutionProgress ??
    (status === "resolved" || status === "closed" ? 100 : status === "acknowledged" || status === "investigating" ? 40 : 10);

  return {
    id: input.id,
    incidentId: input.id,
    severity: input.severity,
    category,
    affectedModule: input.module,
    detectionTime: input.detectionTime,
    status,
    assignedEngine: input.assignedEngine,
    rootCause: input.rootCause,
    riskLevel: mapRisk(input.severity),
    recommendedAction: input.recommendedAction,
    estimatedImpact: input.severity === "critical" ? "High platform impact" : input.severity === "high" ? "Moderate impact" : "Limited impact",
    evidence: input.evidence,
    resolutionProgress,
    title: input.title,
    source: input.source,
    assignee: input.override?.assignee,
  };
}

export function assembleLiveIncidents(ctx: IncidentLiveContext, overrides: Record<string, IncidentStateOverride>): IncidentRecord[] {
  const raw: IncidentRecord[] = [];

  for (const incident of ctx.operationsIncidents ?? []) {
    raw.push(
      buildIncidentRecord({
        id: `ops-${incident.id}`,
        title: incident.title,
        module: "Operations Center",
        source: "operations-center",
        severity: mapSeverity(incident.priority),
        status: incident.status === "resolved" || incident.status === "archived" ? "resolved" : incident.status === "investigating" ? "investigating" : "open",
        detectionTime: incident.createdAt,
        recommendedAction: incident.notes ?? "Review operations timeline and assign owner.",
        rootCause: incident.notes ?? "Under investigation",
        evidence: incident.timeline.map((t) => t.action).join("; ") || "Operations timeline available",
        assignedEngine: "Operations Center",
        override: overrides[`ops-${incident.id}`],
      }),
    );
  }

  for (const alert of ctx.omegaAlerts ?? []) {
    if (alert.status === "resolved") continue;
    raw.push(
      buildIncidentRecord({
        id: `omega-${alert.id}`,
        title: alert.title,
        module: alert.module,
        source: "omega-enterprise",
        severity: mapSeverity(alert.severity === "information" ? "low" : alert.severity),
        status: alert.status === "acknowledged" ? "acknowledged" : "open",
        detectionTime: alert.createdAt,
        recommendedAction: alert.recommendedAction,
        rootCause: alert.message,
        evidence: alert.message,
        assignedEngine: "OMEGA Enterprise",
        override: overrides[`omega-${alert.id}`],
      }),
    );
  }

  for (const alert of ctx.deviceAlerts ?? []) {
    if (alert.resolved) continue;
    raw.push(
      buildIncidentRecord({
        id: `device-${alert.id}`,
        title: alert.title,
        module: "Device Lifecycle Manager",
        source: "device-lifecycle",
        severity: mapSeverity(alert.priority),
        status: "open",
        detectionTime: alert.createdAt,
        recommendedAction: alert.message,
        rootCause: alert.message,
        evidence: alert.message,
        assignedEngine: "Guardian Enterprise X",
        override: overrides[`device-${alert.id}`],
      }),
    );
  }

  for (const error of ctx.platformErrors ?? []) {
    raw.push(
      buildIncidentRecord({
        id: `err-${error.id}`,
        title: error.message.slice(0, 140),
        module: error.category,
        source: "platform-error-log",
        severity: error.level === "error" ? "high" : "medium",
        status: "open",
        detectionTime: error.createdAt,
        recommendedAction: "Inspect platform error logs and remediate.",
        rootCause: error.message,
        evidence: `${error.level} · ${error.category}`,
        assignedEngine: "Infrastructure Engine",
        override: overrides[`err-${error.id}`],
      }),
    );
  }

  if (ctx.health?.status === "degraded" || ctx.health?.status === "unhealthy") {
    raw.push(
      buildIncidentRecord({
        id: `health-${ctx.health.timestamp}`,
        title: `Platform health ${ctx.health.status}`,
        module: "Platform Health",
        source: "health-report",
        severity: ctx.health.status === "unhealthy" ? "critical" : "high",
        status: "open",
        detectionTime: ctx.health.timestamp,
        recommendedAction: "Run global scan and verify infrastructure checks.",
        rootCause: Object.entries(ctx.health.checks)
          .filter(([, check]) => check.status !== "healthy")
          .map(([name, check]) => `${name}: ${check.message ?? check.status}`)
          .join("; ") || "Health check degradation",
        evidence: `Overall status: ${ctx.health.status}`,
        assignedEngine: "OMEGA Enterprise",
        override: overrides[`health-${ctx.health.timestamp}`],
      }),
    );
  }

  return smartPriorityEngine(raw, { suppressRepeated: true });
}

export function smartPriorityEngine(
  incidents: IncidentRecord[],
  options: { suppressRepeated?: boolean; suppressWindowMinutes?: number },
): IncidentRecord[] {
  const merged = new Map<string, IncidentRecord>();

  for (const incident of incidents) {
    const key = `${incident.affectedModule}:${incident.title}`.toLowerCase();
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, {
        ...existing,
        mergedCount: (existing.mergedCount ?? 1) + 1,
        severity: existing.severity === "critical" || incident.severity === "critical" ? "critical" : existing.severity,
      });
      continue;
    }
    merged.set(key, { ...incident, mergedCount: 1 });
  }

  let result = [...merged.values()];

  if (options.suppressRepeated) {
    result = result.filter((i) => (i.mergedCount ?? 1) <= 5 || i.severity === "critical" || i.severity === "high");
  }

  const now = Date.now();
  result = result.map((incident) => {
    const ageHours = (now - new Date(incident.detectionTime).getTime()) / 3_600_000;
    if (incident.severity === "critical" && incident.status === "open" && ageHours > 2) {
      return { ...incident, status: "escalated" as const };
    }
    return incident;
  });

  return result.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, information: 4 };
    return severityOrder[a.severity] - severityOrder[b.severity] || new Date(b.detectionTime).getTime() - new Date(a.detectionTime).getTime();
  });
}

export function buildIncidentDashboard(incidents: IncidentRecord[], resolvedToday: number | null): IncidentDashboardCounts {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const resolvedFromFeed = incidents.filter((i) => (i.status === "resolved" || i.status === "closed") && new Date(i.detectionTime) >= todayStart).length;

  return {
    critical: incidents.filter((i) => i.severity === "critical" && !["resolved", "closed"].includes(i.status)).length,
    high: incidents.filter((i) => i.severity === "high" && !["resolved", "closed"].includes(i.status)).length,
    medium: incidents.filter((i) => i.severity === "medium" && !["resolved", "closed"].includes(i.status)).length,
    low: incidents.filter((i) => (i.severity === "low" || i.severity === "information") && !["resolved", "closed"].includes(i.status)).length,
    resolvedToday: resolvedToday ?? resolvedFromFeed,
    open: incidents.filter((i) => i.status === "open").length,
    acknowledged: incidents.filter((i) => i.status === "acknowledged").length,
    ignored: incidents.filter((i) => i.status === "ignored").length,
    escalated: incidents.filter((i) => i.status === "escalated").length,
  };
}

export function buildIncidentOriAnalyses(incidents: IncidentRecord[]): IncidentOriAnalysis[] {
  return incidents.slice(0, 6).map((incident) => {
    const hasEvidence = incident.evidence.length > 20;
    return {
      incidentId: incident.incidentId,
      rootCause: incident.rootCause,
      impact: incident.estimatedImpact,
      recommendedActions: incident.recommendedAction,
      priority: incident.severity,
      resolutionDifficulty: incident.severity === "critical" ? "High" : incident.severity === "high" ? "Moderate" : "Low",
      preventiveRecommendations: `Enable monitoring for ${incident.category} and configure auto-escalation.`,
      confidence: hasEvidence && incident.source !== "platform-error-log" ? "high" : hasEvidence ? "medium" : "low",
      dataNote: hasEvidence ? undefined : "Additional diagnostic data required for higher confidence.",
    };
  });
}

export function buildIncidentAnalytics(incidents: IncidentRecord[], ctx: IncidentLiveContext): IncidentAnalytics {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIncidents = incidents.filter((i) => new Date(i.detectionTime) >= todayStart);
  const categoryCounts = new Map<string, number>();
  for (const incident of todayIncidents) {
    categoryCounts.set(incident.category, (categoryCounts.get(incident.category) ?? 0) + 1);
  }

  const distribution: Record<IncidentSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    information: 0,
  };
  for (const incident of incidents) distribution[incident.severity] += 1;

  return {
    incidentsToday: todayIncidents.length,
    resolvedToday: ctx.resolvedTodayCount ?? incidents.filter((i) => i.status === "resolved" || i.status === "closed").length,
    criticalIncidents: incidents.filter((i) => i.severity === "critical").length,
    averageResolutionMinutes: null,
    topIncidentTypes: [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count })),
    incidentTrend: [
      { label: "Critical", count: distribution.critical },
      { label: "High", count: distribution.high },
      { label: "Medium", count: distribution.medium },
      { label: "Low", count: distribution.low + distribution.information },
    ],
    systemAvailability: ctx.health?.status === "healthy" ? 99.98 : ctx.health?.status === "degraded" ? 98.5 : ctx.health ? 95 : null,
    alertDistribution: distribution,
  };
}

export function filterIncidentsByTab(incidents: IncidentRecord[], tab: string): IncidentRecord[] {
  if (tab === "critical") return incidents.filter((i) => i.severity === "critical");
  if (tab === "security") return incidents.filter((i) => ["security", "guardian", "sentinel", "antivirus", "authentication"].includes(i.category));
  if (tab === "infrastructure") return incidents.filter((i) => ["infrastructure", "database", "api", "network", "server", "cloud", "performance"].includes(i.category));
  if (tab === "payments") return incidents.filter((i) => i.category === "payments");
  if (tab === "wallet") return incidents.filter((i) => i.category === "wallet");
  if (tab === "identity") return incidents.filter((i) => ["identity", "authentication"].includes(i.category));
  if (tab === "compliance") return incidents.filter((i) => ["compliance", "certification"].includes(i.category));
  return incidents;
}

export function validateIncidentCommandReadiness(snapshot: { dashboard: IncidentDashboardCounts; integrations: Record<string, boolean> }): {
  ready: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];
  if (!snapshot.integrations.omega) blockers.push("OMEGA integration required");
  if (!snapshot.integrations.guardianEnterpriseX) blockers.push("Guardian Enterprise X required");
  if (snapshot.dashboard.critical > 0) blockers.push(`${snapshot.dashboard.critical} critical incident(s) open`);
  return { ready: blockers.length === 0, blockers };
}
