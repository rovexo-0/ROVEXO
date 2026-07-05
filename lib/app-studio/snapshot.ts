import { getMissionControlSnapshot } from "@/lib/super-admin/mission-control/snapshot";
import { getAppStudioDraft, getAppStudioHistory, readLiveAppStudioDocument } from "@/lib/app-studio/engine";
import { APP_STUDIO_MODULES } from "@/lib/app-studio/registry";
import type {
  AppStudioAnalyticsMetric,
  AppStudioIntegrations,
  AppStudioPlatformModule,
  AppStudioSnapshot,
  AppStudioSystemHealthMetric,
} from "@/lib/app-studio/types";
import type { MissionControlServiceStatus } from "@/lib/super-admin/mission-control/types";

function mapServiceStatus(status: MissionControlServiceStatus): AppStudioPlatformModule["health"] {
  if (status === "online") return "healthy";
  if (status === "warning") return "warning";
  return "critical";
}

function enrichModules(
  modules: typeof APP_STUDIO_MODULES,
  missionControl: Awaited<ReturnType<typeof getMissionControlSnapshot>>,
): AppStudioPlatformModule[] {
  return modules.map((mod) => {
    const service = missionControl.services.find(
      (item) => item.id === mod.id || item.label.toLowerCase() === mod.label.toLowerCase(),
    );
    if (!service) return mod;
    return {
      ...mod,
      health: mapServiceStatus(service.status),
      performanceScore: service.status === "online" ? mod.performanceScore : Math.max(60, mod.performanceScore - 20),
    };
  });
}

function buildIntegrations(missionControl: Awaited<ReturnType<typeof getMissionControlSnapshot>>): AppStudioIntegrations {
  return {
    features: missionControl.features.map((feature) => ({
      id: feature.id,
      label: feature.label,
      description: feature.description,
      enabled: feature.enabled,
      state: feature.state,
      version: feature.version,
    })),
    ai: {
      globalEnabled: missionControl.ai.globalEnabled,
      features: missionControl.ai.features.map((feature) => ({
        id: feature.id,
        label: feature.label,
        description: feature.description,
        enabled: feature.enabled,
        execution: feature.execution === "server" ? "cloud" : feature.execution,
      })),
    },
  };
}

function buildSystemHealth(missionControl: Awaited<ReturnType<typeof getMissionControlSnapshot>>): AppStudioSystemHealthMetric[] {
  return missionControl.services.map((service) => ({
    id: service.id,
    label: service.label,
    status: mapServiceStatus(service.status),
    detail: service.detail,
  }));
}

function buildAnalytics(missionControl: Awaited<ReturnType<typeof getMissionControlSnapshot>>): AppStudioAnalyticsMetric[] {
  return missionControl.counters.map((counter) => ({
    id: counter.id,
    label: counter.label,
    value: counter.value,
    delta: counter.delta,
    href: counter.href,
  }));
}

export async function getAppStudioSnapshot(): Promise<AppStudioSnapshot> {
  const [draft, live, history, missionControl] = await Promise.all([
    getAppStudioDraft(),
    readLiveAppStudioDocument(),
    getAppStudioHistory(),
    getMissionControlSnapshot(),
  ]);

  return {
    scannedAt: new Date().toISOString(),
    modules: enrichModules(APP_STUDIO_MODULES, missionControl),
    draft,
    live,
    history,
    integrations: buildIntegrations(missionControl),
    systemHealth: buildSystemHealth(missionControl),
    analytics: buildAnalytics(missionControl),
  };
}
