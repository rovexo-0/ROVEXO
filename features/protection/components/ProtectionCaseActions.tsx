"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ProtectionCaseStatus } from "@/lib/protection/service";

type ProtectionCaseActionsProps = {
  caseId: string;
  status: ProtectionCaseStatus;
  isAdmin: boolean;
};

export function ProtectionCaseActions({ caseId, status, isAdmin }: ProtectionCaseActionsProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitAppeal() {
    if (!reason.trim()) {
      setError("Enter a reason for your appeal.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/protection/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "appeal", reason: reason.trim() }),
      });
      if (!response.ok) throw new Error("Appeal failed");
      router.refresh();
    } catch {
      setError("Unable to submit appeal. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const canAppeal = status === "resolved";

  return (
    <Card className="mt-ds-6 space-y-ds-4 p-ds-4">
      <h2 className="text-lg font-semibold">Case actions</h2>

      {canAppeal && !isAdmin && (
        <div className="space-y-ds-3">
          <p className="text-sm text-text-secondary">Submit an appeal if you disagree with the outcome.</p>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="Explain why this case should be reviewed again"
            className="rx-input w-full px-ds-3 py-ds-2 text-sm"
          />
          <Button disabled={busy} onClick={() => void submitAppeal()}>
            Submit appeal
          </Button>
        </div>
      )}

      {isAdmin && status !== "closed" ? (
        <p className="text-sm text-text-secondary">
          Cases resolve automatically via the Resolution Engine. Use{" "}
          <a href="/super-admin/resolution-engine" className="font-medium text-text-primary underline">
            Resolution monitor
          </a>{" "}
          to view automation stats and audit logs.
        </p>
      ) : null}

      {error && <p className="text-sm text-danger">{error}</p>}
    </Card>
  );
}
