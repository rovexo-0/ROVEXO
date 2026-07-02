import type {
  IntegrationsEngineAnalytics,
  IntegrationsEngineDashboard,
  IntegrationsEngineHealthId,
  IntegrationsEngineProviderStatus,
} from "@/lib/integrations-engine/types";

export function countEnabledFlags(flags: Record<string, boolean>): number {
  return Object.values(flags).filter(Boolean).length;
}

export function countEnabledItems<T extends { enabled: boolean }>(items: T[]): number {
  return items.filter((item) => item.enabled).length;
}

function mapHealthStatus(status: string): IntegrationsEngineHealthId {
  if (status === "healthy") return "healthy";
  if (status === "degraded") return "degraded";
  if (status === "unhealthy") return "offline";
  return "disabled";
}

export function buildProviderStatuses(input: {
  stripeConfigured: boolean;
  stripeStatus: string;
  stripeLatency?: number;
  emailStatus: string;
  emailLatency?: number;
  redisStatus: string;
  pushConfigured: boolean;
  ga4Client: boolean;
  ga4Server: boolean;
  config: {
    paymentProviders: Record<string, boolean>;
    emailServices: Record<string, boolean>;
    pushNotifications: Record<string, boolean>;
    googleServices: Record<string, boolean>;
  };
}): IntegrationsEngineProviderStatus[] {
  return [
    {
      id: "stripe",
      label: "Stripe",
      category: "payments",
      configured: input.stripeConfigured,
      enabled: input.config.paymentProviders.stripe,
      status: input.stripeConfigured ? mapHealthStatus(input.stripeStatus) : "disabled",
      latencyMs: input.stripeLatency,
    },
    {
      id: "email",
      label: "Email (Resend/SMTP)",
      category: "email",
      configured: input.emailStatus !== "unhealthy",
      enabled: input.config.emailServices.smtp || input.config.emailServices.brevo,
      status: mapHealthStatus(input.emailStatus),
      latencyMs: input.emailLatency,
    },
    {
      id: "redis",
      label: "Redis (Rate Limiting)",
      category: "infrastructure",
      configured: input.redisStatus !== "unhealthy",
      enabled: true,
      status: mapHealthStatus(input.redisStatus),
    },
    {
      id: "web-push",
      label: "Web Push (VAPID)",
      category: "push",
      configured: input.pushConfigured,
      enabled: input.config.pushNotifications.webPush,
      status: input.pushConfigured ? "healthy" : "disabled",
    },
    {
      id: "ga4-client",
      label: "Google Analytics 4",
      category: "google",
      configured: input.ga4Client,
      enabled: input.config.googleServices.ga4,
      status: input.ga4Client ? "healthy" : "disabled",
    },
    {
      id: "ga4-server",
      label: "GA4 Realtime API",
      category: "google",
      configured: input.ga4Server,
      enabled: input.config.googleServices.ga4,
      status: input.ga4Server ? "healthy" : "disabled",
    },
  ];
}

export function deriveIntegrationHealth(providers: IntegrationsEngineProviderStatus[]): IntegrationsEngineHealthId {
  const active = providers.filter((p) => p.enabled);
  if (active.length === 0) return "disabled";
  if (active.some((p) => p.status === "offline")) return "offline";
  if (active.some((p) => p.status === "degraded")) return "degraded";
  return "healthy";
}

export function buildIntegrationsDashboard(input: {
  providers: IntegrationsEngineProviderStatus[];
  enabledProviderFlags: number;
  webhookFeatures: number;
  errors24h: number;
  performanceEnabled: number;
}): IntegrationsEngineDashboard {
  const configuredProviders = input.providers.filter((p) => p.configured).length;
  const healthyProviders = input.providers.filter((p) => p.status === "healthy").length;
  const enabledProviders = input.providers.filter((p) => p.enabled).length;
  const integrationHealth = deriveIntegrationHealth(input.providers);

  const latencies = input.providers
    .map((p) => p.latencyMs)
    .filter((value): value is number => typeof value === "number");
  const averageLatencyMs =
    latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  const successRate =
    input.errors24h === 0 && configuredProviders > 0
      ? 99
      : Math.max(0, 100 - Math.min(100, input.errors24h * 2));

  let integrationScore = 40;
  if (configuredProviders >= 3) integrationScore += 20;
  if (healthyProviders >= 2) integrationScore += 15;
  if (input.performanceEnabled >= 5) integrationScore += 10;
  if (successRate >= 95) integrationScore += 10;
  if (input.webhookFeatures >= 4) integrationScore += 5;
  integrationScore = Math.min(100, integrationScore);

  return {
    integrationHealth,
    integrationScore,
    enabledProviders,
    configuredProviders,
    healthyProviders,
    webhookEndpoints: input.webhookFeatures,
    apiHealth: successRate,
    successRate,
    averageLatencyMs,
    errors24h: input.errors24h,
  };
}

export function computeIntegrationsAnalytics(input: {
  paymentProviders: number;
  shippingProviders: number;
  communicationProviders: number;
  cloudProviders: number;
  enabledModules: number;
  webhookFeatures: number;
  secretsFeatures: number;
  auditEvents: number;
}): IntegrationsEngineAnalytics {
  return {
    paymentProviders: input.paymentProviders,
    shippingProviders: input.shippingProviders,
    communicationProviders: input.communicationProviders,
    cloudProviders: input.cloudProviders,
    enabledModules: input.enabledModules,
    webhookFeatures: input.webhookFeatures,
    secretsFeatures: input.secretsFeatures,
    auditEvents: input.auditEvents,
  };
}
