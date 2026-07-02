import { describe, expect, it } from "vitest";
import { createDefaultIntegrationsEngineDocument } from "@/lib/integrations-engine/defaults";
import {
  INTEGRATIONS_ENGINE_MODULE_IDS,
  INTEGRATIONS_ENGINE_MODULES,
  registerIntegrationsEngineModule,
} from "@/lib/integrations-engine/registry";
import {
  buildIntegrationsDashboard,
  buildProviderStatuses,
  computeIntegrationsAnalytics,
  countEnabledFlags,
  countEnabledItems,
  deriveIntegrationHealth,
} from "@/lib/integrations-engine/timeline";

describe("integrations engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultIntegrationsEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.paymentProviders.stripe).toBe(true);
    expect(doc.shippingProviders.royalMail).toBe(true);
    expect(doc.integrations.aiEngine).toBe(true);
    expect(doc.webhooks.incomingWebhooks).toBe(true);
  });

  it("registers all core integration modules", () => {
    const ids = INTEGRATIONS_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("integration-center");
    expect(ids).toContain("webhook-manager");
    expect(ids).toContain("provider-manager");
  });

  it("defines module ids", () => {
    expect(INTEGRATIONS_ENGINE_MODULE_IDS.map((m) => m.id)).toContain("secrets-manager");
    expect(INTEGRATIONS_ENGINE_MODULE_IDS.map((m) => m.id)).toContain("testing-center");
  });

  it("builds provider statuses from health signals", () => {
    const doc = createDefaultIntegrationsEngineDocument();
    const providers = buildProviderStatuses({
      stripeConfigured: true,
      stripeStatus: "healthy",
      stripeLatency: 45,
      emailStatus: "healthy",
      emailLatency: 12,
      redisStatus: "healthy",
      pushConfigured: false,
      ga4Client: true,
      ga4Server: false,
      config: {
        paymentProviders: doc.paymentProviders,
        emailServices: doc.emailServices,
        pushNotifications: doc.pushNotifications,
        googleServices: doc.googleServices,
      },
    });
    expect(providers.find((p) => p.id === "stripe")?.status).toBe("healthy");
    expect(providers.find((p) => p.id === "web-push")?.status).toBe("disabled");
  });

  it("derives integration health from providers", () => {
    const providers = buildProviderStatuses({
      stripeConfigured: true,
      stripeStatus: "healthy",
      emailStatus: "healthy",
      redisStatus: "healthy",
      pushConfigured: true,
      ga4Client: true,
      ga4Server: true,
      config: {
        paymentProviders: { stripe: true },
        emailServices: { smtp: true },
        pushNotifications: { webPush: true },
        googleServices: { ga4: true },
      },
    });
    expect(deriveIntegrationHealth(providers)).toBe("healthy");
  });

  it("builds integrations dashboard", () => {
    const doc = createDefaultIntegrationsEngineDocument();
    const providers = buildProviderStatuses({
      stripeConfigured: true,
      stripeStatus: "healthy",
      emailStatus: "healthy",
      redisStatus: "healthy",
      pushConfigured: true,
      ga4Client: true,
      ga4Server: false,
      config: {
        paymentProviders: doc.paymentProviders,
        emailServices: doc.emailServices,
        pushNotifications: doc.pushNotifications,
        googleServices: doc.googleServices,
      },
    });
    const dashboard = buildIntegrationsDashboard({
      providers,
      enabledProviderFlags: countEnabledFlags(doc.paymentProviders),
      webhookFeatures: countEnabledFlags(doc.webhooks),
      errors24h: 0,
      performanceEnabled: countEnabledFlags(doc.performance),
    });
    expect(dashboard.integrationScore).toBeGreaterThanOrEqual(70);
    expect(dashboard.configuredProviders).toBeGreaterThan(0);
  });

  it("computes integration analytics", () => {
    const doc = createDefaultIntegrationsEngineDocument();
    const analytics = computeIntegrationsAnalytics({
      paymentProviders: countEnabledFlags(doc.paymentProviders),
      shippingProviders: countEnabledFlags(doc.shippingProviders),
      communicationProviders:
        countEnabledFlags(doc.emailServices) + countEnabledFlags(doc.pushNotifications),
      cloudProviders: countEnabledFlags(doc.googleServices),
      enabledModules: countEnabledItems(doc.modules),
      webhookFeatures: countEnabledFlags(doc.webhooks),
      secretsFeatures: countEnabledFlags(doc.secretsManagement),
      auditEvents: 2,
    });
    expect(analytics.paymentProviders).toBeGreaterThan(0);
    expect(analytics.webhookFeatures).toBeGreaterThan(0);
  });

  it("allows future module registration", () => {
    const next = registerIntegrationsEngineModule({
      id: "custom-integration",
      label: "Custom Integration",
      icon: "🔌",
      description: "Future module",
      href: "/integrations",
    });
    expect(next.some((m) => m.id === "custom-integration")).toBe(true);
  });
});
