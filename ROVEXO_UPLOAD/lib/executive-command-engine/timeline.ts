import type { ExecutiveLiveContext } from "@/lib/executive-command-engine/live";
import {
  healthCheckToScore,
  healthStatusToScore,
  liveNumberMetric,
  liveTextMetric,
  unavailableMetric,
} from "@/lib/executive-command-engine/live";
import { EXECUTIVE_CERTIFICATION_LABELS } from "@/lib/executive-command-engine/registry";
import type {
  ExecutiveBusinessOverview,
  ExecutiveCertificationItem,
  ExecutiveCommandSnapshot,
  ExecutiveIncident,
  ExecutiveIncidentSummary,
  ExecutiveInfrastructure,
  ExecutiveLiveMetric,
  ExecutiveOriRecommendation,
  ExecutivePerformance,
  ExecutivePlatformHealth,
  ExecutiveSecurityOverview,
} from "@/lib/executive-command-engine/types";
import type { OmegaCertificationItem } from "@/lib/omega-enterprise-mobile-engine/types";

function scoreMetric(label: string, score: number | null): ExecutiveLiveMetric {
  if (score === null) return unavailableMetric(label);
  return { label, value: score, available: true, display: `${score}%`, unit: "%" };
}

function buildPlatformHealth(ctx: ExecutiveLiveContext): ExecutivePlatformHealth {
  const { health, dashboard, operations } = ctx;
  const checks = health?.checks;

  const marketplaceScore =
    dashboard && operations
      ? Math.round(
          Math.min(
            100,
            (dashboard.metrics.totalListings > 0 ? 90 : 60) +
              (operations.platform.pendingModeration === 0 ? 10 : -operations.platform.pendingModeration),
          ),
        )
      : null;

  const walletScore =
    dashboard && operations
      ? operations.platform.pendingWithdrawals > 5
        ? 68
        : dashboard.metrics.walletBalance >= 0
          ? 96
          : null
      : null;

  return {
    overall: scoreMetric("Overall Platform Health", healthStatusToScore(health?.status)),
    marketplace: scoreMetric("Marketplace Health", marketplaceScore),
    wallet: scoreMetric("Wallet Health", walletScore),
    payments: scoreMetric("Payments Health", healthCheckToScore(checks?.stripe)),
    identity: scoreMetric("Identity Health", operations?.environment.supabase ? 98 : operations ? 45 : null),
    api: scoreMetric("API Health", healthCheckToScore(checks?.api)),
    database: scoreMetric("Database Health", healthCheckToScore(checks?.database)),
    infrastructure: scoreMetric(
      "Infrastructure Health",
      health
        ? (() => {
            const scores = [checks?.api, checks?.database, checks?.redis, checks?.storage]
              .map(healthCheckToScore)
              .filter((s): s is number => s !== null);
            return scores.length
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : null;
          })()
        : null,
    ),
    communication: scoreMetric("Communication Health", healthCheckToScore(checks?.email)),
  };
}

function buildIncidents(ctx: ExecutiveLiveContext): ExecutiveIncident[] {
  const items: ExecutiveIncident[] = [];

  for (const incident of ctx.incidents ?? []) {
    items.push({
      id: incident.id,
      severity: incident.priority === "critical" ? "critical" : incident.priority === "high" ? "high" : incident.priority === "medium" ? "medium" : "low",
      status: incident.status,
      time: incident.createdAt,
      module: "Operations Center",
      title: incident.title,
      recommendedAction: incident.notes ?? "Review incident timeline and assign owner.",
      source: "operations",
    });
  }

  for (const alert of ctx.omegaAlerts ?? []) {
    if (alert.status === "resolved") continue;
    items.push({
      id: alert.id,
      severity: alert.severity === "information" ? "warning" : alert.severity,
      status: alert.status,
      time: alert.createdAt,
      module: alert.module,
      title: alert.title,
      recommendedAction: alert.recommendedAction,
      source: "omega",
    });
  }

  for (const error of ctx.operations?.errors.slice(0, 5) ?? []) {
    items.push({
      id: error.id,
      severity: error.level === "error" ? "high" : "medium",
      status: "open",
      time: error.createdAt,
      module: error.category,
      title: error.message.slice(0, 120),
      recommendedAction: "Inspect platform error logs and remediate root cause.",
      source: "platform-error",
    });
  }

  return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

function buildIncidentSummary(incidents: ExecutiveIncident[]): ExecutiveIncidentSummary {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const resolvedToday = incidents.filter((i) => i.status === "resolved" && new Date(i.time) >= todayStart).length;
  const open = incidents.filter((i) => i.status !== "resolved" && i.status !== "archived").length;

  return {
    critical: liveNumberMetric("Critical Incidents", incidents.filter((i) => i.severity === "critical" && i.status !== "resolved").length),
    highPriority: liveNumberMetric("High Priority", incidents.filter((i) => i.severity === "high" && i.status !== "resolved").length),
    warnings: liveNumberMetric("Warnings", incidents.filter((i) => i.severity === "warning" || i.severity === "medium").filter((i) => i.status !== "resolved").length),
    resolvedToday: liveNumberMetric("Resolved Today", resolvedToday),
    openIncidents: liveNumberMetric("Open Incidents", open),
  };
}

function buildInfrastructure(ctx: ExecutiveLiveContext): ExecutiveInfrastructure {
  const { health, operations } = ctx;
  const checks = health?.checks;

  const latencyMs = checks?.api.latencyMs ?? checks?.database.latencyMs ?? null;
  const backgroundJobs = operations?.cron.recentRuns.length ?? null;
  const dbLatency = checks?.database.latencyMs ?? null;

  const availability =
    health?.status === "healthy" ? 99.98 : health?.status === "degraded" ? 98.5 : health ? 95 : null;

  const capacity =
    health?.status === "healthy"
      ? "Within capacity"
      : health?.status === "degraded"
        ? "Approaching limits"
        : health
          ? "Capacity review required"
          : null;

  return {
    cpu: unavailableMetric("CPU"),
    ram: unavailableMetric("RAM"),
    storage: liveTextMetric("Storage", checks?.storage.status === "healthy" ? "Available" : checks ? checks.storage.message ?? checks.storage.status : null),
    bandwidth: unavailableMetric("Bandwidth"),
    latency: liveNumberMetric("Latency", latencyMs, "ms"),
    backgroundJobs: liveNumberMetric("Background Jobs", backgroundJobs),
    databaseConnections: liveNumberMetric("Database Connections", dbLatency, "ms"),
    serverAvailability: liveNumberMetric("Server Availability", availability, "%"),
    estimatedCapacity: liveTextMetric("Estimated Capacity", capacity),
  };
}

function buildBusiness(ctx: ExecutiveLiveContext): ExecutiveBusinessOverview {
  const { dashboard, operations } = ctx;
  const pendingOrders =
    dashboard && operations ? operations.platform.awaitingPayment + operations.platform.awaitingShipment : null;

  return {
    dailyRevenue: liveNumberMetric(
      "Daily Revenue",
      dashboard ? dashboard.metrics.revenueToday : null,
      undefined,
      (n) => `£${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ),
    transactions24h: liveNumberMetric("24 Hour Transactions", ctx.transactions24h),
    orders: liveNumberMetric("Orders", dashboard ? dashboard.orders.totalOrders : null),
    completedOrders: liveNumberMetric("Completed Orders", dashboard ? dashboard.orders.completed : operations?.platform.completedOrders ?? null),
    pendingOrders: liveNumberMetric("Pending Orders", pendingOrders),
    buyerProtectionRevenue: liveNumberMetric(
      "Buyer Protection Revenue",
      ctx.protectionFee24h,
      undefined,
      (n) => `£${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ),
    walletActivity: liveNumberMetric(
      "Wallet Activity",
      dashboard ? dashboard.metrics.walletBalance : null,
      undefined,
      (n) => `£${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total balance`,
    ),
    refundActivity: liveNumberMetric("Refund Activity", ctx.refundCount24h, undefined, (n) => `${n} refunds (24h)`),
  };
}

function buildCertifications(omegaCerts: OmegaCertificationItem[] | null): ExecutiveCertificationItem[] {
  return EXECUTIVE_CERTIFICATION_LABELS.map((label, index) => {
    const omega = omegaCerts?.find((c) => c.label.toUpperCase() === label.toUpperCase() || c.label.includes(label.split(" ")[0] ?? ""));
    const byIndex = omegaCerts?.[index];
    const match = omega ?? byIndex;
    if (!match) {
      return { id: `cert-${index}`, label, status: "unavailable" as const, detail: "No live data" };
    }
    return { id: match.id, label, status: match.status, detail: match.detail };
  });
}

function buildSecurity(ctx: ExecutiveLiveContext, omegaSecurity: import("@/lib/omega-enterprise-mobile-engine/types").OmegaSecurityOverview | null): ExecutiveSecurityOverview {
  const openCritical = (ctx.omegaAlerts ?? []).filter((a) => a.severity === "critical" && a.status !== "resolved").length;
  const errors = ctx.operations?.errors.length ?? null;

  const threatLevel =
    openCritical > 0 ? "critical" : (errors ?? 0) > 5 ? "elevated" : ctx.health?.status === "degraded" ? "elevated" : ctx.health ? "low" : null;

  return {
    threatLevel: liveTextMetric("Threat Level", threatLevel),
    blockedAttacks: unavailableMetric("Blocked Attacks"),
    failedLogins: unavailableMetric("Failed Logins"),
    deviceTrust: liveNumberMetric("Device Trust", ctx.deviceTrustScore, "%"),
    certificateStatus: liveTextMetric("Certificate Status", omegaSecurity?.certificateStatus ?? null),
    encryptionStatus: liveTextMetric("Encryption Status", omegaSecurity?.encryption ?? null),
    guardianStatus: liveTextMetric("Guardian Status", omegaSecurity?.guardianStatus ?? null),
    sentinelStatus: liveTextMetric("Sentinel Status", omegaSecurity?.sentinelStatus ?? null),
  };
}

function buildPerformance(ctx: ExecutiveLiveContext): ExecutivePerformance {
  const checks = ctx.health?.checks;
  const apiMs = checks?.api.latencyMs ?? null;
  const dbMs = checks?.database.latencyMs ?? null;
  const cacheStatus = checks?.redis.status === "healthy" ? "Online" : checks ? checks.redis.message ?? checks.redis.status : null;
  const load = ctx.dashboard?.metrics.onlineUsers ?? null;
  const availability = ctx.health?.status === "healthy" ? 99.98 : ctx.health?.status === "degraded" ? 98.5 : ctx.health ? 95 : null;

  const scores = [healthCheckToScore(checks?.api), healthCheckToScore(checks?.database), healthCheckToScore(checks?.redis)].filter(
    (s): s is number => s !== null,
  );
  const performanceScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return {
    apiResponseTime: liveNumberMetric("API Response Time", apiMs, "ms"),
    databaseSpeed: liveNumberMetric("Database Speed", dbMs, "ms"),
    cacheStatus: liveTextMetric("Cache Status", cacheStatus),
    performanceScore: liveNumberMetric("Performance Score", performanceScore, "%"),
    currentLoad: liveNumberMetric("Current Load", load, undefined, (n) => `${n.toLocaleString()} live users`),
    systemAvailability: liveNumberMetric("System Availability", availability, "%"),
    trend: [
      { label: "API", value: apiMs, available: apiMs !== null },
      { label: "DB", value: dbMs, available: dbMs !== null },
      { label: "Score", value: performanceScore, available: performanceScore !== null },
    ],
  };
}

export function buildExecutiveOriRecommendations(ctx: ExecutiveLiveContext, incidents: ExecutiveIncident[]): ExecutiveOriRecommendation[] {
  const recommendations: ExecutiveOriRecommendation[] = [];

  const openCritical = incidents.filter((i) => i.severity === "critical" && i.status !== "resolved");
  if (openCritical.length > 0) {
    recommendations.push({
      id: "ori-p1-critical",
      priority: 1,
      title: "Resolve critical incidents",
      recommendedActions: openCritical.slice(0, 2).map((i) => i.recommendedAction).join(" · "),
      estimatedImpact: "High — reduces platform risk immediately",
      estimatedRisk: "Critical incidents elevate operational and security risk",
      expectedImprovement: "Restores executive confidence and platform stability",
    });
  } else if (ctx.health?.status === "degraded") {
    recommendations.push({
      id: "ori-p1-health",
      priority: 1,
      title: "Address degraded platform health",
      recommendedActions: "Run global scan, review API and database latency, restart background services if needed.",
      estimatedImpact: "High — prevents SLA breach",
      estimatedRisk: "Degraded health may worsen during peak traffic",
      expectedImprovement: "Return platform health to 95%+",
    });
  }

  if (ctx.dashboard && ctx.dashboard.operations.platform.openProtectionCases > 0) {
    recommendations.push({
      id: "ori-p2-protection",
      priority: 2,
      title: "Review open buyer protection cases",
      recommendedActions: `Triage ${ctx.dashboard.operations.platform.openProtectionCases} open protection case(s) via Protection Engine.`,
      estimatedImpact: "Medium — improves trust and resolution time",
      estimatedRisk: "Unresolved cases increase dispute exposure",
      expectedImprovement: "Lower open case backlog within 48 hours",
    });
  }

  if (ctx.health?.checks.redis.status !== "healthy") {
    recommendations.push({
      id: "ori-p3-cache",
      priority: 3,
      title: "Validate cache infrastructure",
      recommendedActions: "Open Infrastructure monitor and verify Redis connectivity.",
      estimatedImpact: "Medium — improves response times",
      estimatedRisk: "Cache degradation increases API latency",
      expectedImprovement: "Stabilize cache hit rate and API p95",
      dataNote: ctx.health ? undefined : "Additional Redis metrics required for precise tuning.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "ori-default",
      priority: 1,
      title: "Maintain monitoring posture",
      recommendedActions: "Continue scheduled global scans and review executive dashboard daily.",
      estimatedImpact: "Low — preserves current stability",
      estimatedRisk: "Low predicted risk with current live signals",
      expectedImprovement: "Sustained OMEGA GOLD readiness",
      dataNote: recommendations.length === 0 ? "Limited live signals — additional telemetry recommended." : undefined,
    });
  }

  return recommendations.slice(0, 3).map((rec, index) => ({ ...rec, priority: (index + 1) as 1 | 2 | 3 }));
}

export function buildExecutiveCommandSnapshot(
  ctx: ExecutiveLiveContext,
  omegaCerts: OmegaCertificationItem[] | null,
  omegaSecurity: import("@/lib/omega-enterprise-mobile-engine/types").OmegaSecurityOverview | null,
): ExecutiveCommandSnapshot {
  const platformHealth = buildPlatformHealth(ctx);
  const incidents = buildIncidents(ctx);
  const incidentSummary = buildIncidentSummary(incidents);
  const infrastructure = buildInfrastructure(ctx);
  const business = buildBusiness(ctx);
  const certifications = buildCertifications(omegaCerts);
  const security = buildSecurity(ctx, omegaSecurity);
  const performance = buildPerformance(ctx);
  const oriRecommendations = buildExecutiveOriRecommendations(ctx, incidents);

  const available: string[] = [];
  const unavailable: string[] = [];
  if (ctx.dashboard) available.push("Super Admin Dashboard"); else if (ctx.dashboardError) unavailable.push("Super Admin Dashboard");
  if (ctx.health) available.push("Platform Health Report"); else if (ctx.healthError) unavailable.push("Platform Health Report");
  if (ctx.operations) available.push("Production Operations"); else if (ctx.operationsError) unavailable.push("Production Operations");
  if (ctx.transactions24h !== null) available.push("24h Transactions"); else unavailable.push("24h Transactions");
  if (ctx.deviceTrustScore !== null) available.push("Device Trust"); else unavailable.push("Device Trust");
  unavailable.push("CPU", "RAM", "Bandwidth", "Blocked Attacks", "Failed Logins");

  const overall = platformHealth.overall.available ? platformHealth.overall.display : "No live data";

  return {
    scannedAt: new Date().toISOString(),
    summary: `Executive overview scanned at ${new Date().toLocaleString()}. Overall platform health: ${overall}.`,
    dataSourcesAvailable: available,
    dataSourcesUnavailable: unavailable,
    platformHealth,
    incidentSummary,
    incidents,
    infrastructure,
    business,
    certifications,
    security,
    performance,
    oriRecommendations,
    exports: [],
  };
}

export function validateExecutiveCommandReadiness(snapshot: ExecutiveCommandSnapshot): { ready: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (!snapshot.platformHealth.overall.available) blockers.push("Overall platform health unavailable");
  if (snapshot.incidentSummary.critical.available && Number(snapshot.incidentSummary.critical.value) > 0) {
    blockers.push("Open critical incidents require attention");
  }
  return { ready: blockers.length === 0, blockers };
}
