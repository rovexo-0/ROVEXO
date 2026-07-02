import { describe, expect, it } from "vitest";
import { createDefaultSecurityEngineDocument } from "@/lib/security-engine/defaults";
import {
  SECURITY_ENGINE_AUTH_METHODS,
  SECURITY_ENGINE_MODULE_IDS,
  SECURITY_ENGINE_MODULES,
  SECURITY_ENGINE_ROLES,
  registerSecurityEngineModule,
} from "@/lib/security-engine/registry";
import {
  buildSecurityDashboard,
  computeSecurityAnalytics,
  countEnabledFraudSignals,
  countEnabledProtections,
  deriveThreatLevel,
  mapDevices,
  mapSession,
} from "@/lib/security-engine/timeline";
import { auditPermissions } from "@/lib/security/permissions-audit";

describe("security engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultSecurityEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.modules.some((m) => m.id === "authentication" && m.enabled)).toBe(true);
    expect(doc.integrations.ordersEngine).toBe(true);
    expect(doc.platformSecurity.csrfProtection).toBe(true);
    expect(doc.compliance.ukGdprEnabled).toBe(true);
  });

  it("registers all core security modules", () => {
    const ids = SECURITY_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("authentication");
    expect(ids).toContain("threat");
    expect(ids).toContain("compliance");
  });

  it("defines module ids, auth methods, and roles", () => {
    expect(SECURITY_ENGINE_MODULE_IDS.map((m) => m.id)).toContain("security-center");
    expect(SECURITY_ENGINE_AUTH_METHODS.map((m) => m.id)).toContain("2fa");
    expect(SECURITY_ENGINE_ROLES.map((r) => r.id)).toContain("super-administrator");
  });

  it("maps devices and sessions", () => {
    const devices = mapDevices([
      { id: "d1", platform: "ios", updated_at: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(devices[0]?.label).toBe("ios");
    expect(devices[0]?.trusted).toBe(true);

    const session = mapSession({
      accessTokenPrefix: "abc123",
      createdAt: "2026-01-01T00:00:00.000Z",
      provider: "email",
    });
    expect(session.current).toBe(true);
    expect(session.provider).toBe("email");
  });

  it("derives threat level from security signals", () => {
    expect(deriveThreatLevel({ mfaEnabled: true, failedLogins24h: 0, deviceCount: 1 })).toBe("low");
    expect(deriveThreatLevel({ mfaEnabled: false, failedLogins24h: 0, deviceCount: 1 })).toBe("high");
    expect(deriveThreatLevel({ mfaEnabled: true, failedLogins24h: 10, deviceCount: 1 })).toBe("critical");
  });

  it("builds security dashboard", () => {
    const dashboard = buildSecurityDashboard({
      mfaEnabled: true,
      deviceCount: 2,
      sessionCount: 1,
      failedLogins24h: 0,
      platformProtections: 8,
    });
    expect(dashboard.securityScore).toBeGreaterThanOrEqual(70);
    expect(dashboard.authenticationStatus).toBe("protected");
    expect(dashboard.apiHealth).toBe(98);
  });

  it("computes security analytics from permission audit", () => {
    const permissionAudit = auditPermissions();
    const doc = createDefaultSecurityEngineDocument();
    const analytics = computeSecurityAnalytics(
      permissionAudit,
      countEnabledFraudSignals(doc.fraudDetection),
      5,
      countEnabledProtections(doc.platformSecurity),
    );
    expect(analytics.permissionRoutes).toBeGreaterThan(0);
    expect(analytics.fraudSignals).toBeGreaterThan(0);
    expect(analytics.platformProtections).toBeGreaterThan(0);
  });

  it("allows future module registration", () => {
    const next = registerSecurityEngineModule({
      id: "custom-security",
      label: "Custom Security",
      icon: "🔒",
      description: "Future module",
      href: "/security",
    });
    expect(next.some((m) => m.id === "custom-security")).toBe(true);
  });
});
