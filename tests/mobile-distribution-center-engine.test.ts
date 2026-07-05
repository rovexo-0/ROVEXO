import { describe, expect, it } from "vitest";
import { createMobileDistributionCenterEngineAuditEntry, canPerformMobileDistributionAction } from "@/lib/mobile-distribution-center-engine/audit";
import {
  createDefaultMobileCompliance,
  createDefaultMobileDistributionAnalytics,
  createDefaultMobileDistributionCenterEngineDocument,
  createDefaultMobileNotifications,
  createDefaultMobileRegisteredDevices,
  createDefaultMobileVersionReleases,
} from "@/lib/mobile-distribution-center-engine/defaults";
import {
  MOBILE_DISTRIBUTION_CENTER_DEVICES_KEY,
  MOBILE_DISTRIBUTION_CENTER_ENGINE_LIVE_KEY,
} from "@/lib/mobile-distribution-center-engine/keys";
import {
  MOBILE_BIOMETRIC_ACTIONS,
  MOBILE_COMPLIANCE_ITEMS,
  MOBILE_DEVICE_ACTIONS,
  MOBILE_DOWNLOAD_CARDS,
  MOBILE_NOTIFICATION_TYPES,
  MOBILE_OMEGA_METRICS,
  MOBILE_VERIFICATION_CHECKS,
} from "@/lib/mobile-distribution-center-engine/registry";
import {
  buildDeviceStats,
  buildExportPayload,
  buildOmegaMetrics,
  buildOriAssistant,
  buildQrInstallPayload,
  buildQrSvg,
  buildSecurityCenter,
  buildSupportedLanguages,
  buildVersionCenter,
  countUnreadNotifications,
  resolveInstallStatus,
  resolveLiveStatus,
  validateBiometricReadiness,
  validateMobileDistributionReadiness,
  validatePackageSignature,
  validateQrPayload,
} from "@/lib/mobile-distribution-center-engine/timeline";

const doc = createDefaultMobileDistributionCenterEngineDocument();
const devices = createDefaultMobileRegisteredDevices();
const analytics = createDefaultMobileDistributionAnalytics();
const releases = createDefaultMobileVersionReleases();
const compliance = createDefaultMobileCompliance();

describe("mobile distribution center engine v1.0", () => {
  it("creates default document with UK v1 configuration", () => {
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.appInfo.latestVersion).toBe("1.0.0");
    expect(doc.downloadLinks.previousVersions).toContain("/versions");
    expect(doc.integrations.infrastructureEngine).toBe(true);
    expect(doc.integrations.disasterRecoveryEngine).toBe(true);
  });

  it("registers download cards and device actions", () => {
    expect(MOBILE_DOWNLOAD_CARDS.length).toBe(6);
    expect(MOBILE_DEVICE_ACTIONS).toContain("block");
    expect(MOBILE_DEVICE_ACTIONS).toContain("trust");
    expect(MOBILE_BIOMETRIC_ACTIONS.some((a) => a.key === "requireForOmegaControls")).toBe(true);
  });

  it("registers compliance and notification types", () => {
    expect(MOBILE_COMPLIANCE_ITEMS.length).toBe(6);
    expect(MOBILE_NOTIFICATION_TYPES.length).toBe(6);
    expect(MOBILE_OMEGA_METRICS.length).toBe(10);
    expect(MOBILE_VERIFICATION_CHECKS.length).toBe(12);
  });

  it("builds QR install payload with v1.0 fields", () => {
    const qr = buildQrInstallPayload({ config: doc });
    expect(qr.versionId).toContain("1.0.0");
    expect(qr.installationToken).toHaveLength(16);
    expect(qr.securitySignature).toHaveLength(16);
    expect(qr.oneTapUrl).toContain("mobile-distribution");
    expect(validateQrPayload(qr, doc.appInfo.checksum)).toBe(true);
  });

  it("validates package signature", () => {
    expect(validatePackageSignature(doc)).toBe(true);
  });

  it("generates QR SVG markup", () => {
    const svg = buildQrSvg("test-payload");
    expect(svg).toContain("<svg");
  });

  it("builds device stats from fleet", () => {
    const stats = buildDeviceStats(devices);
    expect(stats.registered).toBe(4);
    expect(stats.trusted).toBe(2);
    expect(stats.blocked).toBe(1);
    expect(stats.pending).toBe(1);
  });

  it("resolves install and live status", () => {
    expect(resolveInstallStatus(devices, "1.0.0")).toBe("latest-version");
    expect(resolveLiveStatus(devices)).toBe("update-available");
  });

  it("builds security center with risk score", () => {
    const center = buildSecurityCenter(doc, devices);
    expect(center.packageIntegrity).toBe("Verified");
    expect(center.omegaStatus).toBe("OMEGA GOLD Verified");
    expect(center.riskScore).toBeGreaterThan(0);
  });

  it("builds version center with releases", () => {
    const center = buildVersionCenter(doc, releases);
    expect(center.stableVersion).toBe("1.0.0");
    expect(center.releases.length).toBe(3);
    expect(center.rollbackAvailable).toBe(true);
  });

  it("builds OMEGA metrics and ORI assistant", () => {
    const omega = buildOmegaMetrics(analytics, doc);
    expect(omega.downloads).toBe(1284);
    expect(omega.integrity).toBe("All packages verified");
    const ori = buildOriAssistant(devices, doc);
    expect(ori.healthScore).toBeGreaterThan(50);
    expect(ori.insights.length).toBeGreaterThan(2);
  });

  it("builds supported languages with flags", () => {
    const langs = buildSupportedLanguages();
    expect(langs.some((l) => l.flag === "🇬🇧")).toBe(true);
    expect(langs.some((l) => l.flag === "🇷🇴")).toBe(true);
  });

  it("validates readiness and biometrics", () => {
    expect(validateMobileDistributionReadiness(doc).ready).toBe(true);
    expect(validateBiometricReadiness(doc)).toBe(true);
  });

  it("counts unread notifications", () => {
    expect(countUnreadNotifications(createDefaultMobileNotifications())).toBe(2);
  });

  it("builds export payload with compliance", () => {
    const payload = buildExportPayload({
      format: "json",
      snapshot: { appInfo: doc.appInfo, analytics, devices, omega: buildOmegaMetrics(analytics, doc), compliance },
    });
    expect(payload.compliance.rovexoTrust).toBe(true);
    expect(payload.compliance.omegaGold).toBe(true);
  });

  it("creates audit entries and permission gates", () => {
    const entry = createMobileDistributionCenterEngineAuditEntry({
      administrator: "admin",
      module: "mobile-distribution-center",
      action: "block-device",
    });
    expect(entry.id.startsWith("mdc-")).toBe(true);
    expect(canPerformMobileDistributionAction("block-device", { mfaEnabled: true, deviceVerification: true })).toBe(true);
  });

  it("exports platform setting keys", () => {
    expect(MOBILE_DISTRIBUTION_CENTER_ENGINE_LIVE_KEY).toBe("mobile_distribution_center_engine_live_v1");
    expect(MOBILE_DISTRIBUTION_CENTER_DEVICES_KEY).toBe("mobile_distribution_center_devices_v1");
  });

  it("requires biometric for omega controls", () => {
    expect(doc.biometric.requireForOmegaControls).toBe(true);
    expect(doc.biometric.requireForPermissions).toBe(true);
  });

  it("includes enterprise integrations", () => {
    expect(doc.integrations.complianceCenter).toBe(true);
    expect(doc.integrations.certificationCenter).toBe(true);
    expect(doc.integrations.antivirusEngineX).toBe(true);
  });

  it("tracks extended analytics metrics", () => {
    expect(analytics.downloadsToday).toBeGreaterThan(0);
    expect(analytics.installSuccessRate).toBeGreaterThan(90);
    expect(analytics.crashRate).toBeLessThan(1);
  });
});
