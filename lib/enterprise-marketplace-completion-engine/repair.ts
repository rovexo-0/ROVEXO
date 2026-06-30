import type { MarketplaceCompletionScanResult } from "@/lib/enterprise-marketplace-completion-engine/types";
import type { CompletionRepairAction } from "@/lib/enterprise-marketplace-completion-engine/types";
import { AUTONOMOUS_SAFE_REPAIR_ACTIONS } from "@/lib/enterprise-marketplace-completion-engine/registry";
import { labelize } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";

export function planMarketplaceCompletionRepairs(scan: MarketplaceCompletionScanResult): CompletionRepairAction[] {
  if (scan.certificationEligible) {
    return [{
      id: "repair-none",
      action: "noop",
      target: "marketplace",
      safe: true,
      requiresApproval: false,
      status: "pass",
      message: "No repairs required — Marketplace Completion PASS 100%",
    }];
  }

  const actions: CompletionRepairAction[] = [];
  for (const enterpriseModule of scan.modules.filter((m) => !m.complete)) {
    actions.push({
      id: `repair-module-${enterpriseModule.moduleId}`,
      action: "complete-module",
      target: enterpriseModule.pageRef,
      safe: true,
      requiresApproval: false,
      status: "pending",
      message: enterpriseModule.message,
    });
  }
  for (const check of scan.checks.filter((c) => c.status === "fail" && c.category === "ui-integrity")) {
    actions.push({
      id: `repair-ui-${check.id}`,
      action: "repair-ui-duplication",
      target: check.check,
      safe: true,
      requiresApproval: false,
      status: "pending",
      message: check.message,
    });
  }
  if (!scan.certificationEligible && scan.directorPass === false) {
    for (const repairAction of AUTONOMOUS_SAFE_REPAIR_ACTIONS.slice(0, 3)) {
      actions.push({
        id: `repair-director-${repairAction}`,
        action: repairAction,
        target: "marketplace",
        safe: true,
        requiresApproval: false,
        status: "pending",
        message: `${labelize(repairAction)} — safe autonomous repair planned`,
      });
    }
  }
  for (const blocker of scan.blockers.filter((b) => b.active)) {
    actions.push({
      id: `repair-blocker-${blocker.blocker}`,
      action: "resolve-blocker",
      target: blocker.blocker,
      safe: false,
      requiresApproval: true,
      status: "blocked",
      message: blocker.message,
    });
  }
  return actions.length > 0 ? actions : [{
    id: "repair-review",
    action: "manual-review",
    target: "marketplace",
    safe: false,
    requiresApproval: true,
    status: "blocked",
    message: "Marketplace completion violations require governance review",
  }];
}

export function attemptMarketplaceCompletionRepair(scan: MarketplaceCompletionScanResult, validationOnlyMode = true) {
  const planned = planMarketplaceCompletionRepairs(scan);
  if (validationOnlyMode || scan.certificationEligible) return { planned, executed: [] as CompletionRepairAction[] };
  const executed = planned
    .filter((p) => p.safe && !p.requiresApproval)
    .map((p) => ({ ...p, status: "pass" as const, message: `${p.message} — validation-only simulation` }));
  return { planned, executed };
}

export function isProtectedCompletionRepairTarget(target: string): boolean {
  const normalized = target.toLowerCase();
  return ["payments", "wallet", "authentication", "orders", "shipping", "database", "deployment", "business-logic", "business-rules"].some((area) => normalized.includes(area));
}
