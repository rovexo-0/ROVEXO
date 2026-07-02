import type {
  WorkflowDefinition,
  WorkflowVersionCompare,
  WorkflowVersionEntry,
} from "@/lib/enterprise-workflow-engine/types";
import { compareWorkflowNodes } from "@/lib/enterprise-workflow-engine/builder";

export function createVersionEntry(
  workflow: WorkflowDefinition,
  publishedBy: string,
  changeSummary: string,
): WorkflowVersionEntry {
  return {
    id: `ver-${workflow.id}-${Date.now()}`,
    workflowId: workflow.id,
    version: workflow.version,
    publishedAt: new Date().toISOString(),
    publishedBy,
    rollbackAvailable: true,
    changeSummary,
  };
}

export function bumpWorkflowVersion(workflow: WorkflowDefinition, type: "patch" | "minor" | "major" = "patch"): WorkflowDefinition {
  const [major, minor, patch] = workflow.version.split(".").map(Number);
  const next =
    type === "major"
      ? `${major + 1}.0.0`
      : type === "minor"
        ? `${major}.${minor + 1}.0`
        : `${major}.${minor}.${patch + 1}`;
  return { ...workflow, version: next, updatedAt: new Date().toISOString() };
}

export function publishWorkflowVersion(workflow: WorkflowDefinition, actorId: string): {
  workflow: WorkflowDefinition;
  versionEntry: WorkflowVersionEntry;
} {
  const published = {
    ...workflow,
    status: "published" as const,
    enabled: true,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return {
    workflow: published,
    versionEntry: createVersionEntry(published, actorId, `Published v${published.version}`),
  };
}

export function rollbackToVersion(
  workflows: WorkflowDefinition[],
  history: WorkflowVersionEntry[],
  historyId: string,
): { workflows: WorkflowDefinition[]; entry?: WorkflowVersionEntry } {
  const entry = history.find((h) => h.id === historyId && h.rollbackAvailable);
  if (!entry) return { workflows };
  const updated = workflows.map((w) =>
    w.id === entry.workflowId
      ? { ...w, version: entry.version, status: "published" as const, updatedAt: new Date().toISOString() }
      : w,
  );
  return { workflows: updated, entry };
}

export function compareVersions(
  from: WorkflowDefinition,
  to: WorkflowDefinition,
): WorkflowVersionCompare {
  const diff = compareWorkflowNodes(from, to);
  return {
    workflowId: from.id,
    fromVersion: from.version,
    toVersion: to.version,
    addedNodes: diff.added,
    removedNodes: diff.removed,
    changedNodes: diff.changed,
  };
}

export function detectPendingPublish(draft: WorkflowDefinition[], live: WorkflowDefinition[]): boolean {
  if (draft.length !== live.length) return true;
  return JSON.stringify(draft) !== JSON.stringify(live);
}

export function exportWorkflowBundle(workflows: WorkflowDefinition[], versions: WorkflowVersionEntry[]) {
  return {
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
    workflows,
    versions,
  };
}

export function importWorkflowBundle(
  bundle: { workflows?: WorkflowDefinition[]; versions?: WorkflowVersionEntry[] },
  existing: WorkflowDefinition[],
): WorkflowDefinition[] {
  const imported = bundle.workflows ?? [];
  const map = new Map(existing.map((w) => [w.id, w]));
  for (const wf of imported) map.set(wf.id, wf);
  return [...map.values()];
}
