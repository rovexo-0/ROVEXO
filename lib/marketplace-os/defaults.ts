import { DEFAULT_MOS_THRESHOLDS, MOS_VERSION } from "@/lib/marketplace-os/config";
import type { MosDocument, MosHistoryEntry, MosRule } from "@/lib/marketplace-os/types";

const now = () => new Date().toISOString();

export const DEFAULT_MOS_RULES: MosRule[] = [
  {
    id: "rule-homepage-refresh",
    version: 1,
    name: "Homepage Refresh",
    description: "Refresh homepage blocks when marketplace health is operational.",
    enabled: true,
    priority: 100,
    dependencies: [],
    conditions: [{ field: "healthScore", operator: "gte", value: 45 }],
    thresholds: {},
    actions: [{ type: "revalidate", target: "homepage", payload: { paths: ["/"] } }],
    schedule: "every_15m",
    subsystem: "homepage",
  },
  {
    id: "rule-discovery-sync",
    version: 1,
    name: "Discovery Sync",
    description: "Synchronize discovery feeds with organic growth engine.",
    enabled: true,
    priority: 90,
    dependencies: ["rule-homepage-refresh"],
    conditions: [{ field: "inventoryStatus", operator: "neq", value: "critical" }],
    thresholds: {},
    actions: [{ type: "orchestrate", target: "discovery", payload: {} }],
    schedule: "every_15m",
    subsystem: "organic-growth",
  },
  {
    id: "rule-seo-priority",
    version: 1,
    name: "SEO Priority Update",
    description: "Update SEO crawl priorities when trends detected.",
    enabled: true,
    priority: 80,
    dependencies: [],
    conditions: [{ field: "growthStatus", operator: "neq", value: "declining" }],
    thresholds: {},
    actions: [{ type: "orchestrate", target: "seo", payload: {} }],
    subsystem: "seo",
  },
  {
    id: "rule-intelligence-eval",
    version: 1,
    name: "Intelligence Evaluation",
    description: "Run marketplace intelligence health evaluation.",
    enabled: true,
    priority: 85,
    dependencies: [],
    conditions: [],
    thresholds: {},
    actions: [{ type: "orchestrate", target: "intelligence", payload: {} }],
    subsystem: "marketplace-intelligence",
  },
  {
    id: "rule-low-inventory-alert",
    version: 1,
    name: "Low Inventory Alert",
    description: "Alert when category inventory falls below threshold.",
    enabled: true,
    priority: 70,
    dependencies: ["rule-intelligence-eval"],
    conditions: [{ field: "inventoryStatus", operator: "eq", value: "low" }],
    thresholds: { minInventory: 3 },
    actions: [{ type: "alert", target: "super-admin", payload: { severity: "warning" } }],
    subsystem: "marketplace-intelligence",
  },
  {
    id: "rule-search-recovery",
    version: 1,
    name: "Search Recovery",
    description: "Enable zero-result recovery when search quality drops.",
    enabled: true,
    priority: 75,
    dependencies: [],
    conditions: [{ field: "conversionStatus", operator: "eq", value: "warning" }],
    thresholds: {},
    actions: [{ type: "orchestrate", target: "search", payload: { recovery: true } }],
    subsystem: "search",
  },
];

export function createDefaultMosDocument(label = "ROVEXO MOS Live"): MosDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    thresholds: { ...DEFAULT_MOS_THRESHOLDS },
    rules: DEFAULT_MOS_RULES.map((rule) => ({ ...rule })),
    automationEnabled: true,
    auditEnabled: true,
    failsafeEnabled: true,
    auditLog: [],
  };
}

export function createDefaultMosHistory(): MosHistoryEntry[] {
  return [];
}

export { MOS_VERSION };
