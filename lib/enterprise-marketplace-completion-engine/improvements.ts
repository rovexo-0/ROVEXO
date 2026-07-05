import { SMART_IMPROVEMENT_CATEGORIES } from "@/lib/enterprise-marketplace-completion-engine/registry";
import { labelize, passStatus, premiumStylesActive } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type { CompletionStatus } from "@/lib/enterprise-marketplace-completion-engine/types";

export type SmartImprovementItem = {
  id: string;
  category: (typeof SMART_IMPROVEMENT_CATEGORIES)[number];
  label: string;
  priority: "low" | "medium" | "high";
  recommendation: string;
  impact: string;
};

export type SmartImprovementResult = {
  scannedAt: string;
  passPercent: number;
  status: CompletionStatus;
  items: SmartImprovementItem[];
};

export function runSmartImprovementEngine(input: {
  modulesComplete: boolean;
  homepagePass: boolean;
  globalPass: boolean;
  launchPass: boolean;
}): SmartImprovementResult {
  const allPass = input.modulesComplete && input.homepagePass && input.globalPass && input.launchPass && premiumStylesActive();

  const items: SmartImprovementItem[] = SMART_IMPROVEMENT_CATEGORIES.map((category) => ({
    id: `improvement-${category}`,
    category,
    label: labelize(category),
    priority: allPass ? "low" : "medium",
    recommendation: allPass
      ? `${labelize(category)} — maintain world-class standard`
      : `${labelize(category)} — review and optimise for Premium 2026`,
    impact: allPass ? "Platform at world-class marketplace standard" : "Improvement opportunity identified",
  }));

  const optimized = items.filter((i) => i.priority === "low").length;
  const passPercent = Math.round((optimized / items.length) * 10000) / 100;

  return {
    scannedAt: new Date().toISOString(),
    passPercent,
    status: passPercent >= 100 ? passStatus() : "warning",
    items,
  };
}
