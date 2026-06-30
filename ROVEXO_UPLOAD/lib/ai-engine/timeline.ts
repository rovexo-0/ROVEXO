import type {
  AiEngineAnalytics,
  AiEngineDashboard,
  AiEngineHealthId,
} from "@/lib/ai-engine/types";

export function countEnabledFlags(flags: Record<string, boolean>): number {
  return Object.values(flags).filter(Boolean).length;
}

export function countEnabledItems<T extends { enabled: boolean }>(items: T[]): number {
  return items.filter((item) => item.enabled).length;
}

export function deriveAiHealth(input: {
  globalEnabled: boolean;
  errors24h: number;
  requests24h: number;
  visionConfigured: boolean;
}): AiEngineHealthId {
  if (!input.globalEnabled) return "disabled";
  if (input.errors24h >= 20) return "degraded";
  if (input.requests24h > 0 && input.errors24h / input.requests24h > 0.15) return "degraded";
  if (!input.visionConfigured && input.requests24h === 0) return "offline";
  return "healthy";
}

export function buildAiDashboard(input: {
  globalEnabled: boolean;
  enabledModules: number;
  enabledProviders: number;
  requests24h: number;
  errors24h: number;
  visionConfigured: boolean;
  performanceEnabled: number;
}): AiEngineDashboard {
  const aiHealth = deriveAiHealth({
    globalEnabled: input.globalEnabled,
    errors24h: input.errors24h,
    requests24h: input.requests24h,
    visionConfigured: input.visionConfigured,
  });

  let aiScore = 30;
  if (input.globalEnabled) aiScore += 20;
  if (input.enabledModules >= 4) aiScore += 15;
  if (input.enabledProviders >= 2) aiScore += 10;
  if (input.performanceEnabled >= 5) aiScore += 10;
  if (input.errors24h === 0 && input.requests24h > 0) aiScore += 10;
  if (input.visionConfigured) aiScore += 5;
  aiScore = Math.min(100, aiScore);

  return {
    aiHealth,
    aiScore,
    globalEnabled: input.globalEnabled,
    enabledModules: input.enabledModules,
    enabledProviders: input.enabledProviders,
    requests24h: input.requests24h,
    errors24h: input.errors24h,
    averageLatencyMs: input.globalEnabled ? 120 : 0,
    localModelStatus: input.globalEnabled ? "ready" : "disabled",
    cloudStatus: input.visionConfigured
      ? input.globalEnabled
        ? "configured"
        : "disabled"
      : "unconfigured",
  };
}

export function computeAiAnalytics(input: {
  marketplaceAi: number;
  imageAi: number;
  languageAi: number;
  automation: number;
  providerCount: number;
  permissionRoles: number;
  auditEvents: number;
  requests24h: number;
}): AiEngineAnalytics {
  return {
    enabledMarketplaceAi: input.marketplaceAi,
    enabledImageAi: input.imageAi,
    enabledLanguageAi: input.languageAi,
    enabledAutomation: input.automation,
    providerCount: input.providerCount,
    permissionRoles: input.permissionRoles,
    auditEvents: input.auditEvents,
    tokenEstimate24h: Math.round(input.requests24h * 850),
  };
}
