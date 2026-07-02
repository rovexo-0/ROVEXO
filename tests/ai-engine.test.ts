import { describe, expect, it } from "vitest";
import { createDefaultAiEngineDocument } from "@/lib/ai-engine/defaults";
import {
  AI_ENGINE_MODULE_IDS,
  AI_ENGINE_MODULES,
  AI_ENGINE_PROVIDERS,
  AI_ENGINE_ROLES,
  registerAiEngineModule,
} from "@/lib/ai-engine/registry";
import {
  buildAiDashboard,
  computeAiAnalytics,
  countEnabledFlags,
  countEnabledItems,
  deriveAiHealth,
} from "@/lib/ai-engine/timeline";

describe("ai engine", () => {
  it("creates default document with UK v1 configuration and AI disabled by default", () => {
    const doc = createDefaultAiEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.globalEnabled).toBe(false);
    expect(doc.executionPolicy.defaultDisabled).toBe(true);
    expect(doc.executionPolicy.priorityLocal).toBe(true);
    expect(doc.integrations.searchEngine).toBe(true);
    expect(doc.marketplaceAi.categoryDetection).toBe(true);
  });

  it("registers all core AI modules", () => {
    const ids = AI_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("control-center");
    expect(ids).toContain("marketplace-assistant");
    expect(ids).toContain("provider-manager");
  });

  it("defines module ids, providers, and roles", () => {
    expect(AI_ENGINE_MODULE_IDS.map((m) => m.id)).toContain("monitoring-center");
    expect(AI_ENGINE_PROVIDERS.map((p) => p.id)).toContain("ollama");
    expect(AI_ENGINE_ROLES.map((r) => r.id)).toContain("super-administrator");
  });

  it("derives AI health from global state and activity", () => {
    expect(deriveAiHealth({ globalEnabled: false, errors24h: 0, requests24h: 0, visionConfigured: false })).toBe("disabled");
    expect(deriveAiHealth({ globalEnabled: true, errors24h: 0, requests24h: 10, visionConfigured: true })).toBe("healthy");
    expect(deriveAiHealth({ globalEnabled: true, errors24h: 25, requests24h: 100, visionConfigured: true })).toBe("degraded");
  });

  it("builds AI dashboard", () => {
    const dashboard = buildAiDashboard({
      globalEnabled: false,
      enabledModules: 8,
      enabledProviders: 2,
      requests24h: 0,
      errors24h: 0,
      visionConfigured: false,
      performanceEnabled: 6,
    });
    expect(dashboard.aiHealth).toBe("disabled");
    expect(dashboard.localModelStatus).toBe("disabled");
  });

  it("computes AI analytics", () => {
    const doc = createDefaultAiEngineDocument();
    const analytics = computeAiAnalytics({
      marketplaceAi: countEnabledFlags(doc.marketplaceAi),
      imageAi: countEnabledFlags(doc.imageAi),
      languageAi: countEnabledFlags(doc.languageAi),
      automation: countEnabledFlags(doc.automation),
      providerCount: countEnabledItems(doc.providers),
      permissionRoles: countEnabledItems(doc.permissions),
      auditEvents: 3,
      requests24h: 10,
    });
    expect(analytics.enabledMarketplaceAi).toBeGreaterThan(0);
    expect(analytics.providerCount).toBeGreaterThan(0);
    expect(analytics.tokenEstimate24h).toBe(8500);
  });

  it("allows future module registration", () => {
    const next = registerAiEngineModule({
      id: "custom-ai",
      label: "Custom AI",
      icon: "🤖",
      description: "Future module",
      href: "/ai",
    });
    expect(next.some((m) => m.id === "custom-ai")).toBe(true);
  });
});
