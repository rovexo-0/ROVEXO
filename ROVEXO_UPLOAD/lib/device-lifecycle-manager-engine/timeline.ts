import type {
  DeviceHistoryEvent,
  DeviceLifecycleAlert,
  DeviceLifecycleDashboard,
  DeviceLifecycleRecord,
  DeviceLifecycleTrustLevel,
  DeviceLogEntry,
  DeviceOriInsight,
} from "@/lib/device-lifecycle-manager-engine/types";

export function calculateTrustLevel(score: number): DeviceLifecycleTrustLevel {
  if (score >= 85) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

export function buildDeviceLifecycleDashboard(
  devices: DeviceLifecycleRecord[],
  alerts: DeviceLifecycleAlert[],
  latestAppVersion: string,
): DeviceLifecycleDashboard {
  const trusted = devices.filter((d) => d.trustStatus === "trusted");
  const blocked = devices.filter((d) => d.trustStatus === "blocked");
  const pending = devices.filter((d) => d.trustStatus === "pending");
  const latestCount = devices.filter((d) => d.registration.appVersion === latestAppVersion).length;
  const lastLogin = devices.reduce((latest, d) => {
    return new Date(d.registration.lastLogin) > new Date(latest) ? d.registration.lastLogin : latest;
  }, devices[0]?.registration.lastLogin ?? new Date(0).toISOString());

  return {
    registeredDevices: devices.length,
    trustedDevices: trusted.length,
    blockedDevices: blocked.length,
    pendingApproval: pending.length,
    averageTrustScore: devices.length
      ? Math.round(devices.reduce((s, d) => s + d.trust.score, 0) / devices.length)
      : 100,
    averageHealthScore: devices.length
      ? Math.round(devices.reduce((s, d) => s + d.health.healthScore, 0) / devices.length)
      : 100,
    lastLogin,
    latestVersionPercent: devices.length ? Math.round((latestCount / devices.length) * 100) : 0,
    securityIncidents: alerts.filter((a) => !a.resolved && (a.priority === "high" || a.priority === "critical")).length,
  };
}

export function buildTamperIncident(device: DeviceLifecycleRecord): DeviceLifecycleAlert {
  return {
    id: `inc-${Date.now().toString(36)}`,
    type: device.tamper.jailbreak ? "jailbreak-detected" : "root-detected",
    title: "Tamper detected — administrative actions locked",
    message: `OMEGA and Sentinel notified for ${device.registration.deviceName}.`,
    deviceId: device.id,
    priority: "critical",
    createdAt: new Date().toISOString(),
    resolved: false,
  };
}

export function buildOriInsightsForDevice(device: DeviceLifecycleRecord): DeviceOriInsight[] {
  const insights: DeviceOriInsight[] = [];

  if (device.trustStatus === "blocked") {
    insights.push({
      id: `ori-block-${device.id}`,
      deviceId: device.id,
      question: "Why is this device blocked?",
      answer: device.tamper.detected
        ? "Root/jailbreak or tampering detected. Guardian locked admin actions."
        : "Trust verification failed or policy violation.",
      recommendation: "Revoke and re-enroll after remediation.",
      riskPrediction: "High risk if restored without full scan.",
    });
  }

  if (device.trust.score < 85) {
    insights.push({
      id: `ori-trust-${device.id}`,
      deviceId: device.id,
      question: "Why is Trust Score reduced?",
      answer: `Score ${device.trust.score}/100 — ${device.trust.updateStatus}, ${device.trust.riskEvents} risk events.`,
      recommendation: device.registration.appVersion !== "1.0.0" ? "Force update to latest version." : "Complete trust verification.",
      riskPrediction: device.trust.level === "red" ? "Elevated risk — monitor closely." : "Moderate risk — corrective action recommended.",
    });
  }

  insights.push({
    id: `ori-safe-${device.id}`,
    deviceId: device.id,
    question: "Is this device safe?",
    answer:
      device.trustStatus === "trusted" && !device.tamper.detected
        ? "Device passes OMEGA, Guardian, and Sentinel certification."
        : "Device requires review before administrative use.",
    recommendation: device.certification.trustVerified ? "Continue monitoring." : "Run full integrity scan.",
    riskPrediction: device.trust.level === "green" ? "Low predicted risk." : "Risk may increase without update.",
  });

  return insights;
}

export function searchDeviceLifecycleData(input: {
  query: string;
  devices: DeviceLifecycleRecord[];
  history: DeviceHistoryEvent[];
  logs: DeviceLogEntry[];
}) {
  const q = input.query.trim().toLowerCase();
  if (!q) return { devices: [], history: [], logs: [] };
  return {
    devices: input.devices.filter(
      (d) =>
        d.registration.deviceName.toLowerCase().includes(q) ||
        d.registration.deviceModel.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q),
    ),
    history: input.history.filter((h) => h.title.toLowerCase().includes(q) || h.detail.toLowerCase().includes(q)),
    logs: input.logs.filter((l) => l.message.toLowerCase().includes(q)),
  };
}

export function validateDeviceLifecycleReadiness(input: {
  devices: DeviceLifecycleRecord[];
  integrations: { omega: boolean; guardianEnterpriseX: boolean; sentinelX: boolean };
}): { ready: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (!input.integrations.omega) blockers.push("OMEGA integration required");
  if (!input.integrations.guardianEnterpriseX) blockers.push("Guardian Enterprise X required");
  if (!input.integrations.sentinelX) blockers.push("Sentinel X required");
  const tamperedUnlocked = input.devices.filter((d) => d.tamper.detected && !d.locked);
  if (tamperedUnlocked.length > 0) blockers.push(`${tamperedUnlocked.length} tampered device(s) not locked`);
  return { ready: blockers.length === 0, blockers };
}

export function computeFleetSecurityScore(devices: DeviceLifecycleRecord[]): number {
  if (devices.length === 0) return 100;
  const avgTrust = devices.reduce((s, d) => s + d.trust.score, 0) / devices.length;
  const tamperPenalty = devices.filter((d) => d.tamper.detected).length * 15;
  const blockedBonus = devices.filter((d) => d.trustStatus === "blocked" && d.locked).length * 5;
  return Math.max(0, Math.min(100, Math.round(avgTrust - tamperPenalty + blockedBonus)));
}
