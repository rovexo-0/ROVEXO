export type DeviceLifecycleTrustLevel = "green" | "yellow" | "red";

export type DeviceLifecycleTrustStatus = "trusted" | "pending" | "blocked" | "revoked";

export type DeviceLifecycleRegistration = {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  manufacturer: string;
  operatingSystem: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  installationDate: string;
  lastLogin: string;
  lastSync: string;
  pushToken: string;
  timezone: string;
  language: string;
};

export type DeviceTrustScore = {
  score: number;
  level: DeviceLifecycleTrustLevel;
  authenticationHealth: number;
  securityStatus: number;
  rootJailbreakDetected: boolean;
  appIntegrity: number;
  certificateValidation: boolean;
  updateStatus: string;
  lastScan: string;
  riskEvents: number;
};

export type DeviceHealthMetrics = {
  battery: number;
  storage: number;
  memory: number;
  cpuUsage: number;
  appPerformance: string;
  backgroundTasks: number;
  crashStatus: string;
  connectivity: string;
  pushNotifications: boolean;
  healthScore: number;
};

export type DeviceSecurityStatus = {
  encrypted: boolean;
  signatureVerified: boolean;
  certificateValid: boolean;
  guardianProtected: boolean;
  sentinelProtected: boolean;
  omegaVerified: boolean;
  antivirusProtected: boolean;
  secureConnection: boolean;
  vpnDetected: boolean;
  developerMode: boolean;
};

export type DeviceTamperDetection = {
  root: boolean;
  jailbreak: boolean;
  modifiedOs: boolean;
  debugMode: boolean;
  emulator: boolean;
  fakeGps: boolean;
  hookingFrameworks: boolean;
  tamperedApp: boolean;
  detected: boolean;
};

export type DeviceCertification = {
  omegaVerified: boolean;
  guardianVerified: boolean;
  sentinelVerified: boolean;
  antivirusVerified: boolean;
  trustVerified: boolean;
  certificateStatus: string;
};

export type DeviceLifecycleRecord = {
  id: string;
  platform: "ios" | "android";
  country: string;
  ip: string;
  trustStatus: DeviceLifecycleTrustStatus;
  locked: boolean;
  registration: DeviceLifecycleRegistration;
  trust: DeviceTrustScore;
  health: DeviceHealthMetrics;
  security: DeviceSecurityStatus;
  tamper: DeviceTamperDetection;
  certification: DeviceCertification;
};

export type DeviceLifecycleDashboard = {
  registeredDevices: number;
  trustedDevices: number;
  blockedDevices: number;
  pendingApproval: number;
  averageTrustScore: number;
  averageHealthScore: number;
  lastLogin: string;
  latestVersionPercent: number;
  securityIncidents: number;
};

export type DeviceLifecycleAlert = {
  id: string;
  type:
    | "unknown-device"
    | "root-detected"
    | "jailbreak-detected"
    | "biometric-failure"
    | "certificate-expired"
    | "app-outdated"
    | "high-risk-login"
    | "device-offline"
    | "tamper-detected";
  title: string;
  message: string;
  deviceId?: string;
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  resolved: boolean;
};

export type DeviceHistoryEvent = {
  id: string;
  deviceId: string;
  category: "login" | "location" | "change" | "version" | "security" | "authentication" | "update";
  title: string;
  detail: string;
  timestamp: string;
};

export type DeviceLogEntry = {
  id: string;
  deviceId: string;
  level: "info" | "warning" | "error" | "critical";
  source: string;
  message: string;
  timestamp: string;
};

export type DeviceOriInsight = {
  id: string;
  deviceId?: string;
  question: string;
  answer: string;
  recommendation: string;
  riskPrediction: string;
};

export type DeviceLifecycleSettings = {
  autoRegister: boolean;
  requireMfa: boolean;
  requireBiometricForEmergency: boolean;
  requireBiometricForRelease: boolean;
  requireBiometricForRoleChange: boolean;
  requireBiometricForUserDelete: boolean;
  requireBiometricForSecuritySettings: boolean;
  requireBiometricForCertification: boolean;
  lockOnTamper: boolean;
  notifyOmegaOnTamper: boolean;
  notifySentinelOnTamper: boolean;
  continuousMonitoring: boolean;
};

export type DeviceLifecycleIntegrations = {
  omega: boolean;
  guardianEnterpriseX: boolean;
  sentinelX: boolean;
  antivirusEngineX: boolean;
  ori: boolean;
  infrastructureEngine: boolean;
  disasterRecoveryEngine: boolean;
  complianceCenter: boolean;
  certificationCenter: boolean;
};

export type DeviceRemoteAction =
  | "remote-logout"
  | "remote-lock"
  | "force-update"
  | "revoke"
  | "remove"
  | "rename"
  | "clear-cache"
  | "reset-biometric"
  | "invalidate-sessions"
  | "generate-report"
  | "trust";

export type DeviceLifecycleEngineSnapshot = {
  scannedAt: string;
  dashboard: DeviceLifecycleDashboard;
  devices: DeviceLifecycleRecord[];
  alerts: DeviceLifecycleAlert[];
  history: DeviceHistoryEvent[];
  logs: DeviceLogEntry[];
  oriInsights: DeviceOriInsight[];
  settings: DeviceLifecycleSettings;
  integrations: DeviceLifecycleIntegrations;
  latestAppVersion: string;
};
