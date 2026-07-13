"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ACHIEVEMENT_DEFINITIONS, SELLER_LEVEL_LABELS, type AchievementId, type SellerLevel } from "@/lib/seller-performance/master-spec";
import type { SellerPerformanceAuditEntry } from "@/lib/seller-performance/types";

type SellerPerformanceAdminDashboardProps = {
  summary: {
    totalSellers: number;
    averageScore: number;
    byLevel: Record<SellerLevel, number>;
  };
  audit: SellerPerformanceAuditEntry[];
};

export function SellerPerformanceAdminDashboard({
  summary,
  audit,
}: SellerPerformanceAdminDashboardProps) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [badgeId, setBadgeId] = useState<AchievementId>("verified_seller");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "force_recalc" | "grant_badge" | "revoke_badge") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/seller-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userId,
          reason: reason || `Admin ${action}`,
          badgeId: action === "force_recalc" ? undefined : badgeId,
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
      <p className="text-sm text-text-secondary">
        Read-only reputation analytics. Force recalculation and badge grant/revoke only — no arbitrary score editing.
      </p>

      <div className="grid gap-ds-4 sm:grid-cols-3">
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Tracked sellers</p>
          <p className="mt-ds-1 text-3xl font-bold">{summary.totalSellers}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Average seller score</p>
          <p className="mt-ds-1 text-3xl font-bold">{summary.averageScore}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Elite sellers</p>
          <p className="mt-ds-1 text-3xl font-bold">{summary.byLevel.elite_seller}</p>
        </Card>
      </div>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Level breakdown</h3>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {(Object.keys(summary.byLevel) as SellerLevel[]).map((level) => (
            <span key={level} className="rounded-ds-full bg-secondary px-3 py-1">
              {SELLER_LEVEL_LABELS[level]}: {summary.byLevel[level]}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Admin actions (audited)</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Seller user UUID"
            className="rx-input px-3 py-2 text-sm"
          />
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Audit reason"
            className="rx-input px-3 py-2 text-sm"
          />
          <select
            value={badgeId}
            onChange={(event) => setBadgeId(event.target.value as AchievementId)}
            className="rx-input px-3 py-2 text-sm"
          >
            {ACHIEVEMENT_DEFINITIONS.map((badge) => (
              <option key={badge.id} value={badge.id}>
                {badge.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !userId}
            onClick={() => void submit("force_recalc")}
            className="rx-btn rx-btn--primary px-4 py-2 text-sm"
          >
            Force recalculation
          </button>
          <button
            type="button"
            disabled={busy || !userId}
            onClick={() => void submit("grant_badge")}
            className="rx-btn px-4 py-2 text-sm"
          >
            Grant badge
          </button>
          <button
            type="button"
            disabled={busy || !userId}
            onClick={() => void submit("revoke_badge")}
            className="rx-btn px-4 py-2 text-sm"
          >
            Revoke badge
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </Card>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Audit log</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {audit.length ? (
            audit.map((entry) => (
              <li key={entry.id} className="border-b border-border pb-2">
                <p className="font-medium">{entry.action}</p>
                <p className="text-text-secondary">{entry.reason}</p>
                <p className="text-xs text-text-muted">{new Date(entry.createdAt).toLocaleString()}</p>
              </li>
            ))
          ) : (
            <li className="text-text-muted">No admin actions logged yet.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
