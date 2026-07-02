export type OmegaReadyTier = "enterprise" | "platform" | "operations";

export type OmegaReadyPage = {
  id: string;
  href: string;
  label: string;
  moduleId: string;
  tier: OmegaReadyTier;
  score?: number;
};

export type SuperAdminBreadcrumb = {
  label: string;
  href?: string;
};

export type PremiumHealthStatus = "healthy" | "warning" | "critical" | "info";

export type PremiumKpiCard = {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  status?: PremiumHealthStatus;
};

export type PremiumActivityItem = {
  id: string;
  action: string;
  actor: string;
  target?: string;
  timestamp: string;
};

export type PremiumAlert = {
  id: string;
  message: string;
  level: "info" | "warning" | "critical";
};

export type PageReadinessResult = {
  ready: boolean;
  score: number;
  checks: string[];
  omegaReady: boolean;
};
