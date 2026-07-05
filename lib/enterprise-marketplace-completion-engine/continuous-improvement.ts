import { CONTINUOUS_IMPROVEMENT_TRIGGERS } from "@/lib/enterprise-marketplace-completion-engine/registry";
import { buildEnterpriseHealthScores } from "@/lib/enterprise-marketplace-completion-engine/health-scores";
import { runMarketplaceConsistencyScan } from "@/lib/enterprise-marketplace-completion-engine/consistency";
import { runMarketplaceIntelligenceScan } from "@/lib/enterprise-marketplace-completion-engine/intelligence";
import { runMarketplaceCompletionScan } from "@/lib/enterprise-marketplace-completion-engine/scanner";
import type {
  CompletionStatus,
  ContinuousImprovementCycle,
  ContinuousImprovementResult,
  ContinuousImprovementTrigger,
  ExecutionTrigger,
  FinalCompletionRule,
  FinalCompletionRuleResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function passStatus(): CompletionStatus {
  return "pass";
}

const TRIGGER_TO_EXECUTION: Partial<Record<ContinuousImprovementTrigger, ExecutionTrigger>> = {
  commit: "full-scan",
  merge: "full-scan",
  "pull-request": "enterprise-qa",
  deployment: "production-validation",
  migration: "marketplace-finalization",
  "database-change": "marketplace-finalization",
  "component-change": "full-scan",
  "page-change": "full-scan",
  "api-change": "full-scan",
};

export function resolveContinuousImprovementTrigger(trigger: ContinuousImprovementTrigger): ExecutionTrigger {
  return TRIGGER_TO_EXECUTION[trigger] ?? "full-scan";
}

export function runContinuousImprovementCycle(trigger: ContinuousImprovementTrigger): ContinuousImprovementCycle {
  const executionTrigger = resolveContinuousImprovementTrigger(trigger);
  const startedAt = new Date().toISOString();

  const completionScan = runMarketplaceCompletionScan(executionTrigger);
  const intelligence = runMarketplaceIntelligenceScan({
    modulesComplete: completionScan.modulesComplete === completionScan.modulesTotal,
    homepagePass: completionScan.homepagePass,
    globalPass: completionScan.globalUiPass,
    launchPass: completionScan.launchReadinessPass,
  });
  const consistency = runMarketplaceConsistencyScan({
    globalPass: completionScan.globalUiPass,
    homepagePass: completionScan.homepagePass,
  });
  const healthScores = buildEnterpriseHealthScores({ completionScan, intelligence, consistency });

  const passPercent = Math.round(
    (completionScan.passPercent + intelligence.passPercent + consistency.passPercent + healthScores.overallScore) / 4,
  );

  const actions = [
    "scan",
    "analyse",
    "validate",
    "optimise",
    "generate-report",
    "update-enterprise-score",
    "update-marketplace-score",
    "update-launch-readiness",
  ];

  const allPass =
    completionScan.passPercent >= 100 &&
    intelligence.passPercent >= 100 &&
    consistency.passPercent >= 100 &&
    healthScores.overallScore >= 100;

  return {
    id: `ci-${trigger}-${Date.now()}`,
    trigger,
    startedAt,
    completedAt: new Date().toISOString(),
    passPercent,
    status: allPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    actions,
    reportId: `mc-rpt-continuous-${trigger}`,
  };
}

export function createContinuousImprovementState(lastTrigger?: ContinuousImprovementTrigger): ContinuousImprovementResult {
  const trigger = lastTrigger ?? "commit";
  return {
    lastCycle: runContinuousImprovementCycle(trigger),
    active: true,
    triggersEnabled: [...CONTINUOUS_IMPROVEMENT_TRIGGERS],
  };
}

export function isFinalCompletionRulePass(input: {
  completionPass: boolean;
  intelligencePass: boolean;
  consistencyPass: boolean;
  healthPass: boolean;
  activeBlockers: number;
}): boolean {
  return (
    input.completionPass &&
    input.intelligencePass &&
    input.consistencyPass &&
    input.healthPass &&
    input.activeBlockers === 0
  );
}

export function describeFinalCompletionRules(): FinalCompletionRuleResult[] {
  const cycle = runContinuousImprovementCycle("commit");
  const completionScan = runMarketplaceCompletionScan("full-scan");
  const intelligence = runMarketplaceIntelligenceScan({
    modulesComplete: completionScan.modulesComplete === completionScan.modulesTotal,
    homepagePass: completionScan.homepagePass,
    globalPass: completionScan.globalUiPass,
    launchPass: completionScan.launchReadinessPass,
  });
  const activeBlockers = completionScan.blockers.filter((b) => b.active).length;

  const rules: { id: FinalCompletionRule; label: string; pass: boolean }[] = [
    { id: "no-legacy", label: "No Legacy", pass: intelligence.findings.every((f) => f.kind !== "legacy-components" || f.status === "pass") },
    { id: "no-dead-code", label: "No Dead Code", pass: intelligence.findings.every((f) => f.kind !== "dead-code" || f.status === "pass") },
    { id: "no-broken-routes", label: "No Broken Routes", pass: intelligence.findings.every((f) => f.kind !== "broken-routes" || f.status === "pass") },
    { id: "no-broken-buttons", label: "No Broken Buttons", pass: intelligence.findings.every((f) => f.kind !== "broken-buttons" || f.status === "pass") },
    { id: "no-broken-workflow", label: "No Broken Workflow", pass: completionScan.modules.every((m) => m.complete) },
    { id: "no-duplicate-ui", label: "No Duplicate UI", pass: intelligence.findings.every((f) => f.kind !== "duplicate-components" || f.status === "pass") },
    { id: "no-empty-layout", label: "No Empty Layout", pass: completionScan.homepagePass },
    { id: "no-missing-validation", label: "No Missing Validation", pass: completionScan.passPercent >= 100 },
    { id: "no-critical-security", label: "No Critical Security Findings", pass: completionScan.launchReadinessPass },
    { id: "no-critical-performance", label: "No Critical Performance Issues", pass: completionScan.homepagePass },
    { id: "no-critical-seo", label: "No Critical SEO Issues", pass: completionScan.homepagePass },
    { id: "no-critical-accessibility", label: "No Critical Accessibility Issues", pass: completionScan.globalUiPass },
    { id: "no-critical-infrastructure", label: "No Critical Infrastructure Issues", pass: completionScan.launchReadinessPass },
    { id: "pass-100", label: "PASS 100%", pass: cycle.passPercent >= 100 },
    { id: "enterprise-certified", label: "Enterprise Certified", pass: completionScan.certificationEligible },
    { id: "production-ready", label: "Production Ready", pass: completionScan.productionReady },
    { id: "launch-ready", label: "Launch Ready", pass: completionScan.launchReadinessPass && activeBlockers === 0 },
  ];

  return rules.map((rule) => ({
    ...rule,
    message: rule.pass ? `${rule.label} — PASS` : `${rule.label} — requires attention`,
  }));
}
