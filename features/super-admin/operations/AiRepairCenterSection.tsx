"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AiOperationsSnapshot, DetectedIssue, RepairPatch } from "@/lib/super-admin/operations/types";
import { SEVERITY_BADGE } from "@/features/super-admin/operations/utils";

type AiRepairCenterSectionProps = {
  snapshot: AiOperationsSnapshot;
  onUpdated: (snapshot: AiOperationsSnapshot) => void;
};

export function AiRepairCenterSection({ snapshot, onUpdated }: AiRepairCenterSectionProps) {
  const [confirmingApply, setConfirmingApply] = useState<string | null>(null);
  const [pendingIssue, setPendingIssue] = useState<DetectedIssue | null>(null);
  const [patch, setPatch] = useState<RepairPatch | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  function requestApply(issue: DetectedIssue) {
    setConfirmingApply(issue.id);
    setPendingIssue(issue);
    setMessage("Review the fix and confirm before applying. No changes are made automatically.");
  }

  async function refresh() {
    const response = await fetch("/api/super-admin/operations");
    const payload = (await response.json()) as { snapshot: AiOperationsSnapshot };
    onUpdated(payload.snapshot);
  }

  async function generateFix(issue: DetectedIssue) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/super-admin/operations/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", issueId: issue.id }),
      });
      const payload = (await response.json()) as { patch?: RepairPatch; exportText?: string; error?: string };
      if (!response.ok || !payload.patch) throw new Error(payload.error ?? "Unable to generate fix.");
      setPatch(payload.patch);
      setPendingIssue(issue);
      setMessage("Patch generated. Review and confirm before applying.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Generate failed.");
    } finally {
      setLoading(false);
    }
  }

  async function applyFix(confirmed: boolean) {
    if (!pendingIssue) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/super-admin/operations/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          issueId: pendingIssue.id,
          repairId: pendingIssue.repairId,
          confirmed,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? payload.message ?? "Apply failed.");
      setMessage(payload.message ?? "Repair applied.");
      setPendingIssue(null);
      setPatch(null);
      setConfirmingApply(null);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Apply failed.");
    } finally {
      setLoading(false);
    }
  }

  async function rollback(issue: DetectedIssue) {
    setLoading(true);
    await fetch("/api/super-admin/operations/repairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rollback", issueId: issue.id }),
    });
    setMessage("Rollback recorded.");
    setLoading(false);
    await refresh();
  }

  async function exportPatch() {
    if (!patch) return;
    const response = await fetch("/api/super-admin/operations/repairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export", issueId: patch.issueId, patchId: patch.id }),
    });
    const payload = (await response.json()) as { exportText?: string };
    if (payload.exportText) {
      await navigator.clipboard.writeText(payload.exportText);
      setMessage("Patch copied to clipboard.");
    }
  }

  return (
    <section className="ai-ops-section">
      <h2 className="text-lg font-semibold text-text-primary">AI Repair Center</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">
        Repairs never apply automatically. Confirm every change before execution.
      </p>

      {message ? <p className="mt-ds-3 text-sm text-primary">{message}</p> : null}

      <div className="mt-ds-4 space-y-ds-3">
        {snapshot.issues.length === 0 ? (
          <Card padding="md" className="rx-surface-card bg-white/90">
            <p className="text-sm text-text-secondary">No issues detected. Run a platform scan to refresh.</p>
          </Card>
        ) : (
          snapshot.issues.map((issue) => (
            <Card key={issue.id} padding="md" className="rx-surface-card border border-border/80 bg-white/90 dark:bg-slate-900/80">
              <div className="flex flex-wrap items-start justify-between gap-ds-3">
                <div>
                  <div className="flex flex-wrap items-center gap-ds-2">
                    <h3 className="font-semibold text-text-primary">{issue.problem}</h3>
                    <Badge variant={SEVERITY_BADGE[issue.severity]}>{issue.severity}</Badge>
                  </div>
                  <p className="mt-ds-2 text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">Cause:</span> {issue.cause}
                  </p>
                  <p className="mt-ds-1 text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">Affected files:</span>{" "}
                    {issue.affectedFiles.join(", ") || "—"}
                  </p>
                  <p className="mt-ds-1 text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">Suggested fix:</span> {issue.suggestedFix}
                  </p>
                </div>
                <div className="flex flex-wrap gap-ds-2">
                  <Button size="sm" variant="secondary" disabled={loading} onClick={() => void generateFix(issue)}>
                    Generate Fix
                  </Button>
                  <Button
                    size="sm"
                    disabled={loading || !issue.repairId}
                    onClick={() => requestApply(issue)}
                  >
                    Apply Fix
                  </Button>
                  <Button size="sm" variant="ghost" disabled={loading || !issue.rollbackAvailable} onClick={() => void rollback(issue)}>
                    Rollback
                  </Button>
                  <Button size="sm" variant="outline" disabled={!patch || patch.issueId !== issue.id} onClick={() => void exportPatch()}>
                    Export Patch
                  </Button>
                </div>
              </div>
              {confirmingApply === issue.id ? (
                <div className="mt-ds-3 rounded-ds-lg border border-amber-500/30 bg-amber-500/5 p-ds-3">
                  <p className="text-sm font-medium text-text-primary">Confirm repair application</p>
                  <p className="mt-ds-1 text-xs text-text-secondary">
                    This will execute the repair handler. Database schema and file deletions are never automatic.
                  </p>
                  <div className="mt-ds-3 flex flex-wrap gap-ds-2">
                    <Button size="sm" disabled={loading} onClick={() => void applyFix(true)}>
                      Confirm Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={loading}
                      onClick={() => {
                        setConfirmingApply(null);
                        setMessage(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
              {patch && patch.issueId === issue.id ? (
                <pre className="mt-ds-3 overflow-x-auto rounded-ds-md bg-surface-muted/80 p-ds-3 text-xs text-text-secondary">
                  {patch.diff}
                </pre>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
