export type SecurityEngineModuleId =
  | "authentication"
  | "authorization"
  | "identity"
  | "roles"
  | "permissions"
  | "sessions"
  | "devices"
  | "login"
  | "security-center"
  | "threat"
  | "compliance"
  | "audit"
  | "recovery"
  | "backup";

export type SecurityEngineAuthMethodId =
  | "email"
  | "password"
  | "magic-link"
  | "otp"
  | "2fa"
  | "authenticator"
  | "backup-codes"
  | "passkeys"
  | "remember-device"
  | "trusted-device";

export type SecurityEngineRoleId =
  | "guest"
  | "buyer"
  | "seller"
  | "business"
  | "support"
  | "moderator"
  | "administrator"
  | "super-administrator"
  | "developer"
  | "system";

export type SecurityEngineAlertLevelId =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "information";

export type SecurityEngineThreatLevelId = "low" | "elevated" | "high" | "critical";

export type SecurityEngineModule = {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
};

export type SecurityEngineDeviceSummary = {
  id: string;
  platform: string;
  label: string;
  trusted: boolean;
  lastSeenAt?: string;
};

export type SecurityEngineSessionSummary = {
  id: string;
  provider: string;
  createdAt: string;
  lastSignInAt?: string | null;
  expiresAt?: string;
  current: boolean;
};

export type SecurityEngineDashboard = {
  securityScore: number;
  threatLevel: SecurityEngineThreatLevelId;
  mfaEnabled: boolean;
  activeSessions: number;
  registeredDevices: number;
  failedLogins24h: number;
  apiHealth: number;
  authenticationStatus: "protected" | "partial" | "at-risk";
};

export type SecurityEngineComplianceStatus = {
  gdprEnabled: boolean;
  ukGdprEnabled: boolean;
  cookieConsent: boolean;
  privacyCenter: boolean;
  dataExport: boolean;
  accountDeletion: boolean;
  rightToBeForgotten: boolean;
  consentManagement: boolean;
};

export type SecurityEngineAnalytics = {
  permissionRoutes: number;
  adminGatedRoutes: number;
  authGatedRoutes: number;
  fraudSignals: number;
  auditEvents: number;
  platformProtections: number;
};

export type SecurityEngineHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy?: string;
  label: string;
  bundle?: SecurityEngineDocument;
  rollbackAvailable: boolean;
};

export type SecurityEngineAuditEntry = {
  id: string;
  administrator: string;
  timestamp: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable: boolean;
};

export type SecurityEngineDocument = {
  version: number;
  updatedAt: string;
  label: string;
  marketplaceVersion: string;
  primaryCountry: string;
  currency: string;
  modules: { id: SecurityEngineModuleId; label: string; enabled: boolean }[];
  authMethods: { id: SecurityEngineAuthMethodId; label: string; enabled: boolean }[];
  roles: { id: SecurityEngineRoleId; label: string; enabled: boolean }[];
  alertLevels: { id: SecurityEngineAlertLevelId; label: string; enabled: boolean }[];
  platformSecurity: {
    csrfProtection: boolean;
    xssProtection: boolean;
    sqlInjectionProtection: boolean;
    fileUploadValidation: boolean;
    virusScanHooks: boolean;
    malwareScanHooks: boolean;
    secureHeaders: boolean;
    cspReady: boolean;
  };
  apiSecurity: {
    apiTokens: boolean;
    rateLimiting: boolean;
    requestValidation: boolean;
    jwtValidation: boolean;
    apiAudit: boolean;
    apiLogs: boolean;
    apiHealth: boolean;
  };
  fraudDetection: {
    suspiciousLogin: boolean;
    impossibleTravel: boolean;
    rapidRequests: boolean;
    abnormalPurchases: boolean;
    multipleDevices: boolean;
    accountTakeoverDetection: boolean;
    riskScoring: boolean;
  };
  compliance: SecurityEngineComplianceStatus;
  sessionPolicy: {
    autoLogout: boolean;
    idleTimeoutMinutes: number;
    sessionExpirationHours: number;
    terminateAllEnabled: boolean;
  };
  aiAssistant: {
    globalEnabled: boolean;
    threatDetection: boolean;
    fraudDetection: boolean;
    riskAnalysis: boolean;
    loginPatternAnalysis: boolean;
    securityRecommendations: boolean;
    anomalyDetection: boolean;
    execution: "local" | "cloud" | "hybrid";
  };
  integrations: {
    ordersEngine: boolean;
    shippingEngine: boolean;
    walletEngine: boolean;
    paymentsEngine: boolean;
    protectionEngine: boolean;
    messagesEngine: boolean;
    notificationsEngine: boolean;
    analyticsEngine: boolean;
    missionControl: boolean;
  };
  futureReady: string[];
  auditLog: SecurityEngineAuditEntry[];
};

export type SecurityEngineSnapshot = {
  scannedAt: string;
  modules: SecurityEngineModule[];
  draft: SecurityEngineDocument;
  live: SecurityEngineDocument;
  history: SecurityEngineHistoryEntry[];
};

export type SecurityEngineContext = {
  dashboard: SecurityEngineDashboard;
  role: string;
  devices: SecurityEngineDeviceSummary[];
  sessions: SecurityEngineSessionSummary[];
  compliance: SecurityEngineComplianceStatus;
};
