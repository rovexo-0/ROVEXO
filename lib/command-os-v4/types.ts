export type CommandOsRootModuleId =
  | "experience-os"
  | "design-os"
  | "brand-os"
  | "commerce-os"
  | "marketplace-os"
  | "seller-os"
  | "buyer-os"
  | "business-os"
  | "wallet-os"
  | "payment-os"
  | "shipping-os"
  | "ai-os"
  | "automation-os"
  | "communication-os"
  | "analytics-os"
  | "security-os"
  | "infrastructure-os"
  | "release-os"
  | "developer-os"
  | "monitoring-os"
  | "certification-center"
  | "audit-center"
  | "backup-center"
  | "emergency-center"
  | "mission-control";

export type CommandOsModuleStatus = "live" | "beta" | "planned";

export type CommandOsRootModule = {
  id: CommandOsRootModuleId;
  label: string;
  description: string;
  icon: string;
  href: string;
  status: CommandOsModuleStatus;
  capabilities: readonly string[];
};

export type CommandOsHealthDimension = {
  id: string;
  label: string;
  score: number;
  status: "healthy" | "warning" | "critical";
  href?: string;
};

export type CommandOsDigitalTwinNode = {
  id: string;
  label: string;
  category: string;
  status: "healthy" | "warning" | "critical" | "idle";
  value?: string | number;
  href?: string;
};

export type CommandOsSearchResult = {
  id: string;
  label: string;
  category: string;
  href: string;
  snippet?: string;
};

export type CommandOsOneClickOperation = {
  id: string;
  label: string;
  description: string;
  action: string;
  icon: string;
  severity: "safe" | "elevated" | "critical";
};

export type CommandOsMissionMetric = {
  id: string;
  label: string;
  value: string | number;
  href?: string;
};

export type CommandOsSnapshot = {
  version: "enterprise-4.0.0";
  generatedAt: string;
  platformScore: number;
  platformStatus: "healthy" | "degraded" | "unhealthy";
  rootModules: CommandOsRootModule[];
  healthDimensions: CommandOsHealthDimension[];
  digitalTwin: CommandOsDigitalTwinNode[];
  missionMetrics: CommandOsMissionMetric[];
  oneClickOperations: CommandOsOneClickOperation[];
  certifications: {
    bringYourItem: "pass" | "pending";
    sendcloudProduction: "pass" | "pending";
    releaseGateOpen: boolean;
  };
};
