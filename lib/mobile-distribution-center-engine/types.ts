export type MobileDistributionLanguage = "en" | "ro";

export type MobileInstallStatus =
  | "already-installed"
  | "latest-version"
  | "outdated"
  | "update-available"
  | "installation-pending"
  | "verification-pending";

export type MobileLiveStatus = "installed" | "latest-version" | "update-available" | "compromised" | "offline";

export type MobileDeviceTrustStatus = "trusted" | "pending" | "untrusted" | "revoked" | "blocked";

export type MobileVersionChannel = "stable" | "beta";

export type MobileDistributionEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  appInfo: {
    currentVersion: string;
    latestVersion: string;
    stableVersion: string;
    betaVersion: string;
    build: string;
    releaseDate: string;
    fileSizeIos: string;
    fileSizeAndroid: string;
    minimumIos: string;
    minimumAndroid: string;
    architecture: string;
    digitalSignature: string;
    checksum: string;
    certification: string;
  };
  downloadLinks: {
    ios: string;
    android: string;
    latest: string;
    releaseNotes: string;
    installationGuide: string;
    previousVersions: string;
  };
  language: MobileDistributionLanguage;
  biometric: {
    faceId: boolean;
    touchId: boolean;
    androidBiometrics: boolean;
    requireForEmergency: boolean;
    requireForRelease: boolean;
    requireForUserDelete: boolean;
    requireForPermissions: boolean;
    requireForCertification: boolean;
    requireForOmegaControls: boolean;
  };
  security: {
    faceIdReady: boolean;
    touchIdReady: boolean;
    androidBiometricsReady: boolean;
    mfaEnabled: boolean;
    deviceVerification: boolean;
    encryptedConnection: boolean;
    trustedDevice: boolean;
    omegaVerified: boolean;
    guardianProtected: boolean;
    sentinelProtected: boolean;
    rovexoTrust: boolean;
  };
  integrations: {
    omega: boolean;
    guardianEnterpriseX: boolean;
    sentinelX: boolean;
    antivirusEngineX: boolean;
    ori: boolean;
    infrastructureEngine: boolean;
    disasterRecoveryEngine: boolean;
    complianceCenter: boolean;
    certificationCenter: boolean;
    operationsCenter: boolean;
    recoveryCenter: boolean;
    auditCenter: boolean;
  };
  futureReady: string[];
  auditLog: MobileDistributionAuditEntry[];
};

export type MobileDistributionAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type MobileDistributionEngineHistoryEntry = {
  id: string;
  version: string;
  publishedAt: string;
  publishedBy: string;
  summary: string;
};

export type MobileRegisteredDevice = {
  id: string;
  name: string;
  model: string;
  osVersion: string;
  platform: "ios" | "android";
  lastLogin: string;
  country: string;
  ip: string;
  trustStatus: MobileDeviceTrustStatus;
  liveStatus: MobileLiveStatus;
  appVersion: string;
  trustScore: number;
  isActive: boolean;
  registeredAt: string;
};

export type MobileQrInstallPayload = {
  version: string;
  versionId: string;
  deviceType: "ios" | "android" | "universal";
  installationLink: string;
  installationToken: string;
  securitySignature: string;
  expiration: string;
  verification: string;
  oneTapUrl: string;
};

export type MobileDeviceStats = {
  registered: number;
  active: number;
  inactive: number;
  trusted: number;
  pending: number;
  blocked: number;
};

export type MobileDistributionAnalytics = {
  totalDownloads: number;
  downloadsToday: number;
  downloadsThisMonth: number;
  activeDevices: number;
  latestVersionPercent: number;
  installSuccessRate: number;
  updateRate: number;
  crashRate: number;
  countryDistribution: { country: string; count: number; percent: number }[];
  platformDistribution: { platform: string; count: number; percent: number }[];
  dailyInstalls: number;
  monthlyInstalls: number;
};

export type MobileSecurityCenter = {
  encryption: string;
  digitalSignature: string;
  packageIntegrity: string;
  certificateStatus: string;
  trustedDevice: boolean;
  riskScore: number;
  guardianStatus: string;
  sentinelStatus: string;
  antivirusStatus: string;
  omegaStatus: string;
};

export type MobileVersionRelease = {
  id: string;
  version: string;
  channel: MobileVersionChannel;
  build: string;
  releaseDate: string;
  downloadSize: string;
  checksum: string;
  signature: string;
  rollbackAvailable: boolean;
};

export type MobileVersionCenter = {
  currentVersion: string;
  latestVersion: string;
  stableVersion: string;
  betaVersion: string;
  rollbackAvailable: boolean;
  releases: MobileVersionRelease[];
};

export type MobileComplianceStatus = {
  rovexoTrust: boolean;
  omegaGold: boolean;
  guardian: boolean;
  sentinel: boolean;
  antivirus: boolean;
  enterpriseCompliance: boolean;
  isoReadiness: string;
  cyberEssentials: string;
  soc2Readiness: string;
  pciReadiness: string;
  gdpr: string;
};

export type MobileDistributionNotification = {
  id: string;
  type: "new-version" | "critical-update" | "security-alert" | "expired-device" | "certificate-expired" | "update-required";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  read: boolean;
};

export type MobileOmegaMetrics = {
  downloads: number;
  updates: number;
  installations: number;
  activeDevices: number;
  inactiveDevices: number;
  crashes: number;
  performance: string;
  security: string;
  integrity: string;
  certificates: string;
  versionDistribution: { version: string; percent: number }[];
  health: string;
};

export type MobileOriInsight = {
  id: string;
  category: "installation" | "compatibility" | "device-health" | "security" | "updates" | "recommendations";
  title: string;
  summary: string;
  priority: "low" | "medium" | "high";
};

export type MobileOriAssistant = {
  healthScore: number;
  deviceAnalysis: string;
  insights: MobileOriInsight[];
};

export type MobileDistributionEngineSnapshot = {
  scannedAt: string;
  appInfo: MobileDistributionEngineDocument["appInfo"];
  downloadLinks: MobileDistributionEngineDocument["downloadLinks"];
  installStatus: MobileInstallStatus;
  liveStatus: MobileLiveStatus;
  security: MobileDistributionEngineDocument["security"];
  securityCenter: MobileSecurityCenter;
  biometric: MobileDistributionEngineDocument["biometric"];
  language: MobileDistributionLanguage;
  languageSync: string;
  supportedLanguages: { id: MobileDistributionLanguage; label: string; flag: string; ready: boolean }[];
  qrInstall: MobileQrInstallPayload;
  qrValid: boolean;
  signatureValid: boolean;
  deviceStats: MobileDeviceStats;
  devices: MobileRegisteredDevice[];
  versionCenter: MobileVersionCenter;
  analytics: MobileDistributionAnalytics;
  compliance: MobileComplianceStatus;
  notifications: MobileDistributionNotification[];
  omega: MobileOmegaMetrics;
  ori: MobileOriAssistant;
  integrations: MobileDistributionEngineDocument["integrations"];
  draft: MobileDistributionEngineDocument;
  live: MobileDistributionEngineDocument;
  configHistory: MobileDistributionEngineHistoryEntry[];
};
