import type { RepairPlan, SelfHealingIssueType } from "@/lib/enterprise-ai-operating-system/types";
import { SELF_HEALING_ISSUE_TYPES } from "@/lib/enterprise-ai-operating-system/registry";

export function detectSelfHealingIssues(): SelfHealingIssueType[] {
  return SELF_HEALING_ISSUE_TYPES.filter((_, i) => i % 4 === 0);
}

export function createRepairPlan(issueType: SelfHealingIssueType, requiresApproval = true): RepairPlan {
  return {
    id: `repair-${issueType}-${Date.now()}`,
    issueType,
    title: `Repair ${issueType.replace(/-/g, " ")}`,
    description: `Automated repair plan for ${issueType}`,
    workflowId: "enterprise-workflow-engine",
    status: "pending-approval",
    requiresApproval,
    createdAt: new Date().toISOString(),
  };
}

export function approveRepair(plan: RepairPlan, actorId: string): RepairPlan {
  return {
    ...plan,
    status: "approved",
    approvedAt: new Date().toISOString(),
    approvedBy: actorId,
  };
}

export function cancelRepair(plan: RepairPlan): RepairPlan {
  return { ...plan, status: "cancelled" };
}

export function rejectRepair(plan: RepairPlan): RepairPlan {
  return { ...plan, status: "rejected" };
}

export function executeRepair(plan: RepairPlan): RepairPlan {
  if (plan.status !== "approved") return plan;
  return { ...plan, status: "running" };
}

export function completeRepair(plan: RepairPlan): RepairPlan {
  return { ...plan, status: "completed" };
}

export function pendingRepairs(plans: RepairPlan[]): RepairPlan[] {
  return plans.filter((p) => p.status === "pending-approval");
}
