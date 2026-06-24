"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SuperAdminUserRow } from "@/lib/super-admin/users";
import { ASSIGNABLE_ROLES } from "@/lib/super-admin/users";
import type { UserRole } from "@/lib/supabase/types/database";

type UserInsights = {
  lastLogin: string | null;
  lastIp: string | null;
  devices: Array<{ id: string; platform: string | null; user_agent: string | null; updated_at: string | null }>;
  timeline: Array<{ id: string; action: string; resource_type: string | null; created_at: string }>;
  adminNote: string;
};

type SuperAdminUsersPanelProps = {
  initialQuery?: string;
};

export function SuperAdminUsersPanel({ initialQuery = "" }: SuperAdminUsersPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<"all" | "active" | "suspended" | "deleted">("all");
  const [role, setRole] = useState<UserRole | "all">("all");
  const [users, setUsers] = useState<SuperAdminUserRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status });
    if (query.trim()) params.set("q", query.trim());
    if (role !== "all") params.set("role", role);
    const response = await fetch(`/api/super-admin/users?${params.toString()}`);
    const payload = (await response.json()) as { users?: SuperAdminUserRow[]; error?: string };
    setUsers(payload.users ?? []);
    setLoading(false);
  }, [query, status, role]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const loadInsights = useCallback(async (userId: string) => {
    const response = await fetch(`/api/super-admin/users?detail=${userId}`);
    const payload = (await response.json()) as { insights?: UserInsights };
    setInsights(payload.insights ?? null);
    setNoteDraft(payload.insights?.adminNote ?? "");
  }, []);

  const runAction = useCallback(
    async (userId: string, action: string, payload?: Record<string, unknown>) => {
      setMessage(null);
      const response = await fetch("/api/super-admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, payload }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Action failed.");
        return;
      }
      setMessage("User updated.");
      await loadUsers();
      if (expanded === userId) {
        await loadInsights(userId);
      }
    },
    [expanded, loadInsights, loadUsers],
  );

  const runBulkAction = useCallback(
    async (action: string) => {
      if (!selected.size) {
        setMessage("Select at least one user.");
        return;
      }
      setMessage(null);
      const response = await fetch("/api/super-admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selected), action }),
      });
      const result = (await response.json()) as { error?: string; count?: number };
      if (!response.ok) {
        setMessage(result.error ?? "Bulk action failed.");
        return;
      }
      setMessage(`Updated ${result.count ?? selected.size} users.`);
      setSelected(new Set());
      await loadUsers();
    },
    [loadUsers, selected],
  );

  const toggleSelected = (userId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleExpanded = async (userId: string) => {
    if (expanded === userId) {
      setExpanded(null);
      setInsights(null);
      return;
    }
    setExpanded(userId);
    await loadInsights(userId);
  };

  return (
    <div className="space-y-ds-4">
      <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="grid gap-ds-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search username, name, or email"
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole | "all")}
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          >
            <option value="all">All roles</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="business">Business</option>
            <option value="admin">Admin</option>
          </select>
          <Button onClick={() => void loadUsers()}>Search</Button>
        </div>
      </Card>

      {selected.size ? (
        <Card padding="md" className="bg-white">
          <div className="flex flex-wrap items-center gap-ds-2">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Button size="sm" variant="secondary" onClick={() => void runBulkAction("verify")}>
              Bulk verify
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void runBulkAction("suspend")}>
              Bulk suspend
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void runBulkAction("restore")}>
              Bulk restore
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </Card>
      ) : null}

      {message ? <p className="text-sm font-medium text-primary">{message}</p> : null}

      {loading ? (
        <p className="text-sm text-text-secondary">Loading users…</p>
      ) : (
        <div className="space-y-ds-3">
          {users.map((user) => (
            <Card key={user.id} padding="md" className="bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-ds-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-ds-3">
                  {user.role !== "super_admin" ? (
                    <input
                      type="checkbox"
                      checked={selected.has(user.id)}
                      onChange={() => toggleSelected(user.id)}
                      className="mt-1"
                      aria-label={`Select ${user.fullName}`}
                    />
                  ) : null}
                  <div>
                    <div className="flex flex-wrap items-center gap-ds-2">
                      <h3 className="text-base font-semibold">{user.fullName}</h3>
                      <Badge variant={user.accountStatus === "active" ? "success" : "danger"}>
                        {user.accountStatus}
                      </Badge>
                      <Badge variant="default">{user.role}</Badge>
                      {user.verified ? <Badge variant="success">Verified</Badge> : null}
                      {user.entitlements.premium ? <Badge variant="success">Premium</Badge> : null}
                      {user.entitlements.lifetimePremium ? <Badge variant="success">Lifetime</Badge> : null}
                      {user.entitlements.companyVerified ? <Badge variant="success">Company</Badge> : null}
                    </div>
                    <p className="mt-ds-1 text-sm text-text-secondary">
                      @{user.username} · {user.email}
                    </p>
                    {user.sellerProfile ? (
                      <p className="mt-ds-1 text-xs text-text-muted">
                        Listings {user.sellerProfile.listingCount}
                        {user.sellerProfile.listingLimit != null
                          ? ` / limit ${user.sellerProfile.listingLimit}`
                          : ""}
                        {user.sellerProfile.vacationMode ? " · Vacation mode" : ""}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-ds-2">
                  <Button size="sm" variant="ghost" onClick={() => void toggleExpanded(user.id)}>
                    {expanded === user.id ? "Hide details" : "Details"}
                  </Button>
                  {user.role !== "super_admin" ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => void runAction(user.id, "verify")}>
                        Verify
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => void runAction(user.id, "suspend")}>
                        Suspend
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => void runAction(user.id, "restore")}>
                        Restore
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => void runAction(user.id, "reset_password")}>
                        Reset password
                      </Button>
                      {ASSIGNABLE_ROLES.map((assignableRole) => (
                        <Button
                          key={assignableRole}
                          size="sm"
                          variant="ghost"
                          onClick={() => void runAction(user.id, "set_role", { role: assignableRole })}
                        >
                          Make {assignableRole}
                        </Button>
                      ))}
                    </>
                  ) : (
                    <Badge variant="success">Super Admin</Badge>
                  )}
                </div>
              </div>

              {expanded === user.id && insights ? (
                <div className="mt-ds-4 grid gap-ds-4 border-t border-border pt-ds-4 lg:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold">Security & sessions</h4>
                    <ul className="mt-ds-2 space-y-ds-1 text-sm text-text-secondary">
                      <li>
                        Last login:{" "}
                        {insights.lastLogin
                          ? new Date(insights.lastLogin).toLocaleString("en-GB")
                          : "Unknown"}
                      </li>
                      <li>Last IP: {insights.lastIp ?? "Not recorded"}</li>
                      <li>Registered devices: {insights.devices.length}</li>
                    </ul>
                    {insights.devices.length ? (
                      <ul className="mt-ds-3 space-y-ds-1 text-xs text-text-muted">
                        {insights.devices.map((device) => (
                          <li key={device.id}>
                            {device.platform ?? "device"} · {device.user_agent ?? "unknown agent"}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold">Account timeline</h4>
                    <ul className="mt-ds-2 max-h-40 space-y-ds-1 overflow-y-auto text-xs text-text-secondary">
                      {insights.timeline.map((entry) => (
                        <li key={entry.id} className="flex justify-between gap-ds-2">
                          <span>{entry.action}</span>
                          <span>{new Date(entry.created_at).toLocaleString("en-GB")}</span>
                        </li>
                      ))}
                      {!insights.timeline.length ? <li>No audit events yet.</li> : null}
                    </ul>
                  </div>

                  <div className="lg:col-span-2">
                    <h4 className="text-sm font-semibold">Internal admin notes</h4>
                    <textarea
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      rows={3}
                      className="premium-input mt-ds-2 w-full rounded-ds-md px-ds-3 py-ds-2 text-sm"
                      placeholder="Private notes visible only to Super Admin…"
                    />
                    <Button
                      className="mt-ds-2"
                      size="sm"
                      onClick={() =>
                        void runAction(user.id, "admin_note", {
                          note: noteDraft,
                        })
                      }
                    >
                      Save note
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
