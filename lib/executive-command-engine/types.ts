import type { OmegaCertificationResult } from "@/lib/omega-enterprise-mobile-engine/types";

export type ExecutiveLiveMetric = {
  label: string;
  value: number | string | null;
  available: boolean;
  display: string;
  unit?: string;
};

export type ExecutivePlatformHealth = {
  overall: ExecutiveLiveMetric;
  marketplace: ExecutiveLiveMetric;
  wallet: ExecutiveLiveMetric;
  payments: ExecutiveLiveMetric;
  identity: ExecutiveLiveMetric;
  api: ExecutiveLiveMetric;
  database: ExecutiveLiveMetric;
  infrastructure: ExecutiveLiveMetric;
  communication: ExecutiveLiveMetric;
};

export type ExecutiveIncidentSummary = {
  critical: ExecutiveLiveMetric;
  highPriority: ExecutiveLiveMetric;
  warnings: ExecutiveLiveMetric;
  resolvedToday: ExecutiveLiveMetric;
  openIncidents: ExecutiveLiveMetric;
};

export type ExecutiveIncident = {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "warning";
  status: string;
  time: string;
  module: string;
  title: string;
  recommendedAction: string;
  source: "operations" | "omega" | "platform-error";
};

export type ExecutiveInfrastructure = {
  cpu: ExecutiveLiveMetric;
  ram: ExecutiveLiveMetric;
  storage: ExecutiveLiveMetric;
  bandwidth: ExecutiveLiveMetric;
  latency: ExecutiveLiveMetric;
  backgroundJobs: ExecutiveLiveMetric;
  databaseConnections: ExecutiveLiveMetric;
  serverAvailability: ExecutiveLiveMetric;
  estimatedCapacity: ExecutiveLiveMetric;
};

export type ExecutiveBusinessOverview = {
  dailyRevenue: ExecutiveLiveMetric;
  transactions24h: ExecutiveLiveMetric;
  orders: ExecutiveLiveMetric;
  completedOrders: ExecutiveLiveMetric;
  pendingOrders: ExecutiveLiveMetric;
  buyerProtectionRevenue: ExecutiveLiveMetric;
  walletActivity: ExecutiveLiveMetric;
  refundActivity: ExecutiveLiveMetric;
};

export type ExecutiveCertificationItem = {
  id: string;
  label: string;
  status: OmegaCertificationResult | "unavailable";
  detail: string;
};

export type ExecutiveSecurityOverview = {
  threatLevel: ExecutiveLiveMetric;
  blockedAttacks: ExecutiveLiveMetric;
  failedLogins: ExecutiveLiveMetric;
  deviceTrust: ExecutiveLiveMetric;
  certificateStatus: ExecutiveLiveMetric;
  encryptionStatus: ExecutiveLiveMetric;
  guardianStatus: ExecutiveLiveMetric;
  sentinelStatus: ExecutiveLiveMetric;
};

export type ExecutivePerformance = {
  apiResponseTime: ExecutiveLiveMetric;
  databaseSpeed: ExecutiveLiveMetric;
  cacheStatus: ExecutiveLiveMetric;
  performanceScore: ExecutiveLiveMetric;
  currentLoad: ExecutiveLiveMetric;
  systemAvailability: ExecutiveLiveMetric;
  trend: { label: string; value: number | null; available: boolean }[];
};

export type ExecutiveOriRecommendation = {
  id: string;
  priority: 1 | 2 | 3;
  title: string;
  recommendedActions: string;
  estimatedImpact: string;
  estimatedRisk: string;
  expectedImprovement: string;
  dataNote?: string;
};

export type ExecutiveExportRecord = {
  id: string;
  label: string;
  format: "pdf" | "csv" | "xlsx";
  generatedAt: string;
};

export type ExecutiveCommandSnapshot = {
  scannedAt: string;
  summary: string;
  dataSourcesAvailable: string[];
  dataSourcesUnavailable: string[];
  platformHealth: ExecutivePlatformHealth;
  incidentSummary: ExecutiveIncidentSummary;
  incidents: ExecutiveIncident[];
  infrastructure: ExecutiveInfrastructure;
  business: ExecutiveBusinessOverview;
  certifications: ExecutiveCertificationItem[];
  security: ExecutiveSecurityOverview;
  performance: ExecutivePerformance;
  oriRecommendations: ExecutiveOriRecommendation[];
  exports: ExecutiveExportRecord[];
};
