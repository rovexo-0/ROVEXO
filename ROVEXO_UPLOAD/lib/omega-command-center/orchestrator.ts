import type {
  EnterpriseHealthCard,
  EnterpriseScanPhase,
  LiveMonitorReading,
  OmegaEngineId,
  OmegaEngineState,
  OmegaRecommendation,
  OmegaScanProgress,
  OmegaTimelineEntry,
  OmegaExecutiveReport,
} from "@/lib/omega-command-center/types";
import {
  ENTERPRISE_HEALTH_DOMAINS,
  ENTERPRISE_SCAN_PHASES,
  LIVE_MONITOR_WIDGETS,
  OMEGA_AI_ENGINES,
  OMEGA_ENGINE_ROUTES,
} from "@/lib/omega-command-center/registry";

const HEALTH_LABELS: Record<string, string> = {
  platform: "Platform Health",
  marketplace: "Marketplace Health",
  security: "Security Health",
  infrastructure: "Infrastructure Health",
  performance: "Performance Health",
  financial: "Financial Health",
  seo: "SEO Health",
  mobile: "Mobile Health",
  ai: "AI Health",
  compliance: "Compliance Health",
  deployment: "Deployment Health",
  incident: "Incident Health",
  recovery: "Recovery Health",
};

export function createEnterpriseHealthCards(): EnterpriseHealthCard[] {
  return ENTERPRISE_HEALTH_DOMAINS.map((domain, i) => {
    const score = 72 + ((i * 7) % 28);
    return {
      domain,
      label: HEALTH_LABELS[domain] ?? domain,
      score,
      status: score >= 85 ? "healthy" : score >= 65 ? "warning" : "critical",
    };
  });
}

export function computeEnterpriseScore(cards: EnterpriseHealthCard[]): number {
  if (!cards.length) return 0;
  return Math.round(cards.reduce((s, c) => s + c.score, 0) / cards.length);
}

export function createDefaultEngineStates(): OmegaEngineState[] {
  return OMEGA_ENGINE_ROUTES.map((e, i) => ({
    id: e.id as OmegaEngineId,
    label: e.label,
    status: i === 0 ? "running" : i === 1 ? "running" : "waiting",
    health: i < 2 ? "healthy" : "healthy",
    lastRunAt: new Date(Date.now() - i * 600000).toISOString(),
    progress: i < 2 ? 45 + i * 10 : undefined,
  }));
}

export function createLiveMonitorReadings(): LiveMonitorReading[] {
  const labels: Record<string, string> = {
    cpu: "CPU", ram: "RAM", api: "API", redis: "Redis", supabase: "Supabase", stripe: "Stripe",
    storage: "Storage", search: "Search", email: "Email", cron: "Cron", notifications: "Notifications",
    queue: "Queue", workers: "Workers",
  };
  return LIVE_MONITOR_WIDGETS.map((widget, i) => {
    const value = 20 + (i * 11) % 75;
    return {
      widget,
      label: labels[widget] ?? widget,
      value,
      unit: widget === "cpu" || widget === "ram" ? "%" : widget === "queue" || widget === "workers" ? "jobs" : "ms",
      status: value < 70 ? "healthy" : value < 85 ? "warning" : "critical",
    };
  });
}

export function createDefaultTimeline(): OmegaTimelineEntry[] {
  const base = Date.now() - 5 * 60000;
  return [
    { id: "tl-1", timestamp: new Date(base).toISOString(), engine: "scan", message: "SCAN completed", severity: "success" },
    { id: "tl-2", timestamp: new Date(base + 60000).toISOString(), engine: "sentinel", message: "Security scan started", severity: "info" },
    { id: "tl-3", timestamp: new Date(base + 120000).toISOString(), engine: "sentinel", message: "Threat detected", severity: "warning" },
    { id: "tl-4", timestamp: new Date(base + 180000).toISOString(), engine: "omega", message: "Repair suggested", severity: "info" },
    { id: "tl-5", timestamp: new Date(base + 240000).toISOString(), engine: "phoenix", message: "PHOENIX validated", severity: "success" },
    { id: "tl-6", timestamp: new Date(base + 300000).toISOString(), engine: "omega", message: "Executive Report ready", severity: "success" },
  ];
}

export function createDefaultRecommendations(): OmegaRecommendation[] {
  return [
    {
      id: "rec-1",
      priority: "critical",
      title: "Resolve elevated fraud score on payment gateway",
      description: "SENTINEL detected anomalous transaction patterns — review before peak traffic",
      risk: 92,
      cost: 1200,
      impact: 95,
      repairTimeMinutes: 45,
      actions: ["analyze", "preview", "auto-repair", "create-incident"],
    },
    {
      id: "rec-2",
      priority: "high",
      title: "Optimise database connection pool",
      description: "ATLAS mapped latency spike on orders API — TITAN suggests workflow throttle",
      risk: 78,
      cost: 400,
      impact: 72,
      repairTimeMinutes: 20,
      actions: ["analyze", "preview", "manual-repair", "deploy-fix"],
    },
    {
      id: "rec-3",
      priority: "medium",
      title: "Schedule compliance evidence refresh",
      description: "GUARDIAN flagged GDPR retention policy drift on audit logs",
      risk: 55,
      cost: 200,
      impact: 60,
      repairTimeMinutes: 90,
      actions: ["analyze", "ignore", "manual-repair"],
    },
    {
      id: "rec-4",
      priority: "low",
      title: "Run off-peak SEO crawl",
      description: "ORACLE predicts 12% traffic uplift — SCAN recommends mobile index refresh",
      risk: 25,
      cost: 50,
      impact: 35,
      repairTimeMinutes: 15,
      actions: ["analyze", "preview", "auto-repair"],
    },
  ];
}

export function createExecutiveReport(score: number): OmegaExecutiveReport {
  return {
    id: `exec-${Date.now()}`,
    enterpriseScore: score,
    generatedAt: new Date().toISOString(),
    executiveSummary: `Enterprise score ${score}/100 — platform operational with ${score >= 80 ? "strong" : "moderate"} health across monitored domains.`,
    riskSummary: "2 critical recommendations, 1 high priority repair in queue.",
    repairQueueCount: 3,
  };
}

export function createOmegaSettings() {
  return {
    mfaRequiredForRepair: true,
    mfaRequiredForDeploy: true,
    autoOrchestrationEnabled: true,
    enterpriseSearchEnabled: true,
    liveMonitorIntervalSeconds: 30,
  };
}

export function startEnterpriseScan(type: OmegaScanProgress["type"] = "enterprise"): OmegaScanProgress {
  return {
    scanId: `scan-${Date.now()}`,
    type,
    status: "running",
    currentPhase: ENTERPRISE_SCAN_PHASES[0],
    currentEngine: OMEGA_AI_ENGINES[0],
    phasesCompleted: [],
    enginesCompleted: [],
    startedAt: new Date().toISOString(),
  };
}

export function advanceEnterpriseScan(progress: OmegaScanProgress): OmegaScanProgress {
  const phaseIdx = progress.currentPhase ? ENTERPRISE_SCAN_PHASES.indexOf(progress.currentPhase) : -1;
  const engineIdx = progress.currentEngine ? OMEGA_AI_ENGINES.indexOf(progress.currentEngine) : -1;

  const phasesCompleted = progress.currentPhase
    ? [...progress.phasesCompleted, progress.currentPhase]
    : progress.phasesCompleted;
  const enginesCompleted = progress.currentEngine
    ? [...progress.enginesCompleted, progress.currentEngine]
    : progress.enginesCompleted;

  const nextPhase = ENTERPRISE_SCAN_PHASES[phaseIdx + 1];
  const nextEngine = OMEGA_AI_ENGINES[engineIdx + 1];

  if (!nextPhase || !nextEngine) {
    return {
      ...progress,
      phasesCompleted: [...new Set([...phasesCompleted, ...ENTERPRISE_SCAN_PHASES])] as EnterpriseScanPhase[],
      enginesCompleted: [...OMEGA_AI_ENGINES],
      status: "completed",
      currentPhase: undefined,
      currentEngine: undefined,
      completedAt: new Date().toISOString(),
    };
  }

  return {
    ...progress,
    phasesCompleted,
    enginesCompleted,
    currentPhase: nextPhase,
    currentEngine: nextEngine,
  };
}

export function runFullEnterpriseScanPipeline(): {
  progress: OmegaScanProgress;
  timeline: OmegaTimelineEntry[];
  engines: OmegaEngineState[];
} {
  let progress = startEnterpriseScan("enterprise");
  const timeline: OmegaTimelineEntry[] = [];
  const engines = createDefaultEngineStates();

  OMEGA_AI_ENGINES.forEach((engine, i) => {
    timeline.push({
      id: `pipe-${engine}-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
      engine,
      message: `${engine.toUpperCase()} orchestrated by OMEGA`,
      severity: "info",
    });
    if (i < OMEGA_AI_ENGINES.length - 1) progress = advanceEnterpriseScan(progress);
  });

  progress = {
    ...progress,
    status: "completed",
    phasesCompleted: [...ENTERPRISE_SCAN_PHASES],
    enginesCompleted: [...OMEGA_AI_ENGINES],
    completedAt: new Date().toISOString(),
  };

  const completedEngines = engines.map((e) => ({
    ...e,
    status: "completed" as const,
    progress: 100,
    lastRunAt: new Date().toISOString(),
  }));

  timeline.push({
    id: `pipe-complete-${Date.now()}`,
    timestamp: new Date().toISOString(),
    engine: "omega",
    message: "Full enterprise scan completed — Executive Report ready",
    severity: "success",
  });

  return { progress, timeline, engines: completedEngines };
}
