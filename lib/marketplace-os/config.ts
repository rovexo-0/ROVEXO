/**
 * ROVEXO Marketplace Operating System (MOS) v1.0 — SSOT configuration.
 * Central orchestration layer. Deterministic rules only. No AI.
 */

export const MOS_VERSION = "1.0.0";
export const MOS_NAME = "ROVEXO Marketplace Operating System";

export type MosThresholds = {
  minInventory: number;
  minViews: number;
  minFavorites: number;
  minSales: number;
  minRating: number;
  maxInactivityDays: number;
  maxStockAgeDays: number;
  categoryLimit: number;
  homepageSlots: number;
  discoveryLimit: number;
  searchThreshold: number;
  minConversionRate: number;
  minTrustScore: number;
  alertSeverityThreshold: number;
  maxAutomationRetries: number;
  orchestrationIntervalMinutes: number;
};

export const DEFAULT_MOS_THRESHOLDS: MosThresholds = {
  minInventory: 3,
  minViews: 10,
  minFavorites: 2,
  minSales: 1,
  minRating: 3.5,
  maxInactivityDays: 30,
  maxStockAgeDays: 90,
  categoryLimit: 50,
  homepageSlots: 12,
  discoveryLimit: 24,
  searchThreshold: 5,
  minConversionRate: 0.01,
  minTrustScore: 50,
  alertSeverityThreshold: 60,
  maxAutomationRetries: 3,
  orchestrationIntervalMinutes: 15,
};

export type MosSubsystemId =
  | "seo"
  | "organic-growth"
  | "marketplace-intelligence"
  | "commerce"
  | "search"
  | "recommendations"
  | "shipping"
  | "wallet"
  | "trust"
  | "analytics"
  | "notifications"
  | "homepage";

export const MOS_SUBSYSTEMS: { id: MosSubsystemId; label: string }[] = [
  { id: "seo", label: "SEO Platform" },
  { id: "organic-growth", label: "Organic Growth Engine" },
  { id: "marketplace-intelligence", label: "Marketplace Intelligence" },
  { id: "commerce", label: "Commerce Engine" },
  { id: "search", label: "Search Engine" },
  { id: "recommendations", label: "Recommendation Engine" },
  { id: "shipping", label: "Shipping Engine" },
  { id: "wallet", label: "Wallet" },
  { id: "trust", label: "Trust & Safety" },
  { id: "analytics", label: "Analytics" },
  { id: "notifications", label: "Notification System" },
  { id: "homepage", label: "Homepage" },
];

export function resolveMosThresholds(overrides?: Partial<MosThresholds>): MosThresholds {
  return { ...DEFAULT_MOS_THRESHOLDS, ...overrides };
}

export function clampMosScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
