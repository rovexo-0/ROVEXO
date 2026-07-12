"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium/EnterpriseAdminShell";
import {
  removePromotionChannel,
  subscribeToPromotionChanges,
} from "@/lib/promotions/realtime";
import {
  ADMIN_DURATION_OPTIONS,
  PROMOTION_SOURCE_LABELS,
  type PromotionSource,
} from "@/lib/promotions/canonical-engine";
import type {
  PromotionUserSearchResult,
  UserPromotionProfile,
} from "@/lib/promotions/admin-engine";
import type { PromotionAuditRow } from "@/lib/promotions/audit-log";

type UserPromotionsAdminProps = {
  durationOptions: typeof ADMIN_DURATION_OPTIONS;
};

type ActionKey =
  | "activate"
  | "pause"
  | "resume"
  | "extend"
  | "reduce"
  | "expire"
  | "revoke"
  | "duplicate";

const GRANT_TYPES = [
  { id: "bump", label: "Bump Listing" },
  { id: "feature", label: "Featured Listing" },
  { id: "store_featured", label: "Featured Store" },
  { id: "boost_package", label: "Boost Package" },
] as const;

export function UserPromotionsAdmin({ durationOptions }: UserPromotionsAdminProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PromotionUserSearchResult[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserPromotionProfile | null>(null);
  const [audit, setAudit] = useState<PromotionAuditRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [grantType, setGrantType] = useState<(typeof GRANT_TYPES)[number]["id"]>("bump");
  const [packageId, setPackageId] = useState("7d");
  const [productId, setProductId] = useState("");
  const [source, setSource] = useState<PromotionSource>("granted_by_rovexo");
  const [reason, setReason] = useState("");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const response = await fetch(`/api/super-admin/promotion-management/users/${userId}`);
    if (!response.ok) {
      setMessage("Unable to load promotion profile.");
      return;
    }
    const payload = (await response.json()) as {
      profile: UserPromotionProfile;
      audit: PromotionAuditRow[];
    };
    setProfile(payload.profile);
    setAudit(payload.audit);
    setSelectedUserId(userId);
  }, []);

  const runSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearchBusy(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/super-admin/promotion-management/search?q=${encodeURIComponent(query.trim())}`,
      );
      const payload = (await response.json()) as { results: PromotionUserSearchResult[] };
      setSearchResults(payload.results ?? []);
      if (payload.results?.length === 1) {
        await loadProfile(payload.results[0].id);
      }
    } finally {
      setSearchBusy(false);
    }
  }, [query, loadProfile]);

  const runAction = useCallback(
    async (
      input: {
        scope: "listing" | "seller";
        promotionId: string;
        action: ActionKey;
        daysDelta?: number;
      },
    ) => {
      const key = `${input.promotionId}:${input.action}`;
      setBusyKey(key);
      setMessage(null);
      try {
        const response = await fetch("/api/super-admin/promotion-management/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope: input.scope,
            promotionId: input.promotionId,
            action: input.action,
            daysDelta: input.daysDelta,
            reason: reason || undefined,
            source,
          }),
        });
        const payload = (await response.json()) as { success?: boolean; error?: string };
        if (!response.ok || !payload.success) {
          setMessage(payload.error ?? "Action failed.");
          return;
        }
        setMessage(`Promotion ${input.action} completed.`);
        if (selectedUserId) await loadProfile(selectedUserId);
        router.refresh();
      } finally {
        setBusyKey(null);
      }
    },
    [loadProfile, reason, router, selectedUserId, source],
  );

  const runGrant = useCallback(async () => {
    if (!selectedUserId) return;
    setBusyKey("grant");
    setMessage(null);
    try {
      const needsListing = grantType === "bump" || grantType === "feature";
      const response = await fetch("/api/super-admin/promotion-management/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant",
          userId: selectedUserId,
          grantType,
          productId: needsListing ? productId : undefined,
          packageId,
          durationId: packageId,
          source,
          reason: reason || "Granted by ROVEXO",
        }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        setMessage(payload.error ?? "Grant failed.");
        return;
      }
      setMessage("Promotion granted.");
      await loadProfile(selectedUserId);
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  }, [grantType, loadProfile, packageId, productId, reason, router, selectedUserId, source]);

  useEffect(() => {
    const channel = subscribeToPromotionChanges({
      onChange: () => {
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => {
          router.refresh();
          if (selectedUserId) void loadProfile(selectedUserId);
        }, 400);
      },
    });

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (channel) removePromotionChannel(channel);
    };
  }, [loadProfile, router, selectedUserId]);

  return (
    <EnterpriseAdminShell
      moduleId="promotion-management"
      eyebrow="Promotion Management"
      title="User Promotions"
      description="Search users, grant promotions without payment, and manage lifecycle actions."
      message={message}
    >
    <div className="flex flex-col gap-ds-5" data-sa-promotion-engine-version="v1.0-canonical">
      <Card padding="md">
        <p className="text-sm font-semibold text-text-primary">Search users</p>
        <p className="mt-ds-1 text-sm text-text-secondary">
          User ID, username, email, store name, or listing ID
        </p>
        <div className="mt-ds-3 flex flex-col gap-ds-2 sm:flex-row">
          <input
            className="min-h-11 flex-1 rounded-ds-md border border-border px-ds-3 text-sm"
            placeholder="Search…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void runSearch();
            }}
          />
          <Button onClick={() => void runSearch()} disabled={searchBusy}>
            {searchBusy ? "Searching…" : "Search"}
          </Button>
        </div>
        {searchResults.length > 0 ? (
          <ul className="mt-ds-3 flex flex-col gap-ds-2">
            {searchResults.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  className="w-full rounded-ds-md border border-border px-ds-3 py-ds-2 text-left text-sm hover:bg-surface-secondary"
                  onClick={() => void loadProfile(user.id)}
                >
                  <span className="font-semibold">@{user.username}</span>
                  <span className="text-text-secondary"> · {user.email}</span>
                  {user.storeName ? (
                    <span className="text-text-secondary"> · {user.storeName}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {profile ? (
        <>
          <Card padding="md">
            <div className="flex flex-wrap items-start justify-between gap-ds-3">
              <div>
                <p className="text-lg font-semibold">{profile.user.fullName}</p>
                <p className="text-sm text-text-secondary">
                  @{profile.user.username} · {profile.user.email}
                </p>
                {profile.user.storeName ? (
                  <p className="text-sm text-text-secondary">Store: {profile.user.storeName}</p>
                ) : null}
              </div>
              <Badge variant="default">User ID: {profile.user.id.slice(0, 8)}…</Badge>
            </div>
          </Card>

          <Card padding="md">
            <p className="text-sm font-semibold">Grant promotion (no payment)</p>
            <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2">
              <label className="text-sm">
                Type
                <select
                  className="mt-ds-1 w-full rounded-ds-md border border-border px-ds-2 py-ds-2"
                  value={grantType}
                  onChange={(event) =>
                    setGrantType(event.target.value as (typeof GRANT_TYPES)[number]["id"])
                  }
                >
                  {GRANT_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Duration
                <select
                  className="mt-ds-1 w-full rounded-ds-md border border-border px-ds-2 py-ds-2"
                  value={packageId}
                  onChange={(event) => setPackageId(event.target.value)}
                >
                  {durationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {(grantType === "bump" || grantType === "feature") && (
                <label className="text-sm sm:col-span-2">
                  Listing ID
                  <input
                    className="mt-ds-1 w-full rounded-ds-md border border-border px-ds-2 py-ds-2"
                    value={productId}
                    onChange={(event) => setProductId(event.target.value)}
                    placeholder="Product / listing UUID"
                  />
                </label>
              )}
              <label className="text-sm">
                Source
                <select
                  className="mt-ds-1 w-full rounded-ds-md border border-border px-ds-2 py-ds-2"
                  value={source}
                  onChange={(event) => setSource(event.target.value as PromotionSource)}
                >
                  {Object.entries(PROMOTION_SOURCE_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                Reason
                <input
                  className="mt-ds-1 w-full rounded-ds-md border border-border px-ds-2 py-ds-2"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Audit reason"
                />
              </label>
            </div>
            <Button className="mt-ds-3" onClick={() => void runGrant()} disabled={busyKey === "grant"}>
              Grant
            </Button>
          </Card>

          <PromotionTable
            title="Listing promotions"
            rows={profile.listingPromotions.map((row) => ({
              id: row.id,
              scope: "listing" as const,
              label: `${row.type} · ${row.productTitle}`,
              status: row.canonicalStatus,
              source: row.source,
              endsAt: row.endsAt,
            }))}
            busyKey={busyKey}
            onAction={runAction}
          />

          <PromotionTable
            title="Seller promotions"
            rows={profile.sellerPromotions.map((row) => ({
              id: row.id,
              scope: "seller" as const,
              label: `${row.type} · ${row.packageId}`,
              status: row.canonicalStatus,
              source: row.source,
              endsAt: row.endsAt,
            }))}
            busyKey={busyKey}
            onAction={runAction}
          />

          <Card padding="md">
            <p className="text-sm font-semibold">Audit log</p>
            <ul className="mt-ds-3 flex max-h-80 flex-col gap-ds-2 overflow-y-auto text-sm">
              {audit.map((entry) => (
                <li key={entry.id} className="rounded-ds-md border border-border px-ds-3 py-ds-2">
                  <p className="font-medium">
                    {entry.promotionType} · {entry.previousStatus ?? "—"} → {entry.newStatus}
                  </p>
                  <p className="text-text-secondary">
                    {new Date(entry.createdAt).toLocaleString("en-GB")}
                    {entry.reason ? ` · ${entry.reason}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}
    </div>
    </EnterpriseAdminShell>
  );
}

type TableRow = {
  id: string;
  scope: "listing" | "seller";
  label: string;
  status: string;
  source: string;
  endsAt: string | null;
};

function PromotionTable({
  title,
  rows,
  busyKey,
  onAction,
}: {
  title: string;
  rows: TableRow[];
  busyKey: string | null;
  onAction: (input: {
    scope: "listing" | "seller";
    promotionId: string;
    action: ActionKey;
    daysDelta?: number;
  }) => Promise<void>;
}) {
  if (rows.length === 0) {
    return (
      <Card padding="md">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-ds-2 text-sm text-text-secondary">No promotions.</p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-ds-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="py-ds-2 pr-ds-3">Promotion</th>
              <th className="py-ds-2 pr-ds-3">Status</th>
              <th className="py-ds-2 pr-ds-3">Source</th>
              <th className="py-ds-2 pr-ds-3">Ends</th>
              <th className="py-ds-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60">
                <td className="py-ds-2 pr-ds-3">{row.label}</td>
                <td className="py-ds-2 pr-ds-3">
                  <Badge variant={row.status === "active" ? "success" : "default"}>{row.status}</Badge>
                </td>
                <td className="py-ds-2 pr-ds-3">{row.source}</td>
                <td className="py-ds-2 pr-ds-3">
                  {row.endsAt ? new Date(row.endsAt).toLocaleDateString("en-GB") : "—"}
                </td>
                <td className="py-ds-2">
                  <div className="flex flex-wrap gap-ds-1">
                    {(["activate", "pause", "resume", "extend", "expire", "revoke", "duplicate"] as ActionKey[]).map(
                      (action) => (
                        <Button
                          key={action}
                          size="sm"
                          variant="secondary"
                          disabled={busyKey === `${row.id}:${action}`}
                          onClick={() =>
                            void onAction({
                              scope: row.scope,
                              promotionId: row.id,
                              action,
                              daysDelta: action === "extend" || action === "reduce" ? 7 : undefined,
                            })
                          }
                        >
                          {action}
                        </Button>
                      ),
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
