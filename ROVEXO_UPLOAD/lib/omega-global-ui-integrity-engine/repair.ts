import { PROTECTED_REPAIR_AREAS } from "@/lib/omega-global-ui-integrity-engine/registry";
import type { AutoRepairAction, GlobalFailCondition, GlobalScreenId } from "@/lib/omega-global-ui-integrity-engine/types";

export function isProtectedRepairTarget(target: string): boolean {
  const normalized = target.toLowerCase();
  return PROTECTED_REPAIR_AREAS.some((area) => normalized.includes(area.replace(/-/g, "")) || normalized.includes(area));
}

export function classifyRepairAction(action: string, target: string): { safe: boolean; requiresApproval: boolean } {
  if (isProtectedRepairTarget(target) || isProtectedRepairTarget(action)) {
    return { safe: false, requiresApproval: true };
  }
  const safeActions = ["compress-empty-layout", "optimise-spacing", "align-components", "remove-duplicate-rendering"];
  return { safe: safeActions.some((a) => action.includes(a)), requiresApproval: false };
}

export function planGlobalUiAutoRepair(failConditions: GlobalFailCondition[]): AutoRepairAction[] {
  if (failConditions.length === 0) {
    return [
      {
        id: "repair-none",
        action: "noop",
        target: "platform",
        safe: true,
        requiresApproval: false,
        status: "pass",
        message: "No repairs required — Global UI Integrity PASS 100%",
      },
    ];
  }

  return failConditions.map((condition, i) => {
    const action = condition.includes("duplicate")
      ? "remove-duplicate-rendering"
      : condition.includes("space") || condition.includes("gap")
        ? "compress-empty-layout"
        : condition.includes("alignment")
          ? "align-components"
          : "optimise-spacing";
    const target = condition.includes("homepage") ? "homepage" : condition.includes("category") ? "categories" : "layout";
    const classification = classifyRepairAction(action, target);
    return {
      id: `repair-${condition}-${i}`,
      action,
      target,
      screenId: (condition.includes("homepage") ? "homepage" : undefined) as GlobalScreenId | undefined,
      safe: classification.safe,
      requiresApproval: classification.requiresApproval,
      status: classification.requiresApproval ? "blocked" : "pending",
      message: classification.requiresApproval
        ? `Repair for ${condition} requires governance approval — business logic or protected area`
        : `Safe repair planned: ${action} on ${target}`,
    };
  });
}

export function attemptGlobalUiAutoRepair(input: {
  failConditions: GlobalFailCondition[];
  validationOnlyMode: boolean;
  autoRepairEnabled: boolean;
}): { executed: AutoRepairAction[]; blocked: AutoRepairAction[]; pending: AutoRepairAction[] } {
  const planned = planGlobalUiAutoRepair(input.failConditions);
  if (!input.autoRepairEnabled || input.validationOnlyMode) {
    return { executed: [], blocked: planned.filter((p) => p.requiresApproval), pending: planned.filter((p) => !p.requiresApproval && p.status === "pending") };
  }

  const executed = planned.filter((p) => p.safe && !p.requiresApproval).map((p) => ({
    ...p,
    status: "pass" as const,
    executedAt: new Date().toISOString(),
    message: `${p.message} — validation-only simulation, no production records modified`,
  }));
  const blocked = planned.filter((p) => p.requiresApproval);
  const pending = planned.filter((p) => !p.safe && !p.requiresApproval);
  return { executed, blocked, pending };
}
