"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getPromotionDuration } from "@/lib/promotions/config";
import type { AdminPromotionRow, AdminPromotionStats } from "@/lib/promotions/admin-types";

type AdminPromotionsPageProps = {
  initialPromotions: AdminPromotionRow[];
  initialStats: AdminPromotionStats;
};

function formatCurrency(cents: number): string {
  return `£${(cents / 100).toFixed(2)}`;
}

const STATUS_VARIANTS: Record<
  AdminPromotionRow["status"],
  "default" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  active: "success",
  scheduled: "warning",
  expired: "default",
  failed: "danger",
  suspended: "danger",
};

export function AdminPromotionsPage({
  initialPromotions,
  initialStats,
}: AdminPromotionsPageProps) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [stats] = useState(initialStats);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return promotions.filter((promotion) => {
      if (statusFilter !== "all" && promotion.status !== statusFilter) return false;
      if (!term) return true;
      return (
        promotion.productTitle.toLowerCase().includes(term) ||
        promotion.sellerName.toLowerCase().includes(term) ||
        promotion.id.toLowerCase().includes(term)
      );
    });
  }, [promotions, query, statusFilter]);

  const runAction = useCallback(async (id: string, action: "activate" | "suspend" | "expire" | "refund") => {
    setBusyId(id);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        setMessage(payload.error ?? "Action failed.");
        return;
      }

      setPromotions((current) =>
        current.map((promotion) =>
          promotion.id === id
            ? {
                ...promotion,
                status:
                  action === "activate"
                    ? "active"
                    : action === "suspend"
                      ? "suspended"
                      : action === "refund"
                        ? "failed"
                        : "expired",
              }
            : promotion,
        ),
      );
      setMessage(`Promotion ${action}d successfully.`);
    } finally {
      setBusyId(null);
    }
  }, []);

  return (
    <div className="flex flex-col gap-ds-5">
      <div>
        <h2 className="text-xl font-semibold">Promotions</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Manage bumps, featured listings, revenue, and moderation.
        </p>
      </div>

      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Active</p>
          <p className="mt-ds-1 text-2xl font-bold">{stats.activePromotions}</p>
        </Card>
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Revenue (month)</p>
          <p className="mt-ds-1 text-2xl font-bold">{formatCurrency(stats.monthRevenueCents)}</p>
        </Card>
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Impressions</p>
          <p className="mt-ds-1 text-2xl font-bold">{stats.impressions}</p>
        </Card>
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">CTR</p>
          <p className="mt-ds-1 text-2xl font-bold">{stats.ctr}%</p>
        </Card>
      </div>

      <Card padding="md" className="">
        <div className="flex flex-col gap-ds-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search listings or sellers"
            className="rx-input min-h-ds-7 flex-1 px-ds-3 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rx-input min-h-ds-7 px-ds-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </Card>

      {message && (
        <Card padding="sm" className="border-primary/30 bg-primary/5">
          <p className="text-sm text-text-primary">{message}</p>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-ds-4 py-ds-6 text-sm text-text-secondary">No promotions found.</p>
        ) : (
          filtered.map((promotion, index) => {
            const duration = getPromotionDuration(promotion.type, promotion.durationId);

            return (
              <div
                key={promotion.id}
                className={index > 0 ? "border-t border-border px-ds-4 py-ds-4" : "px-ds-4 py-ds-4"}
              >
                <div className="flex flex-col gap-ds-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-ds-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
                      <SafeImage
                        src={promotion.productImageUrl}
                        alt={promotion.productTitle}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text-primary">{promotion.productTitle}</p>
                      <p className="text-xs text-text-secondary">
                        {promotion.sellerName} · {promotion.type} · {duration?.label ?? promotion.durationId} ·{" "}
                        {formatCurrency(promotion.amountCents)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant={STATUS_VARIANTS[promotion.status]}>{promotion.status}</Badge>
                        <Badge variant="default">{promotion.type === "bump" ? "Bump" : "Feature"}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-ds-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === promotion.id}
                      onClick={() => void runAction(promotion.id, "activate")}
                    >
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === promotion.id}
                      onClick={() => void runAction(promotion.id, "suspend")}
                    >
                      Suspend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === promotion.id}
                      onClick={() => void runAction(promotion.id, "expire")}
                    >
                      Expire
                    </Button>
                    {promotion.amountCents > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === promotion.id}
                        onClick={() => void runAction(promotion.id, "refund")}
                      >
                        Refund
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
