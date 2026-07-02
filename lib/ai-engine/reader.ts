import { createAdminClient } from "@/lib/supabase/admin";
import { isVisionConfigured } from "@/lib/ai-camera/config";
import { getUserRole } from "@/lib/auth/session";
import { getPlatformSetting } from "@/lib/super-admin/settings";
import {
  AI_MANAGER_SETTING_KEY,
  createDefaultAiToggles,
} from "@/lib/super-admin/mission-control/defaults";
import {
  readLiveAiEngineDocument,
  getAiEngineSnapshotForAdmin,
} from "@/lib/ai-engine/engine";
import { AI_ENGINE_MODULES } from "@/lib/ai-engine/registry";
import {
  buildAiDashboard,
  computeAiAnalytics,
  countEnabledFlags,
  countEnabledItems,
} from "@/lib/ai-engine/timeline";
import type {
  AiEngineAnalytics,
  AiEngineContext,
  AiEngineSnapshot,
} from "@/lib/ai-engine/types";

export async function getPublicAiEngineConfig() {
  return readLiveAiEngineDocument();
}

export async function getAiEngineSnapshot(): Promise<AiEngineSnapshot> {
  const { draft, live, history } = await getAiEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: AI_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

async function readAiActivity24h() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count: requests } = await admin
    .from("platform_audit_logs")
    .select("*", { count: "exact", head: true })
    .or("action.eq.ai.request,action.eq.assistant.query,action.eq.ai_engine.change")
    .gte("created_at", since);

  const { count: errors } = await admin
    .from("platform_error_logs")
    .select("*", { count: "exact", head: true })
    .eq("category", "ai")
    .gte("created_at", since);

  return {
    requests24h: requests ?? 0,
    errors24h: errors ?? 0,
  };
}

export async function getAiEngineContext(userId: string): Promise<AiEngineContext> {
  const [config, role, missionControlAi, activity] = await Promise.all([
    readLiveAiEngineDocument(),
    getUserRole(userId),
    getPlatformSetting(AI_MANAGER_SETTING_KEY, createDefaultAiToggles()),
    readAiActivity24h(),
  ]);

  const visionConfigured = isVisionConfigured();
  const globalEnabled = config.globalEnabled && missionControlAi.globalEnabled;

  const dashboard = buildAiDashboard({
    globalEnabled,
    enabledModules: countEnabledItems(config.modules),
    enabledProviders: countEnabledItems(config.providers),
    requests24h: activity.requests24h,
    errors24h: activity.errors24h,
    visionConfigured,
    performanceEnabled: countEnabledFlags(config.performance),
  });

  return {
    dashboard,
    role: role ?? "buyer",
    missionControlEnabled: missionControlAi.globalEnabled,
    visionConfigured,
  };
}

export async function getAiEngineAnalyticsForUser(userId: string): Promise<AiEngineAnalytics> {
  const [config, activity] = await Promise.all([
    readLiveAiEngineDocument(),
    readAiActivity24h(),
  ]);

  const admin = createAdminClient();
  const { count: auditCount } = await admin
    .from("platform_audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("actor_id", userId)
    .or("action.eq.ai.request,action.eq.assistant.query,action.eq.ai_engine.change");

  void userId;

  return computeAiAnalytics({
    marketplaceAi: countEnabledFlags(config.marketplaceAi),
    imageAi: countEnabledFlags(config.imageAi),
    languageAi: countEnabledFlags(config.languageAi),
    automation: countEnabledFlags(config.automation),
    providerCount: countEnabledItems(config.providers),
    permissionRoles: countEnabledItems(config.permissions),
    auditEvents: auditCount ?? 0,
    requests24h: activity.requests24h,
  });
}
