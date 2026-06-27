"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TrustReviewActions } from "@/features/admin/components/TrustReviewActions";
import type { TrustAdminAuditEntry, TrustVerification } from "@/lib/trust/types";
import type { TrustTier } from "@/lib/trust/types";
import { TRUST_TIER_LABELS } from "@/lib/trust/constants";

type TrustAdminDashboardProps = {
  summary: {
    pendingVerifications: number;
    averageScore: number;
    approvedVerifications: number;
    tierBreakdown: Record<TrustTier, number>;
  };
  pending: TrustVerification[];
  audit: TrustAdminAuditEntry[];
};

export function TrustAdminDashboard({ summary, pending, audit }: TrustAdminDashboardProps) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [delta, setDelta] = useState("5");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitAdminAction(action: "adjust" | "set" | "recalculate" | "lock") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userId,
          delta: action === "adjust" ? Number(delta) : undefined,
          score: action === "set" ? Number(delta) : undefined,
          reason: reason || `Admin ${action}`,
          lock: action === "lock" ? true : undefined,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Request failed");
      }
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-ds-6">
      <h2 className="text-xl font-semibold">Trust Center Administration</h2>

      <div className="grid gap-ds-4 sm:grid-cols-3">
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Pending verifications</p>
          <p className="mt-ds-1 text-3xl font-bold">{summary.pendingVerifications}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Average trust score</p>
          <p className="mt-ds-1 text-3xl font-bold">{summary.averageScore}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Approved verifications</p>
          <p className="mt-ds-1 text-3xl font-bold">{summary.approvedVerifications}</p>
        </Card>
      </div>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Tier breakdown</h3>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {(Object.keys(summary.tierBreakdown) as TrustTier[]).map((tier) => (
            <span key={tier} className="rounded-ds-full bg-secondary px-3 py-1">
              {TRUST_TIER_LABELS[tier]}: {summary.tierBreakdown[tier]}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Manual score controls</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="User UUID"
            className="rx-input px-3 py-2 text-sm"
          />
          <input
            value={delta}
            onChange={(event) => setDelta(event.target.value)}
            placeholder="Delta or target score"
            className="rx-input px-3 py-2 text-sm"
          />
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason"
            className="rx-input px-3 py-2 text-sm md:col-span-2"
          />
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <AdminButton disabled={busy} onClick={() => submitAdminAction("adjust")}>
            Adjust score
          </AdminButton>
          <AdminButton disabled={busy} onClick={() => submitAdminAction("set")}>
            Set score
          </AdminButton>
          <AdminButton disabled={busy} onClick={() => submitAdminAction("recalculate")}>
            Recalculate
          </AdminButton>
          <AdminButton disabled={busy} onClick={() => submitAdminAction("lock")}>
            Lock score
          </AdminButton>
        </div>
      </Card>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Moderator review queue</h3>
        <ul className="mt-ds-4 space-y-ds-4 text-sm">
          {pending.length ? (
            pending.map((item) => (
              <li key={item.id} className="rounded-ds-lg border border-border p-ds-4">
                <div className="flex flex-wrap items-center justify-between gap-ds-3">
                  <div>
                    <p className="font-medium capitalize">{item.verificationType.replace(/_/g, " ")}</p>
                    <p className="text-text-secondary">User {item.userId}</p>
                  </div>
                </div>
                <div className="mt-ds-3">
                  <TrustReviewActions verification={item} />
                </div>
              </li>
            ))
          ) : (
            <li className="text-text-secondary">No pending verifications</li>
          )}
        </ul>
      </Card>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Audit log</h3>
        <ul className="mt-4 space-y-2 text-sm text-text-secondary">
          {audit.length ? (
            audit.map((entry) => (
              <li key={entry.id} className="border-b border-border pb-2">
                <span className="font-medium text-text-primary">{entry.action}</span> — user {entry.userId.slice(0, 8)}…
                {entry.delta != null && ` (${entry.delta >= 0 ? "+" : ""}${entry.delta})`}
                <span className="block text-xs">{entry.reason}</span>
              </li>
            ))
          ) : (
            <li>No admin trust actions yet.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function AdminButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-ds-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}
