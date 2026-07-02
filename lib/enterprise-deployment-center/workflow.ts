import type { PlatformRelease, WorkflowStage } from "@/lib/enterprise-deployment-center/types";
import { WORKFLOW_STAGES } from "@/lib/enterprise-deployment-center/registry";

export function getNextStage(current: WorkflowStage): WorkflowStage | null {
  const idx = WORKFLOW_STAGES.indexOf(current);
  if (idx < 0 || idx >= WORKFLOW_STAGES.length - 1) return null;
  return WORKFLOW_STAGES[idx + 1]!;
}

export function canDeploy(release: PlatformRelease): boolean {
  return release.status === "approved" && ["manual-approval", "deployment"].includes(release.stage);
}

export function requiresCertification(stage: WorkflowStage): boolean {
  return stage === "certification" || WORKFLOW_STAGES.indexOf(stage) >= WORKFLOW_STAGES.indexOf("certification");
}

export function workflowProgress(stage: WorkflowStage): number {
  const idx = WORKFLOW_STAGES.indexOf(stage);
  return Math.round(((idx + 1) / WORKFLOW_STAGES.length) * 100);
}

export function advanceToValidation(release: PlatformRelease): PlatformRelease {
  return { ...release, stage: "validation", status: "pending-approval" };
}

export function advanceToAiAnalysis(release: PlatformRelease): PlatformRelease {
  return { ...release, stage: "ai-analysis" };
}

export function advanceToCertification(release: PlatformRelease): PlatformRelease {
  return { ...release, stage: "certification" };
}

export function advanceToManualApproval(release: PlatformRelease): PlatformRelease {
  return { ...release, stage: "manual-approval", status: "pending-approval" };
}
