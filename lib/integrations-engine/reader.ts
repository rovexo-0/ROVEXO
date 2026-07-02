import { createAdminClient } from "@/lib/supabase/admin";
import { isGoogleAnalyticsEnabled } from "@/lib/analytics/ga4-config";
import { isGa4RealtimeEnabled } from "@/lib/analytics/live-countries/ga4-realtime";
import { getUserRole } from "@/lib/auth/session";
import {
  readLiveIntegrationsEngineDocument,
  getIntegrationsEngineSnapshotForAdmin,
} from "@/lib/integrations-engine/engine";
import { INTEGRATIONS_ENGINE_MODULES } from "@/lib/integrations-engine/registry";
import {
  buildIntegrationsDashboard,
  buildProviderStatuses,
  computeIntegrationsAnalytics,
  countEnabledFlags,
  countEnabledItems,
} from "@/lib/integrations-engine/timeline";
import { getPlatformHealthReport } from "@/lib/ops/health";
import { isPushConfigured } from "@/lib/push/vapid";
import { isStripeConfigured } from "@/lib/stripe/server";
import type {
  IntegrationsEngineAnalytics,
  IntegrationsEngineContext,
  IntegrationsEngineSnapshot,
} from "@/lib/integrations-engine/types";

export async function getPublicIntegrationsEngineConfig() {
  return readLiveIntegrationsEngineDocument();
}

export async function getIntegrationsEngineSnapshot(): Promise<IntegrationsEngineSnapshot> {
  const { draft, live, history } = await getIntegrationsEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: INTEGRATIONS_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

async function readIntegrationErrors24h() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count } = await admin
    .from("platform_error_logs")
    .select("*", { count: "exact", head: true })
    .in("category", ["integration", "webhook", "stripe", "email"])
    .gte("created_at", since);
  return count ?? 0;
}

export async function getIntegrationsEngineContext(userId: string): Promise<IntegrationsEngineContext> {
  const [config, role, health, errors24h] = await Promise.all([
    readLiveIntegrationsEngineDocument(),
    getUserRole(userId),
    getPlatformHealthReport().catch(() => null),
    readIntegrationErrors24h(),
  ]);

  const providers = buildProviderStatuses({
    stripeConfigured: isStripeConfigured(),
    stripeStatus: health?.checks.stripe.status ?? "degraded",
    stripeLatency: health?.checks.stripe.latencyMs,
    emailStatus: health?.checks.email.status ?? "degraded",
    emailLatency: health?.checks.email.latencyMs,
    redisStatus: health?.checks.redis.status ?? "degraded",
    pushConfigured: isPushConfigured(),
    ga4Client: isGoogleAnalyticsEnabled(),
    ga4Server: isGa4RealtimeEnabled(),
    config: {
      paymentProviders: config.paymentProviders,
      emailServices: config.emailServices,
      pushNotifications: config.pushNotifications,
      googleServices: config.googleServices,
    },
  });

  const dashboard = buildIntegrationsDashboard({
    providers,
    enabledProviderFlags:
      countEnabledFlags(config.paymentProviders) +
      countEnabledFlags(config.shippingProviders) +
      countEnabledFlags(config.emailServices),
    webhookFeatures: countEnabledFlags(config.webhooks),
    errors24h,
    performanceEnabled: countEnabledFlags(config.performance),
  });

  return {
    dashboard,
    providers,
    role: role ?? "buyer",
  };
}

export async function getIntegrationsEngineAnalyticsForUser(
  userId: string,
): Promise<IntegrationsEngineAnalytics> {
  const config = await readLiveIntegrationsEngineDocument();
  const admin = createAdminClient();
  const { count: auditCount } = await admin
    .from("platform_audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("actor_id", userId)
    .or("action.eq.integrations_engine.change,action.eq.webhook.received,action.eq.stripe.webhook");

  void userId;

  return computeIntegrationsAnalytics({
    paymentProviders: countEnabledFlags(config.paymentProviders),
    shippingProviders: countEnabledFlags(config.shippingProviders),
    communicationProviders:
      countEnabledFlags(config.emailServices) +
      countEnabledFlags(config.smsServices) +
      countEnabledFlags(config.pushNotifications),
    cloudProviders:
      countEnabledFlags(config.googleServices) +
      countEnabledFlags(config.appleServices) +
      countEnabledFlags(config.microsoftServices),
    enabledModules: countEnabledItems(config.modules),
    webhookFeatures: countEnabledFlags(config.webhooks),
    secretsFeatures: countEnabledFlags(config.secretsManagement),
    auditEvents: auditCount ?? 0,
  });
}
