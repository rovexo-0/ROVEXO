import {
  SECURITY_ENGINE_ALERT_LEVELS,
  SECURITY_ENGINE_AUTH_METHODS,
  SECURITY_ENGINE_MODULE_IDS,
  SECURITY_ENGINE_ROLES,
} from "@/lib/security-engine/registry";
import type { SecurityEngineDocument, SecurityEngineHistoryEntry } from "@/lib/security-engine/types";

const now = () => new Date().toISOString();

export function createDefaultSecurityEngineDocument(label = "ROVEXO Security Engine"): SecurityEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    modules: SECURITY_ENGINE_MODULE_IDS.map((m) => ({ ...m, enabled: true })),
    authMethods: SECURITY_ENGINE_AUTH_METHODS.map((m) => ({
      ...m,
      enabled: m.id !== "passkeys",
    })),
    roles: SECURITY_ENGINE_ROLES.map((r) => ({ ...r, enabled: true })),
    alertLevels: SECURITY_ENGINE_ALERT_LEVELS.map((a) => ({ ...a, enabled: true })),
    platformSecurity: {
      csrfProtection: true,
      xssProtection: true,
      sqlInjectionProtection: true,
      fileUploadValidation: true,
      virusScanHooks: true,
      malwareScanHooks: true,
      secureHeaders: true,
      cspReady: true,
    },
    apiSecurity: {
      apiTokens: true,
      rateLimiting: true,
      requestValidation: true,
      jwtValidation: true,
      apiAudit: true,
      apiLogs: true,
      apiHealth: true,
    },
    fraudDetection: {
      suspiciousLogin: true,
      impossibleTravel: true,
      rapidRequests: true,
      abnormalPurchases: true,
      multipleDevices: true,
      accountTakeoverDetection: true,
      riskScoring: true,
    },
    compliance: {
      gdprEnabled: true,
      ukGdprEnabled: true,
      cookieConsent: true,
      privacyCenter: true,
      dataExport: true,
      accountDeletion: true,
      rightToBeForgotten: true,
      consentManagement: true,
    },
    sessionPolicy: {
      autoLogout: true,
      idleTimeoutMinutes: 60,
      sessionExpirationHours: 168,
      terminateAllEnabled: true,
    },
    aiAssistant: {
      globalEnabled: false,
      threatDetection: true,
      fraudDetection: true,
      riskAnalysis: true,
      loginPatternAnalysis: true,
      securityRecommendations: true,
      anomalyDetection: true,
      execution: "local",
    },
    integrations: {
      ordersEngine: true,
      shippingEngine: true,
      walletEngine: true,
      paymentsEngine: true,
      protectionEngine: true,
      messagesEngine: true,
      notificationsEngine: true,
      analyticsEngine: true,
      missionControl: true,
    },
    futureReady: [
      "Biometric Login",
      "Hardware Security Keys",
      "Enterprise SSO",
      "OAuth Providers",
      "SAML",
      "SCIM",
      "Identity Federation",
      "Advanced Threat Detection",
      "Behavior Analytics",
    ],
    auditLog: [],
  };
}

export function createDefaultSecurityEngineHistory(): SecurityEngineHistoryEntry[] {
  return [];
}
