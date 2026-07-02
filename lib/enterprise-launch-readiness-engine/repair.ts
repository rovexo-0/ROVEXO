import type { LaunchReadinessScanResult } from "@/lib/enterprise-launch-readiness-engine/types";
import type { LaunchRepairAction } from "@/lib/enterprise-launch-readiness-engine/types";

export function planLaunchReadinessRepairs(scan: LaunchReadinessScanResult): LaunchRepairAction[] {
  if (scan.certificationEligible) {
    return [{
      id: "repair-none",
      action: "noop",
      target: "platform",
      safe: true,
      requiresApproval: false,
      status: "pass",
      message: "No repairs required — Launch Readiness PASS 100%",
    }];
  }

  const actions: LaunchRepairAction[] = [];

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

  for (const check of scan.checks.filter((c) => c.status === "fail")) {
    actions.push({
      id: `repair-${check.id}`,
      action: check.category === "cron" ? "restart-failed-jobs" : check.category === "queue" ? "restart-queue-workers" : check.category === "caching" ? "clear-invalid-cache" : check.category === "search-index" ? "rebuild-search-indexes" : "re-run-validation",
      target: check.check,
      safe: !["database", "deployment", "security"].includes(check.category),
      requiresApproval: ["database", "deployment", "security"].includes(check.category),
      status: "pending",
      message: check.message,
    });
  }

  return actions.length > 0 ? actions : [{
    id: "repair-review",
    action: "manual-review",
    target: "platform",
    safe: false,
    requiresApproval: true,
    status: "blocked",
    message: "Launch readiness violations require governance review",
  }];
}

export function attemptLaunchReadinessRepair(scan: LaunchReadinessScanResult, validationOnlyMode = true): {
  planned: LaunchRepairAction[];
  executed: LaunchRepairAction[];
} {
  const planned = planLaunchReadinessRepairs(scan);
  if (validationOnlyMode || scan.certificationEligible) {
    return { planned, executed: [] };
  }
  const executed = planned
    .filter((p) => p.safe && !p.requiresApproval)
    .map((p) => ({ ...p, status: "pass" as const, message: `${p.message} — validation-only simulation` }));
  return { planned, executed };
}

export function isProtectedLaunchRepairTarget(target: string): boolean {
  const normalized = target.toLowerCase();
  return ["payments", "wallet", "authentication", "orders", "database", "deployment", "business-logic"].some((area) => normalized.includes(area));
}
