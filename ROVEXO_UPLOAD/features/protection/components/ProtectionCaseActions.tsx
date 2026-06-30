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
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("refund_full");
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

  async function resolveCase() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/protection/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          outcome,
          notes: notes.trim() || "Admin resolution",
        }),
      });
      if (!response.ok) throw new Error("Resolve failed");
      router.refresh();
    } catch {
      setError("Unable to resolve case.");
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

      {isAdmin && status !== "closed" && (
        <div className="space-y-ds-3">
          <label className="block text-sm font-medium">Resolution outcome</label>
          <select
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            className="rx-input w-full px-ds-3 py-ds-2 text-sm"
          >
            <option value="refund_full">Full refund (buyer favour)</option>
            <option value="refund_partial">Partial refund</option>
            <option value="return_accepted">Return accepted</option>
            <option value="return_rejected">Return rejected (seller favour)</option>
            <option value="no_action">No action</option>
            <option value="buyer_favour">Buyer favour</option>
            <option value="seller_favour">Seller favour</option>
          </select>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Admin notes"
            className="rx-input w-full px-ds-3 py-ds-2 text-sm"
          />
          <Button disabled={busy} onClick={() => void resolveCase()}>
            Resolve case
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </Card>
  );
}
