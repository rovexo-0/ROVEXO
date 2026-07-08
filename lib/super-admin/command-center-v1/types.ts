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

export type CommandCenterServiceState = "online" | "warning" | "error" | "live";

export type CommandCenterServiceStatus = {
  id: string;
  label: string;
  state: CommandCenterServiceState;
  statusLabel: string;
  detail: string;
  href: string;
};

export type CommandCenterAdminIdentity = {
  name: string;
  email: string;
  initials: string;
  roleLabel: string;
  avatarUrl: string | null;
};

export type CommandCenterDeviceRow = {
  id: string;
  label: string;
  value: number;
  percentage: number;
};

export type CommandCenterCategoryRow = {
  id: string;
  name: string;
  listings: number;
  sold: number;
  revenue: number;
};

export type CommandCenterKpiCard = {
  id: string;
  label: string;
  value: number;
  format: "number" | "currency" | "percent";
  delta: number;
  deltaLabel: string;
  tone: "blue" | "purple" | "green" | "orange" | "indigo" | "pink" | "teal";
  sparkline: number[];
};

export type CommandCenterSystemHealthRow = {
  id: string;
  label: string;
  status: CommandCenterServiceState;
  statusLabel: string;
};

export type CommandCenterSecurityMetric = {
  id: string;
  label: string;
  value: number | string;
  sparkline: number[];
};

export type CommandCenterPaymentSegment = {
  id: string;
  label: string;
  value: number;
  tone: "success" | "warning" | "danger" | "info";
};

export type CommandCenterOrderSegment = {
  id: string;
  label: string;
  value: number;
  tone: "success" | "info" | "warning" | "danger";
};

export type CommandCenterShippingStat = {
  id: string;
  label: string;
  value: number;
  tone: CommandCenterServiceState;
};

export type CommandCenterBottomStat = {
  id: string;
  label: string;
  value: number;
  format: "number" | "currency";
  delta: number;
};

export type CommandCenterV2Extensions = {
  services: CommandCenterServiceStatus[];
  kpis: CommandCenterKpiCard[];
  devices: CommandCenterDeviceRow[];
  categories: CommandCenterCategoryRow[];
  systemHealth: CommandCenterSystemHealthRow[];
  security: CommandCenterSecurityMetric[];
  traffic: {
    visitors: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    visitorSparkline: number[];
    sessionSparkline: number[];
  };
  payments: {
    total: number;
    segments: CommandCenterPaymentSegment[];
  };
  orders: {
    segments: CommandCenterOrderSegment[];
    timeline: number[];
  };
  shipping: {
    connected: boolean;
    statusLabel: string;
    stats: CommandCenterShippingStat[];
  };
  disputes: {
    open: number;
    resolved: number;
    refunded: number;
    pending: number;
    openSparkline: number[];
    resolvedSparkline: number[];
  };
  sales: {
    total: number;
    orders: number;
    avgOrderValue: number;
    itemsSold: number;
    timeline: number[];
  };
  bottomBar: CommandCenterBottomStat[];
  liveMessages: number;
  verifiedBusinesses: number;
  totalReviews: number;
  admin: CommandCenterAdminIdentity;
};

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
  v2: CommandCenterV2Extensions;
};
