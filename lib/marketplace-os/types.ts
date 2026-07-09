import type { MosThresholds, MosSubsystemId } from "@/lib/marketplace-os/config";

export type { MosSubsystemId };

export type RuleCondition = {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains";
  value: string | number | boolean;
};

export type RuleAction = {
  type: string;
  target: string;
  payload?: Record<string, unknown>;
};

export type MosRule = {
  id: string;
  version: number;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  dependencies: string[];
  conditions: RuleCondition[];
  thresholds: Partial<MosThresholds>;
  actions: RuleAction[];
  schedule?: string;
  subsystem?: MosSubsystemId;
};

export type RuleExecutionResult = {
  ruleId: string;
  ruleVersion: number;
  matched: boolean;
  actionsExecuted: RuleAction[];
  reason: string;
  skippedDueToDependency?: boolean;
};

export type MarketplaceState = {
  status: "operational" | "degraded" | "critical";
  healthScore: number;
  balanceScore: number;
  inventoryStatus: "healthy" | "low" | "critical";
  growthStatus: "growing" | "stable" | "declining";
  trafficStatus: "high" | "normal" | "low";
  conversionStatus: "healthy" | "warning" | "critical";
  sellerActivityScore: number;
  buyerActivityScore: number;
  trustScore: number;
  evaluatedAt: string;
};

export type PriorityAssignment = {
  entityType: "category" | "product" | "store" | "brand" | "collection" | "location" | "campaign" | "event";
  entityId: string;
  label: string;
  href: string;
  priority: number;
  reason: string;
};

export type BalanceReport = {
  oversupplied: { label: string; supply: number; threshold: number }[];
  undersupplied: { label: string; supply: number; demand: number }[];
  growingMarkets: { label: string; growthRate: number }[];
  decliningMarkets: { label: string; declineRate: number }[];
  locationImbalance: { label: string; gap: number }[];
};

export type MarketplaceEvent = {
  id: string;
  type:
    | "inventory_spike"
    | "sales_spike"
    | "traffic_spike"
    | "search_spike"
    | "demand_spike"
    | "supply_shortage"
    | "category_growth"
    | "store_growth"
    | "brand_growth"
    | "product_growth";
  label: string;
  severity: "info" | "warning" | "critical";
  detectedAt: string;
  metric?: number;
  actionsTriggered: string[];
};

export type MosAlert = {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  ruleId: string;
  ruleVersion: number;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  reason: string;
  previousState?: string;
  newState?: string;
  rollbackAvailable: boolean;
};

export type OrchestrationResult = {
  executedAt: string;
  subsystemsCoordinated: MosSubsystemId[];
  homepageUpdated: boolean;
  discoveryUpdated: boolean;
  searchUpdated: boolean;
  seoUpdated: boolean;
  intelligenceUpdated: boolean;
  organicGrowthUpdated: boolean;
  surfacesRevalidated: string[];
  rulesExecuted: number;
  eventsDetected: number;
  alertsGenerated: number;
  auditEntries: number;
  status: "completed" | "partial" | "blocked";
};

export type MosDocument = {
  version: number;
  updatedAt: string;
  label: string;
  thresholds: MosThresholds;
  rules: MosRule[];
  automationEnabled: boolean;
  auditEnabled: boolean;
  failsafeEnabled: boolean;
  auditLog: AuditLogEntry[];
};

export type MosControlCenterSnapshot = {
  engineVersion: string;
  scannedAt: string;
  document: MosDocument;
  marketplaceState: MarketplaceState;
  orchestration: OrchestrationResult | null;
  activeRules: MosRule[];
  recentDecisions: AuditLogEntry[];
  alerts: MosAlert[];
  opportunities: { title: string; priority: string }[];
  automationQueue: { id: string; name: string; status: string; priority: number }[];
  performance: { orchestrationMs: number; subsystemsOnline: number };
};

export type MosHistoryEntry = {
  id: string;
  publishedAt: string;
  publishedBy: string;
  label: string;
  bundle: MosDocument;
  rollbackAvailable: boolean;
};
