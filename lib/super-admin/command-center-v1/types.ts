export type CommandCenterMetricTone =
  | "healthy"
  | "info"
  | "warning"
  | "critical"
  | "analytics"
  | "marketplace";

export type CommandCenterMetricFormat = "number" | "currency" | "percent" | "status" | "duration" | "text";

export type CommandCenterMetric = {
  id: string;
  label: string;
  value: string | number;
  format?: CommandCenterMetricFormat;
  tone?: CommandCenterMetricTone;
  href?: string;
  delta?: number;
};

export type CommandCenterSection = {
  id: string;
  title: string;
  subtitle?: string;
  metrics: CommandCenterMetric[];
};

export type CommandCenterChartSeries = {
  id: string;
  label: string;
  points: number[];
  tone: CommandCenterMetricTone;
};

export type CommandCenterActivityEvent = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  tone: CommandCenterMetricTone;
};

export type CommandCenterNotification = {
  id: string;
  title: string;
  message: string;
  tone: "critical" | "warning" | "info";
  timestamp: string;
  href?: string;
};

export type CommandCenterQuickAction = {
  id: string;
  label: string;
  href: string;
  icon: string;
};

export type CommandCenterCountryMarker = {
  code: string;
  name: string;
  flag: string;
  activeUsers: number;
  percentage: number;
};

import type { NocCriticalAlert, NocHealthCard } from "@/lib/super-admin/noc-v1/types";

export type CommandCenterV1Snapshot = {
  generatedAt: string;
  platformStatus: "healthy" | "degraded" | "unhealthy";
  healthCards: NocHealthCard[];
  criticalAlerts: NocCriticalAlert[];
  sections: CommandCenterSection[];
  charts: CommandCenterChartSeries[];
  countries: CommandCenterCountryMarker[];
  activityFeed: CommandCenterActivityEvent[];
  notifications: CommandCenterNotification[];
  quickActions: CommandCenterQuickAction[];
};
