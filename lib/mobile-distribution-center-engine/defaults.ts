import { MOBILE_FUTURE_LANGUAGES } from "@/lib/mobile-distribution-center-engine/registry";
import type {
  MobileComplianceStatus,
  MobileDistributionAnalytics,
  MobileDistributionEngineDocument,
  MobileDistributionEngineHistoryEntry,
  MobileDistributionNotification,
  MobileOmegaMetrics,
  MobileOriInsight,
  MobileRegisteredDevice,
  MobileVersionRelease,
} from "@/lib/mobile-distribution-center-engine/types";

const now = () => new Date().toISOString();

export function createDefaultMobileDistributionCenterEngineDocument(
  label = "ROVEXO Super Admin Mobile",
): MobileDistributionEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    appInfo: {
      currentVersion: "1.0.0",
      latestVersion: "1.0.0",
      stableVersion: "1.0.0",
      betaVersion: "1.1.0-beta.1",
      build: "100",
      releaseDate: "2026-06-26",
      fileSizeIos: "48.2 MB",
      fileSizeAndroid: "42.6 MB",
      minimumIos: "iOS 16.0",
      minimumAndroid: "Android 10",
      architecture: "arm64 · universal",
      digitalSignature: "ROVEXO-ENT-SA-2026-R1",
      checksum: "sha256:a3f8c91e2b4d7f6a0e5c8b2d9f1a4e7c3b6d8f0a2e5c7b9d1f3a5e7c9b2d4f6",
      certification: "Production Certified",
    },
    downloadLinks: {
      ios: "https://apps.apple.com/app/rovexo-super-admin",
      android: "https://play.google.com/store/apps/details?id=co.uk.rovexo.superadmin",
      latest: "https://www.rovexo.co.uk/super-admin/mobile-distribution",
      releaseNotes: "https://www.rovexo.co.uk/super-admin/mobile-distribution#release-notes",
      installationGuide: "https://www.rovexo.co.uk/super-admin/mobile-distribution#installation-guide",
      previousVersions: "https://www.rovexo.co.uk/super-admin/mobile-distribution/versions",
    },
    language: "en",
    biometric: {
      faceId: true,
      touchId: true,
      androidBiometrics: true,
      requireForEmergency: true,
      requireForRelease: true,
      requireForUserDelete: true,
      requireForPermissions: true,
      requireForCertification: true,
      requireForOmegaControls: true,
    },
    security: {
      faceIdReady: true,
      touchIdReady: true,
      androidBiometricsReady: true,
      mfaEnabled: true,
      deviceVerification: true,
      encryptedConnection: true,
      trustedDevice: true,
      omegaVerified: true,
      guardianProtected: true,
      sentinelProtected: true,
      rovexoTrust: true,
    },
    integrations: {
      omega: true,
      guardianEnterpriseX: true,
      sentinelX: true,
      antivirusEngineX: true,
      ori: true,
      infrastructureEngine: true,
      disasterRecoveryEngine: true,
      complianceCenter: true,
      certificationCenter: true,
      operationsCenter: true,
      recoveryCenter: true,
      auditCenter: true,
    },
    futureReady: MOBILE_FUTURE_LANGUAGES.slice(),
    auditLog: [],
  };
}

export function createDefaultMobileDistributionCenterEngineHistory(): MobileDistributionEngineHistoryEntry[] {
  return [
    {
      id: "mdc-h1",
      version: "1.0.0",
      publishedAt: "2026-06-26T00:00:00.000Z",
      publishedBy: "system",
      summary: "Initial ROVEXO Super Admin Mobile v1.0 release",
    },
    {
      id: "mdc-h0",
      version: "0.9.8",
      publishedAt: "2026-05-15T00:00:00.000Z",
      publishedBy: "system",
      summary: "Release candidate with biometric certification",
    },
  ];
}

export function createDefaultMobileRegisteredDevices(): MobileRegisteredDevice[] {
  return [
    {
      id: "dev-iphone-01",
      name: "Admin iPhone",
      model: "iPhone 15 Pro",
      osVersion: "iOS 18.2",
      platform: "ios",
      lastLogin: now(),
      country: "United Kingdom",
      ip: "203.0.113.42",
      trustStatus: "trusted",
      liveStatus: "latest-version",
      appVersion: "1.0.0",
      trustScore: 98,
      isActive: true,
      registeredAt: "2026-06-01T10:00:00.000Z",
    },
    {
      id: "dev-pixel-01",
      name: "Ops Pixel",
      model: "Google Pixel 8",
      osVersion: "Android 15",
      platform: "android",
      lastLogin: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
      country: "Romania",
      ip: "198.51.100.18",
      trustStatus: "trusted",
      liveStatus: "installed",
      appVersion: "1.0.0",
      trustScore: 95,
      isActive: true,
      registeredAt: "2026-06-10T14:30:00.000Z",
    },
    {
      id: "dev-ipad-01",
      name: "Executive iPad",
      model: "iPad Pro 12.9",
      osVersion: "iOS 17.6",
      platform: "ios",
      lastLogin: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
      country: "United Kingdom",
      ip: "203.0.113.88",
      trustStatus: "pending",
      liveStatus: "update-available",
      appVersion: "0.9.8",
      trustScore: 72,
      isActive: true,
      registeredAt: "2026-05-15T09:00:00.000Z",
    },
    {
      id: "dev-android-blocked",
      name: "Unknown Android",
      model: "Samsung Galaxy S21",
      osVersion: "Android 13",
      platform: "android",
      lastLogin: new Date(Date.now() - 72 * 60 * 60_000).toISOString(),
      country: "Unknown",
      ip: "192.0.2.99",
      trustStatus: "blocked",
      liveStatus: "offline",
      appVersion: "0.9.5",
      trustScore: 12,
      isActive: false,
      registeredAt: "2026-04-01T09:00:00.000Z",
    },
  ];
}

export function createDefaultMobileDistributionAnalytics(): MobileDistributionAnalytics {
  return {
    totalDownloads: 1284,
    downloadsToday: 18,
    downloadsThisMonth: 412,
    activeDevices: 847,
    latestVersionPercent: 92,
    installSuccessRate: 97,
    updateRate: 88,
    crashRate: 0.2,
    countryDistribution: [
      { country: "United Kingdom", count: 512, percent: 60 },
      { country: "Romania", count: 198, percent: 23 },
      { country: "Germany", count: 87, percent: 10 },
      { country: "Other", count: 50, percent: 7 },
    ],
    platformDistribution: [
      { platform: "iOS", count: 521, percent: 62 },
      { platform: "Android", count: 326, percent: 38 },
    ],
    dailyInstalls: 24,
    monthlyInstalls: 412,
  };
}

export function createDefaultMobileVersionReleases(): MobileVersionRelease[] {
  return [
    {
      id: "rel-100",
      version: "1.0.0",
      channel: "stable",
      build: "100",
      releaseDate: "2026-06-26",
      downloadSize: "48.2 MB",
      checksum: "sha256:a3f8c91e…",
      signature: "ROVEXO-ENT-SA-2026-R1",
      rollbackAvailable: true,
    },
    {
      id: "rel-098",
      version: "0.9.8",
      channel: "stable",
      build: "98",
      releaseDate: "2026-05-15",
      downloadSize: "46.8 MB",
      checksum: "sha256:b2e7d04f…",
      signature: "ROVEXO-ENT-SA-2026-R0",
      rollbackAvailable: true,
    },
    {
      id: "rel-beta-110",
      version: "1.1.0-beta.1",
      channel: "beta",
      build: "110",
      releaseDate: "2026-06-20",
      downloadSize: "49.1 MB",
      checksum: "sha256:c4f9a12b…",
      signature: "ROVEXO-ENT-SA-2026-B1",
      rollbackAvailable: false,
    },
  ];
}

export function createDefaultMobileCompliance(): MobileComplianceStatus {
  return {
    rovexoTrust: true,
    omegaGold: true,
    guardian: true,
    sentinel: true,
    antivirus: true,
    enterpriseCompliance: true,
    isoReadiness: "ISO 27001 aligned",
    cyberEssentials: "Certified",
    soc2Readiness: "Type II ready",
    pciReadiness: "SAQ-A eligible",
    gdpr: "Compliant",
  };
}

export function createDefaultMobileNotifications(): MobileDistributionNotification[] {
  return [
    {
      id: "n-1",
      type: "new-version",
      title: "Super Admin Mobile v1.0.0 available",
      message: "Production release with OMEGA GOLD certification is ready for deployment.",
      priority: "medium",
      createdAt: "2026-06-26T08:00:00.000Z",
      read: false,
    },
    {
      id: "n-2",
      type: "update-required",
      title: "1 device requires update",
      message: "Executive iPad is on v0.9.8 — update to v1.0.0 for full biometric support.",
      priority: "high",
      createdAt: "2026-06-25T14:00:00.000Z",
      read: false,
    },
    {
      id: "n-3",
      type: "security-alert",
      title: "Blocked device detected",
      message: "Unknown Android device blocked by Guardian Enterprise X.",
      priority: "critical",
      createdAt: "2026-06-24T09:00:00.000Z",
      read: true,
    },
  ];
}

export function createDefaultMobileOmegaMetrics(): MobileOmegaMetrics {
  return {
    downloads: 1284,
    updates: 356,
    installations: 1120,
    activeDevices: 847,
    inactiveDevices: 273,
    crashes: 3,
    performance: "Optimal — p95 load 420ms",
    security: "Guardian + Sentinel active",
    integrity: "All packages verified",
    certificates: "Valid until 2027-06-26",
    versionDistribution: [
      { version: "1.0.0", percent: 92 },
      { version: "0.9.8", percent: 6 },
      { version: "0.9.5", percent: 2 },
    ],
    health: "Healthy",
  };
}

export function createDefaultMobileOriInsights(): MobileOriInsight[] {
  return [
    {
      id: "ori-1",
      category: "installation",
      title: "One-tap QR install ready",
      summary: "Dynamic QR tokens verified. Use QR install for fastest enterprise provisioning.",
      priority: "low",
    },
    {
      id: "ori-2",
      category: "compatibility",
      title: "iOS 17 devices eligible for update",
      summary: "Executive iPad on iOS 17.6 should update to v1.0.0 for full OMEGA GOLD support.",
      priority: "medium",
    },
    {
      id: "ori-3",
      category: "security",
      title: "Guardian Enterprise X active",
      summary: "All trusted devices pass integrity checks. 1 blocked device under review.",
      priority: "low",
    },
    {
      id: "ori-4",
      category: "recommendations",
      title: "Enable push notifications for critical updates",
      summary: "Configure OMEGA alerts for security and certificate expiry events.",
      priority: "medium",
    },
  ];
}
