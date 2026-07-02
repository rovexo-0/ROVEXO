import { describe, expect, it } from "vitest";
import { canPerformOmegaAction } from "@/lib/omega-enterprise-mobile-engine/audit";
import {
  createDefaultOmegaAlerts,
  createDefaultOmegaCertifications,
  createDefaultOmegaEnterpriseSettings,
  createDefaultOmegaGlobalHealth,
  createDefaultOmegaGlobalScan,
  createDefaultOmegaLiveModules,
} from "@/lib/omega-enterprise-mobile-engine/defaults";
import {
  OMEGA_ENTERPRISE_MOBILE_ALERTS_KEY,
  OMEGA_ENTERPRISE_MOBILE_METRICS_KEY,
  OMEGA_ENTERPRISE_MOBILE_SETTINGS_KEY,
} from "@/lib/omega-enterprise-mobile-engine/keys";
import {
  OMEGA_ACTION_CENTER,
  OMEGA_CERTIFICATION_ITEMS,
  OMEGA_ENTERPRISE_ROUTES,
  OMEGA_GLOBAL_SCAN_CHECKS,
  OMEGA_REPORT_TYPES,
} from "@/lib/omega-enterprise-mobile-engine/registry";
import {
  buildGlobalScanReport,
  buildOmegaEnterpriseDashboard,
  calculateOverallHealthScore,
  computeOmegaGoldScore,
  validateOmegaEnterpriseReadiness,
} from "@/lib/omega-enterprise-mobile-engine/timeline";

const alerts = createDefaultOmegaAlerts();
const settings = createDefaultOmegaEnterpriseSettings();
const globalHealth = createDefaultOmegaGlobalHealth();
const liveModules = createDefaultOmegaLiveModules();

describe("omega enterprise mobile core engine v1.0", () => {
  it("registers all SA-003 routes", () => {
    expect(OMEGA_ENTERPRISE_ROUTES.length).toBe(14);
    expect(OMEGA_ENTERPRISE_ROUTES.some((r) => r.href.includes("/mobile/omega/live"))).toBe(true);
    expect(OMEGA_ENTERPRISE_ROUTES.some((r) => r.href.includes("/mobile/omega/reports"))).toBe(true);
  });

  it("registers global scan checks and action center", () => {
    expect(OMEGA_GLOBAL_SCAN_CHECKS.length).toBe(9);
    expect(OMEGA_ACTION_CENTER.length).toBe(10);
    expect(OMEGA_REPORT_TYPES.length).toBe(7);
    expect(OMEGA_CERTIFICATION_ITEMS.length).toBe(13);
  });

  it("creates default global health scores", () => {
    expect(globalHealth.overall).toBe(97);
    expect(globalHealth.payments).toBe(99);
    expect(calculateOverallHealthScore(globalHealth)).toBeGreaterThan(90);
  });

  it("builds live module dashboard data", () => {
    expect(liveModules.length).toBe(13);
    expect(liveModules.some((m) => m.label === "Guardian")).toBe(true);
    expect(liveModules.some((m) => m.label === "ORI")).toBe(true);
  });

  it("builds omega enterprise dashboard", () => {
    const scan = createDefaultOmegaGlobalScan();
    const dashboard = buildOmegaEnterpriseDashboard({
      globalHealth,
      liveModules,
      systemStatus: [],
      alerts,
      latestScan: scan,
      performanceScore: 95,
    });
    expect(dashboard.alertCounts.critical).toBeGreaterThan(0);
    expect(dashboard.lastGlobalScanScore).toBe(96);
  });

  it("builds global scan report with all checks", () => {
    const report = buildGlobalScanReport(90);
    expect(report.results.length).toBe(9);
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.unifiedSummary).toContain("OMEGA Global Scan");
  });

  it("validates omega enterprise readiness", () => {
    const { ready, blockers } = validateOmegaEnterpriseReadiness({
      integrations: { omega: true, guardianEnterpriseX: true, sentinelX: true, antivirusEngineX: true },
      globalHealth,
    });
    expect(ready).toBe(true);
    expect(blockers).toHaveLength(0);
  });

  it("computes omega gold score", () => {
    const certs = createDefaultOmegaCertifications();
    const passCount = certs.filter((c) => c.status === "pass").length;
    const score = computeOmegaGoldScore(globalHealth, passCount, certs.length);
    expect(score).toBeGreaterThan(85);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("enforces emergency and maintenance mode exclusivity", () => {
    expect(canPerformOmegaAction("emergency-mode", { ...settings, maintenanceMode: true }).allowed).toBe(false);
    expect(canPerformOmegaAction("maintenance-mode", { ...settings, emergencyMode: true }).allowed).toBe(false);
    expect(canPerformOmegaAction("run-scan", settings).allowed).toBe(true);
  });

  it("tracks default alerts by severity", () => {
    expect(alerts.filter((a) => a.severity === "critical").length).toBeGreaterThan(0);
    expect(alerts.every((a) => a.recommendedAction.length > 0)).toBe(true);
  });

  it("exports platform setting keys", () => {
    expect(OMEGA_ENTERPRISE_MOBILE_METRICS_KEY).toBe("omega_enterprise_mobile_metrics_v1");
    expect(OMEGA_ENTERPRISE_MOBILE_ALERTS_KEY).toBe("omega_enterprise_mobile_alerts_v1");
    expect(OMEGA_ENTERPRISE_MOBILE_SETTINGS_KEY).toBe("omega_enterprise_mobile_settings_v1");
  });

  it("requires integrations for readiness", () => {
    const { ready } = validateOmegaEnterpriseReadiness({
      integrations: { omega: false, guardianEnterpriseX: true, sentinelX: true, antivirusEngineX: true },
      globalHealth,
    });
    expect(ready).toBe(false);
  });

  it("flags health below gold threshold", () => {
    const lowHealth = { ...globalHealth, overall: 70 };
    const { ready, blockers } = validateOmegaEnterpriseReadiness({
      integrations: { omega: true, guardianEnterpriseX: true, sentinelX: true, antivirusEngineX: true },
      globalHealth: lowHealth,
    });
    expect(ready).toBe(false);
    expect(blockers.some((b) => b.includes("OMEGA GOLD"))).toBe(true);
  });

  it("supports all report types", () => {
    expect(OMEGA_REPORT_TYPES.map((r) => r.id)).toContain("executive");
    expect(OMEGA_REPORT_TYPES.map((r) => r.id)).toContain("certification");
  });

  it("includes certification compliance items", () => {
    expect(OMEGA_CERTIFICATION_ITEMS.some((c) => c.label === "GDPR")).toBe(true);
    expect(OMEGA_CERTIFICATION_ITEMS.some((c) => c.label === "OMEGA GOLD")).toBe(true);
  });

  it("enables auto global scan in settings", () => {
    expect(settings.autoGlobalScan).toBe(true);
    expect(settings.autoGlobalScanIntervalHours).toBe(6);
    expect(settings.pushNotifications).toBe(true);
  });

  it("includes performance scan in global checks", () => {
    expect(OMEGA_GLOBAL_SCAN_CHECKS.some((c) => c.id === "performance")).toBe(true);
    expect(OMEGA_GLOBAL_SCAN_CHECKS.some((c) => c.id === "certification")).toBe(true);
  });

  it("includes guardian and sentinel scans", () => {
    expect(OMEGA_GLOBAL_SCAN_CHECKS.map((c) => c.id)).toContain("guardian");
    expect(OMEGA_GLOBAL_SCAN_CHECKS.map((c) => c.id)).toContain("sentinel");
  });

  it("registers action center emergency controls", () => {
    expect(OMEGA_ACTION_CENTER.map((a) => a.id)).toContain("emergency-mode");
    expect(OMEGA_ACTION_CENTER.map((a) => a.id)).toContain("maintenance-mode");
  });

  it("provides open alerts for dashboard counts", () => {
    const open = alerts.filter((a) => a.status !== "resolved");
    expect(open.length).toBeGreaterThan(0);
  });
});
