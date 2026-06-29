import type {
  DeviceHistoryEvent,
  DeviceLifecycleAlert,
  DeviceLifecycleRecord,
  DeviceLifecycleSettings,
  DeviceLogEntry,
  DeviceOriInsight,
} from "@/lib/device-lifecycle-manager-engine/types";

const now = () => new Date().toISOString();

function trustLevel(score: number) {
  if (score >= 85) return "green" as const;
  if (score >= 60) return "yellow" as const;
  return "red" as const;
}

function buildRecord(input: {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  platform: "ios" | "android";
  osVersion: string;
  appVersion: string;
  build: string;
  country: string;
  ip: string;
  trustStatus: DeviceLifecycleRecord["trustStatus"];
  trustScore: number;
  healthScore: number;
  tamper?: Partial<DeviceLifecycleRecord["tamper"]>;
  locked?: boolean;
}): DeviceLifecycleRecord {
  const tamperDefaults = {
    root: false,
    jailbreak: false,
    modifiedOs: false,
    debugMode: false,
    emulator: false,
    fakeGps: false,
    hookingFrameworks: false,
    tamperedApp: false,
    detected: false,
  };
  const tamper = { ...tamperDefaults, ...input.tamper };
  tamper.detected = Object.entries(tamper)
    .filter(([k, v]) => k !== "detected" && v === true)
    .length > 0;

  return {
    id: input.id,
    platform: input.platform,
    country: input.country,
    ip: input.ip,
    trustStatus: input.trustStatus,
    locked: input.locked ?? tamper.detected,
    registration: {
      deviceId: input.id,
      deviceName: input.name,
      deviceModel: input.model,
      manufacturer: input.manufacturer,
      operatingSystem: input.platform === "ios" ? "iOS" : "Android",
      osVersion: input.osVersion,
      appVersion: input.appVersion,
      buildNumber: input.build,
      installationDate: "2026-06-01T10:00:00.000Z",
      lastLogin: now(),
      lastSync: now(),
      pushToken: `pt_${input.id}`,
      timezone: input.country === "Romania" ? "Europe/Bucharest" : "Europe/London",
      language: input.country === "Romania" ? "ro" : "en",
    },
    trust: {
      score: input.trustScore,
      level: trustLevel(input.trustScore),
      authenticationHealth: Math.min(100, input.trustScore + 2),
      securityStatus: Math.min(100, input.trustScore),
      rootJailbreakDetected: tamper.root || tamper.jailbreak,
      appIntegrity: Math.min(100, input.trustScore + 5),
      certificateValidation: input.trustScore >= 70,
      updateStatus: input.appVersion === "1.0.0" ? "Latest" : "Update available",
      lastScan: now(),
      riskEvents: tamper.detected ? 3 : 0,
    },
    health: {
      battery: 78 + (input.trustScore % 20),
      storage: 62,
      memory: 54,
      cpuUsage: 18,
      appPerformance: input.healthScore >= 80 ? "Optimal" : "Attention",
      backgroundTasks: 4,
      crashStatus: "No recent crashes",
      connectivity: "Stable",
      pushNotifications: true,
      healthScore: input.healthScore,
    },
    security: {
      encrypted: true,
      signatureVerified: true,
      certificateValid: input.trustScore >= 70,
      guardianProtected: true,
      sentinelProtected: true,
      omegaVerified: input.trustScore >= 85,
      antivirusProtected: !tamper.detected,
      secureConnection: true,
      vpnDetected: false,
      developerMode: tamper.debugMode,
    },
    tamper,
    certification: {
      omegaVerified: input.trustScore >= 85,
      guardianVerified: true,
      sentinelVerified: true,
      antivirusVerified: !tamper.detected,
      trustVerified: input.trustStatus === "trusted",
      certificateStatus: input.trustScore >= 70 ? "Valid — Production Certified" : "Review required",
    },
  };
}

export function createDefaultDeviceLifecycleRecords(): DeviceLifecycleRecord[] {
  return [
    buildRecord({
      id: "dev-iphone-01",
      name: "Admin iPhone",
      model: "iPhone 15 Pro",
      manufacturer: "Apple",
      platform: "ios",
      osVersion: "iOS 18.2",
      appVersion: "1.0.0",
      build: "100",
      country: "United Kingdom",
      ip: "203.0.113.42",
      trustStatus: "trusted",
      trustScore: 98,
      healthScore: 96,
    }),
    buildRecord({
      id: "dev-pixel-01",
      name: "Ops Pixel",
      model: "Google Pixel 8",
      manufacturer: "Google",
      platform: "android",
      osVersion: "Android 15",
      appVersion: "1.0.0",
      build: "100",
      country: "Romania",
      ip: "198.51.100.18",
      trustStatus: "trusted",
      trustScore: 95,
      healthScore: 92,
    }),
    buildRecord({
      id: "dev-ipad-01",
      name: "Executive iPad",
      model: "iPad Pro 12.9",
      manufacturer: "Apple",
      platform: "ios",
      osVersion: "iOS 17.6",
      appVersion: "0.9.8",
      build: "98",
      country: "United Kingdom",
      ip: "203.0.113.88",
      trustStatus: "pending",
      trustScore: 72,
      healthScore: 81,
    }),
    buildRecord({
      id: "dev-android-blocked",
      name: "Unknown Android",
      model: "Samsung Galaxy S21",
      manufacturer: "Samsung",
      platform: "android",
      osVersion: "Android 13",
      appVersion: "0.9.5",
      build: "95",
      country: "Unknown",
      ip: "192.0.2.99",
      trustStatus: "blocked",
      trustScore: 12,
      healthScore: 34,
      locked: true,
      tamper: { root: true, hookingFrameworks: true, tamperedApp: true },
    }),
  ];
}

export function createDefaultDeviceLifecycleAlerts(): DeviceLifecycleAlert[] {
  return [
    {
      id: "alert-1",
      type: "app-outdated",
      title: "Executive iPad requires update",
      message: "Device on v0.9.8 — update to v1.0.0 for full certification.",
      deviceId: "dev-ipad-01",
      priority: "high",
      createdAt: "2026-06-25T14:00:00.000Z",
      resolved: false,
    },
    {
      id: "alert-2",
      type: "root-detected",
      title: "Root detected on blocked device",
      message: "Guardian Enterprise X locked administrative actions.",
      deviceId: "dev-android-blocked",
      priority: "critical",
      createdAt: "2026-06-24T09:00:00.000Z",
      resolved: false,
    },
    {
      id: "alert-3",
      type: "device-offline",
      title: "Unknown Android offline",
      message: "Device has not synced in 72 hours.",
      deviceId: "dev-android-blocked",
      priority: "medium",
      createdAt: "2026-06-23T08:00:00.000Z",
      resolved: true,
    },
  ];
}

export function createDefaultDeviceLifecycleHistory(): DeviceHistoryEvent[] {
  return [
    {
      id: "hist-1",
      deviceId: "dev-iphone-01",
      category: "login",
      title: "Successful biometric login",
      detail: "Face ID verified · United Kingdom",
      timestamp: now(),
    },
    {
      id: "hist-2",
      deviceId: "dev-ipad-01",
      category: "update",
      title: "Update available",
      detail: "v0.9.8 → v1.0.0 pending",
      timestamp: "2026-06-25T10:00:00.000Z",
    },
    {
      id: "hist-3",
      deviceId: "dev-android-blocked",
      category: "security",
      title: "Tamper incident generated",
      detail: "Root + hooking frameworks detected · Sentinel notified",
      timestamp: "2026-06-24T09:00:00.000Z",
    },
    {
      id: "hist-4",
      deviceId: "dev-pixel-01",
      category: "authentication",
      title: "MFA session verified",
      detail: "Android Biometrics + session token validated",
      timestamp: "2026-06-26T08:30:00.000Z",
    },
  ];
}

export function createDefaultDeviceLifecycleLogs(): DeviceLogEntry[] {
  return [
    {
      id: "log-1",
      deviceId: "dev-iphone-01",
      level: "info",
      source: "OMEGA",
      message: "Trust score 98 — continuous monitoring active",
      timestamp: now(),
    },
    {
      id: "log-2",
      deviceId: "dev-android-blocked",
      level: "critical",
      source: "Sentinel",
      message: "Administrative actions locked due to root detection",
      timestamp: "2026-06-24T09:01:00.000Z",
    },
    {
      id: "log-3",
      deviceId: "dev-ipad-01",
      level: "warning",
      source: "Guardian",
      message: "Certificate validation pending full app update",
      timestamp: "2026-06-25T11:00:00.000Z",
    },
  ];
}

export function createDefaultDeviceOriInsights(): DeviceOriInsight[] {
  return [
    {
      id: "ori-q1",
      deviceId: "dev-android-blocked",
      question: "Why is this device blocked?",
      answer: "Root and hooking frameworks detected. Guardian locked admin actions and Sentinel generated an incident.",
      recommendation: "Revoke device and require re-enrollment with OMEGA verification.",
      riskPrediction: "High risk of credential compromise if unblocked without remediation.",
    },
    {
      id: "ori-q2",
      deviceId: "dev-ipad-01",
      question: "Why is Trust Score reduced?",
      answer: "Pending trust verification and outdated app version (0.9.8).",
      recommendation: "Approve trust after MFA review and push v1.0.0 update.",
      riskPrediction: "Medium risk until updated and certified.",
    },
    {
      id: "ori-q3",
      question: "Is the fleet safe?",
      answer: "3 of 4 devices pass enterprise certification. One blocked device under review.",
      recommendation: "Maintain nightly OMEGA sync and force update on pending devices.",
      riskPrediction: "Low fleet-wide risk with current controls.",
    },
  ];
}

export function createDefaultDeviceLifecycleSettings(): DeviceLifecycleSettings {
  return {
    autoRegister: true,
    requireMfa: true,
    requireBiometricForEmergency: true,
    requireBiometricForRelease: true,
    requireBiometricForRoleChange: true,
    requireBiometricForUserDelete: true,
    requireBiometricForSecuritySettings: true,
    requireBiometricForCertification: true,
    lockOnTamper: true,
    notifyOmegaOnTamper: true,
    notifySentinelOnTamper: true,
    continuousMonitoring: true,
  };
}

export function createDefaultDeviceLifecycleIntegrations() {
  return {
    omega: true,
    guardianEnterpriseX: true,
    sentinelX: true,
    antivirusEngineX: true,
    ori: true,
    infrastructureEngine: true,
    disasterRecoveryEngine: true,
    complianceCenter: true,
    certificationCenter: true,
  };
}
