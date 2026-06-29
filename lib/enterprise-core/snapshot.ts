import { ENTERPRISE_CORE_REGISTRY, ENTERPRISE_CORE_SETTING_GROUPS } from "@/lib/enterprise-core/registry";
import type {
  EnterpriseCoreAnalyticsMetric,
  EnterpriseCoreDashboardMetric,
  EnterpriseCoreDeveloperTool,
  EnterpriseCoreHealth,
  EnterpriseCoreHealthScore,
  EnterpriseCoreOperationsMetric,
  EnterpriseCoreSearchResult,
  EnterpriseCoreSettingGroup,
  EnterpriseCoreSnapshot,
} from "@/lib/enterprise-core/types";
import { runEnterpriseCoreAdminSearch } from "@/lib/enterprise-core/search";
import {
  getEnterpriseCoreDraft,
  getEnterpriseCoreHistory,
  readLiveEnterpriseCoreDocument,
} from "@/lib/enterprise-core/engine";
import { getMissionControlSnapshot } from "@/lib/super-admin/mission-control/snapshot";
import type { MissionControlServiceStatus } from "@/lib/super-admin/mission-control/types";

export { runEnterpriseCoreAdminSearch };

function mapServiceStatus(status: MissionControlServiceStatus): EnterpriseCoreHealth {
  if (status === "online") return "healthy";
  if (status === "warning") return "warning";
  return "critical";
}

function buildDashboard(missionControl: Awaited<ReturnType<typeof getMissionControlSnapshot>>): EnterpriseCoreDashboardMetric[] {
  const { counters, services, platformHealth } = missionControl;
  const revenue = counters.find((c) => c.id === "payments");
  const visitors = counters.find((c) => c.id === "homepage");

  return [
    { id: "platform-health", label: "Platform Health", value: platformHealth, href: "/super-admin/monitoring" },
    { id: "revenue", label: "Revenue / Payments", value: revenue?.value ?? 0, delta: revenue?.delta, href: "/super-admin/revenue" },
    { id: "visitors", label: "Visitors", value: visitors?.value ?? 0, delta: visitors?.delta, href: "/super-admin/visitors" },
    ...counters.map((counter) => ({
      id: counter.id,
      label: counter.label,
      value: counter.value,
      delta: counter.delta,
      href: counter.href,
    })),
    ...services.slice(0, 4).map((service) => ({
      id: `svc-${service.id}`,
      label: service.label,
      value: service.status,
      href: "/super-admin/monitoring",
    })),
  ];
}

function buildSettingsGroups(): EnterpriseCoreSettingGroup[] {
  return ENTERPRISE_CORE_SETTING_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    href: group.href,
    module: group.module,
    settingKeys: [...group.keys],
  }));
}

function buildHealthScores(missionControl: Awaited<ReturnType<typeof getMissionControlSnapshot>>): EnterpriseCoreHealthScore[] {
  const domains = [
    { id: "marketplace", label: "Marketplace" },
    { id: "homepage", label: "Homepage" },
    { id: "search", label: "Search" },
    { id: "orders", label: "Orders" },
    { id: "shipping", label: "Shipping" },
    { id: "payments", label: "Payments" },
    { id: "wallet", label: "Wallet" },
    { id: "database", label: "Database" },
    { id: "api", label: "API" },
    { id: "security", label: "Security" },
    { id: "ai", label: "AI" },
    { id: "storage", label: "Storage" },
  ];

  return domains.map((domain) => {
    const service = missionControl.services.find((item) => item.id === domain.id);
    const status = service ? mapServiceStatus(service.status) : "healthy";
    const score = status === "healthy" ? 98 : status === "warning" ? 78 : 58;
    return { id: domain.id, label: domain.label, score, status };
  });
}

function buildAnalytics(missionControl: Awaited<ReturnType<typeof getMissionControlSnapshot>>): EnterpriseCoreAnalyticsMetric[] {
  return missionControl.counters.map((counter) => ({
    id: counter.id,
    label: counter.label,
    value: counter.value,
    delta: counter.delta,
    growth: counter.delta && counter.value ? Math.round((counter.delta / Math.max(counter.value, 1)) * 100) : undefined,
  }));
}

function buildOperations(missionControl: Awaited<ReturnType<typeof getMissionControlSnapshot>>): EnterpriseCoreOperationsMetric[] {
  return missionControl.services.map((service) => ({
    id: service.id,
    label: service.label,
    status: mapServiceStatus(service.status),
    detail: service.detail,
  }));
}

function buildDeveloperTools(): EnterpriseCoreDeveloperTool[] {
  return [
    { id: "production-validator", label: "Production Validator", href: "/super-admin/production-assets", status: "healthy", description: "Premium asset QA gate" },
    { id: "premium-assets", label: "Premium Asset Manager", href: "/super-admin/premium-design", status: "healthy", description: "Design system assets" },
    { id: "developer-tools", label: "Developer Tools", href: "/super-admin/developer", status: "healthy", description: "Cache, build, health" },
    { id: "operations", label: "Operations Center", href: "/super-admin/operations", status: "healthy", description: "Enterprise NOC and live monitoring" },
    { id: "recovery", label: "Recovery Center", href: "/super-admin/recovery", status: "healthy", description: "Disaster recovery and business continuity" },
    { id: "monitoring", label: "System Health", href: "/super-admin/monitoring", status: "healthy", description: "Infra and cron jobs" },
  ];
}

function enrichRegistry(
  missionControl: Awaited<ReturnType<typeof getMissionControlSnapshot>>,
): EnterpriseCoreSnapshot["registry"] {
  return ENTERPRISE_CORE_REGISTRY.map((module) => {
    const service = missionControl.services.find(
      (item) => item.id.includes(module.id.split("-")[0]) || item.label.toLowerCase().includes(module.label.toLowerCase().split(" ")[0]),
    );
    if (!service) return module;
    return { ...module, health: mapServiceStatus(service.status) };
  });
}

function computeOverallScore(scores: EnterpriseCoreHealthScore[]): number {
  if (scores.length === 0) return 100;
  return Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
}

export async function getEnterpriseCoreSnapshot(): Promise<EnterpriseCoreSnapshot> {
  const [draft, live, history, missionControl] = await Promise.all([
    getEnterpriseCoreDraft(),
    readLiveEnterpriseCoreDocument(),
    getEnterpriseCoreHistory(),
    getMissionControlSnapshot(),
  ]);

  const healthScores = buildHealthScores(missionControl);

  return {
    scannedAt: new Date().toISOString(),
    registry: enrichRegistry(missionControl),
    draft,
    live,
    history,
    dashboard: buildDashboard(missionControl),
    settingsGroups: buildSettingsGroups(),
    healthScores,
    analytics: buildAnalytics(missionControl),
    operations: buildOperations(missionControl),
    developerTools: buildDeveloperTools(),
    platformHealth: mapServiceStatus(missionControl.platformHealth),
    overallScore: computeOverallScore(healthScores),
  };
}

export type EnterpriseCoreSearchResponse = {
  results: EnterpriseCoreSearchResult[];
  categories: string[];
};

export async function searchEnterpriseCore(query: string): Promise<EnterpriseCoreSearchResponse> {
  const results = await runEnterpriseCoreAdminSearch(query);
  const categories = [...new Set(results.map((item) => item.category))];
  return { results, categories };
}
