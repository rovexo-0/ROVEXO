import { describe, expect, it } from "vitest";
import { canPerformDeviceRemoteAction } from "@/lib/device-lifecycle-manager-engine/audit";
import {
  createDefaultDeviceLifecycleAlerts,
  createDefaultDeviceLifecycleRecords,
  createDefaultDeviceLifecycleSettings,
} from "@/lib/device-lifecycle-manager-engine/defaults";
import {
  DEVICE_LIFECYCLE_MANAGER_RECORDS_KEY,
  DEVICE_LIFECYCLE_MANAGER_SETTINGS_KEY,
} from "@/lib/device-lifecycle-manager-engine/keys";
import {
  DEVICE_BIOMETRIC_REQUIREMENTS,
  DEVICE_CERTIFICATION_BADGES,
  DEVICE_LIFECYCLE_ROUTES,
  DEVICE_REMOTE_ACTIONS,
  DEVICE_TAMPER_CHECKS,
} from "@/lib/device-lifecycle-manager-engine/registry";
import {
  buildDeviceLifecycleDashboard,
  buildOriInsightsForDevice,
  buildTamperIncident,
  calculateTrustLevel,
  computeFleetSecurityScore,
  validateDeviceLifecycleReadiness,
} from "@/lib/device-lifecycle-manager-engine/timeline";

const devices = createDefaultDeviceLifecycleRecords();
const alerts = createDefaultDeviceLifecycleAlerts();
const settings = createDefaultDeviceLifecycleSettings();

describe("device lifecycle manager engine v1.0", () => {
  it("registers all SA-002 routes", () => {
    expect(DEVICE_LIFECYCLE_ROUTES.length).toBe(10);
    expect(DEVICE_LIFECYCLE_ROUTES.some((r) => r.href.includes("/devices/trust"))).toBe(true);
  });

  it("creates default device records with registration fields", () => {
    const iphone = devices.find((d) => d.id === "dev-iphone-01");
    expect(iphone?.registration.manufacturer).toBe("Apple");
    expect(iphone?.registration.pushToken).toContain("pt_");
    expect(iphone?.registration.timezone).toBe("Europe/London");
  });

  it("registers remote actions and tamper checks", () => {
    expect(DEVICE_REMOTE_ACTIONS.length).toBe(11);
    expect(DEVICE_TAMPER_CHECKS.length).toBe(8);
    expect(DEVICE_BIOMETRIC_REQUIREMENTS.length).toBe(6);
    expect(DEVICE_CERTIFICATION_BADGES.length).toBe(5);
  });

  it("calculates trust levels", () => {
    expect(calculateTrustLevel(98)).toBe("green");
    expect(calculateTrustLevel(72)).toBe("yellow");
    expect(calculateTrustLevel(12)).toBe("red");
  });

  it("builds lifecycle dashboard", () => {
    const dashboard = buildDeviceLifecycleDashboard(devices, alerts, "1.0.0");
    expect(dashboard.registeredDevices).toBe(4);
    expect(dashboard.trustedDevices).toBe(2);
    expect(dashboard.blockedDevices).toBe(1);
    expect(dashboard.averageTrustScore).toBeGreaterThan(50);
  });

  it("detects tamper on blocked device", () => {
    const blocked = devices.find((d) => d.id === "dev-android-blocked")!;
    expect(blocked.tamper.detected).toBe(true);
    expect(blocked.tamper.root).toBe(true);
    expect(blocked.locked).toBe(true);
  });

  it("builds tamper incident for OMEGA and Sentinel", () => {
    const blocked = devices.find((d) => d.id === "dev-android-blocked")!;
    const incident = buildTamperIncident(blocked);
    expect(incident.type).toBe("root-detected");
    expect(incident.message).toContain("Sentinel");
  });

  it("builds ORI insights for blocked device", () => {
    const blocked = devices.find((d) => d.id === "dev-android-blocked")!;
    const insights = buildOriInsightsForDevice(blocked);
    expect(insights.some((i) => i.question.includes("blocked"))).toBe(true);
    expect(insights.some((i) => i.recommendation.length > 0)).toBe(true);
  });

  it("computes fleet security score", () => {
    const score = computeFleetSecurityScore(devices);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("validates lifecycle readiness", () => {
    const { ready, blockers } = validateDeviceLifecycleReadiness({
      devices,
      integrations: { omega: true, guardianEnterpriseX: true, sentinelX: true },
    });
    expect(ready).toBe(true);
    expect(blockers).toHaveLength(0);
  });

  it("enforces remote action permissions", () => {
    const blocked = devices.find((d) => d.id === "dev-android-blocked")!;
    expect(canPerformDeviceRemoteAction("remove", settings, blocked).allowed).toBe(true);
    expect(canPerformDeviceRemoteAction("remote-logout", settings, blocked).allowed).toBe(false);
  });

  it("requires MFA in settings", () => {
    expect(settings.requireMfa).toBe(true);
    expect(settings.lockOnTamper).toBe(true);
    expect(settings.notifyOmegaOnTamper).toBe(true);
  });

  it("certifies trusted devices", () => {
    const iphone = devices.find((d) => d.id === "dev-iphone-01")!;
    expect(iphone.certification.omegaVerified).toBe(true);
    expect(iphone.certification.guardianVerified).toBe(true);
    expect(iphone.certification.trustVerified).toBe(true);
  });

  it("monitors device health metrics", () => {
    const iphone = devices.find((d) => d.id === "dev-iphone-01")!;
    expect(iphone.health.battery).toBeGreaterThan(0);
    expect(iphone.health.healthScore).toBeGreaterThan(80);
    expect(iphone.health.pushNotifications).toBe(true);
  });

  it("tracks device security status", () => {
    const iphone = devices.find((d) => d.id === "dev-iphone-01")!;
    expect(iphone.security.encrypted).toBe(true);
    expect(iphone.security.guardianProtected).toBe(true);
    expect(iphone.security.secureConnection).toBe(true);
  });

  it("exports platform setting keys", () => {
    expect(DEVICE_LIFECYCLE_MANAGER_RECORDS_KEY).toBe("device_lifecycle_manager_records_v1");
    expect(DEVICE_LIFECYCLE_MANAGER_SETTINGS_KEY).toBe("device_lifecycle_manager_settings_v1");
  });

  it("requires biometric for certification approval", () => {
    expect(settings.requireBiometricForCertification).toBe(true);
    expect(settings.requireBiometricForEmergency).toBe(true);
  });

  it("flags pending device with reduced trust", () => {
    const ipad = devices.find((d) => d.id === "dev-ipad-01")!;
    expect(ipad.trustStatus).toBe("pending");
    expect(ipad.trust.score).toBeLessThan(85);
  });

  it("generates unresolved alerts", () => {
    expect(alerts.filter((a) => !a.resolved).length).toBeGreaterThan(0);
  });

  it("supports all remote action types", () => {
    expect(DEVICE_REMOTE_ACTIONS.map((a) => a.id)).toContain("generate-report");
    expect(DEVICE_REMOTE_ACTIONS.map((a) => a.id)).toContain("invalidate-sessions");
  });
});
