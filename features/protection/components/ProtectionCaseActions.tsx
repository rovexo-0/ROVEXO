"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ProtectionCaseActionsProps = {
  caseId: string;
  isAdmin: boolean;
  status: string;
};

export function ProtectionCaseActions({ caseId, isAdmin, status }: ProtectionCaseActionsProps) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isAdmin || status === "resolved" || status === "closed") return null;

  const resolve = async (outcome: "buyer_favour" | "seller_favour" | "no_action") => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/protection/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", outcome, notes }),
      });
      setMessage(response.ok ? "Case resolved." : "Unable to resolve case.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-ds-6 rounded-ds-lg border border-border p-ds-4">
      <h2 className="text-lg font-semibold">Admin resolution</h2>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
        placeholder="Decision notes"
        className="mt-ds-3 w-full rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
      />
      <div className="mt-ds-3 flex flex-wrap gap-ds-2">
        <Button variant="primary" disabled={busy} onClick={() => void resolve("buyer_favour")}>
          Buyer favour
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => void resolve("seller_favour")}>
          Seller favour
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => void resolve("no_action")}>
          No action
        </Button>
      </div>
      {message ? <p className="mt-ds-2 text-sm text-text-secondary">{message}</p> : null}
    </div>
  );
}
