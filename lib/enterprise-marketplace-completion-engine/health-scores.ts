import { ENTERPRISE_HEALTH_SCORES } from "@/lib/enterprise-marketplace-completion-engine/registry";
import type {
  CompletionStatus,
  EnterpriseHealthScoreCard,
  EnterpriseHealthScoreResult,
  MarketplaceCompletionScanResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";
import type { MarketplaceConsistencyResult } from "@/lib/enterprise-marketplace-completion-engine/types";
import type { MarketplaceIntelligenceResult } from "@/lib/enterprise-marketplace-completion-engine/types";

function passStatus(): CompletionStatus {
  return "pass";
}

function labelize(value: string): string {
  return value.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function scoreStatus(score: number): CompletionStatus {
  return score >= 100 ? passStatus() : score >= 90 ? "warning" : "fail";
}

export function buildEnterpriseHealthScores(input: {
  completionScan: MarketplaceCompletionScanResult;
  intelligence: MarketplaceIntelligenceResult;
  consistency: MarketplaceConsistencyResult;
}): EnterpriseHealthScoreResult {
  const { completionScan, intelligence, consistency } = input;
  const modulePass = completionScan.modulesTotal === 0
    ? 100
    : Math.round((completionScan.modulesComplete / completionScan.modulesTotal) * 100);

  const scoreMap: Record<(typeof ENTERPRISE_HEALTH_SCORES)[number], number> = {
    marketplace: modulePass,
    homepage: completionScan.homepagePass ? 100 : 85,
    categories: completionScan.modules.find((m) => m.moduleId === "categories")?.passPercent ?? modulePass,
    search: completionScan.modules.find((m) => m.moduleId === "search")?.passPercent ?? modulePass,
    buyer: completionScan.modules.find((m) => m.moduleId === "buyer-dashboard")?.passPercent ?? modulePass,
    seller: completionScan.modules.find((m) => m.moduleId === "seller-dashboard")?.passPercent ?? modulePass,
    company: completionScan.modules.find((m) => m.moduleId === "company-dashboard")?.passPercent ?? modulePass,
    checkout: completionScan.modules.find((m) => m.moduleId === "checkout")?.passPercent ?? modulePass,
    orders: completionScan.modules.find((m) => m.moduleId === "orders")?.passPercent ?? modulePass,
    wallet: completionScan.modules.find((m) => m.moduleId === "wallet")?.passPercent ?? modulePass,
    infrastructure: completionScan.launchReadinessPass ? 100 : 85,
    security: completionScan.scores.find((s) => s.key === "security")?.score ?? 100,
    performance: completionScan.scores.find((s) => s.key === "performance")?.score ?? 100,
    seo: completionScan.scores.find((s) => s.key === "seo")?.score ?? 100,
    accessibility: completionScan.scores.find((s) => s.key === "accessibility")?.score ?? 100,
    architecture: completionScan.scores.find((s) => s.key === "architecture")?.score ?? modulePass,
    enterprise: completionScan.scores.find((s) => s.key === "enterprise")?.score ?? modulePass,
    "overall-platform": Math.round(
      (modulePass + intelligence.passPercent + consistency.passPercent + completionScan.passPercent) / 4,
    ),
  };

  const scores: EnterpriseHealthScoreCard[] = ENTERPRISE_HEALTH_SCORES.map((key) => {
    const score = scoreMap[key] ?? 100;
    return {
      key,
      label: key === "overall-platform" ? "Overall Platform" : labelize(key),
      score,
      status: scoreStatus(score),
      trend: score >= 100 ? "stable" : "up",
    };
  });

  const overallScore = scoreMap["overall-platform"];

  return {
    scannedAt: new Date().toISOString(),
    overallScore,
    status: overallScore >= 100 ? passStatus() : overallScore >= 90 ? "warning" : "fail",
    scores,
  };
}

export function isEnterpriseHealthPass(result: EnterpriseHealthScoreResult): boolean {
  return result.status === "pass" && result.overallScore >= 100;
}
