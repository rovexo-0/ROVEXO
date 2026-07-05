"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EnterpriseEngineAdminShell } from "@/features/super-admin/components/premium/EnterpriseEngineAdminShell";
import type {
  StaffActivityEntry,
  StaffListItem,
  StaffLoginEntry,
  StaffPermissionEntry,
  StaffProfileDetail,
  StaffRoleCatalogRow,
  StaffRoleId,
  StaffSort,
  StaffStatus,
} from "@/lib/staff-profile";

const STATUS_FILTERS: Array<{ id: StaffStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
  { id: "archived", label: "Archived" },
];

const SORT_OPTIONS: Array<{ id: StaffSort; label: string }> = [
  { id: "alphabetical", label: "Alphabetical" },
  { id: "newest_registration", label: "Newest Registered" },
  { id: "oldest_registration", label: "Oldest Registered" },
  { id: "recently_active", label: "Recently Active" },
  { id: "least_active", label: "Least Active" },
];

const ACTIVITY_FILTERS = [
  { id: "all", label: "All Activity" },
  { id: "authentication", label: "Authentication" },
  { id: "marketplace", label: "Marketplace" },
  { id: "orders", label: "Orders" },
  { id: "payments", label: "Payments" },
  { id: "shipping", label: "Shipping" },
  { id: "finance", label: "Finance" },
  { id: "messaging", label: "Messaging" },
  { id: "business", label: "Business" },
  { id: "administration", label: "Administration" },
  { id: "security", label: "Security" },
] as const;

function statusVariant(status: StaffStatus): "success" | "warning" | "default" {
  if (status === "active") return "success";
  if (status === "suspended") return "warning";
  return "default";
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RoleBadges({ roles }: { roles: StaffListItem["roles"] }) {
  if (!roles.length) {
    return <span className="staff-profile__muted">No roles assigned</span>;
  }
  return (
    <div className="staff-profile__badges">
      {roles.map((role) => (
        <Badge key={role.id} variant="default">
          {role.label}
        </Badge>
      ))}
    </div>
  );
}

export function StaffProfileAdmin() {
  const [tab, setTab] = useState("directory");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StaffStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<StaffRoleId | "all">("all");
  const [sort, setSort] = useState<StaffSort>("alphabetical");
  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [roles, setRoles] = useState<StaffRoleCatalogRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StaffProfileDetail | null>(null);
  const [activity, setActivity] = useState<StaffActivityEntry[]>([]);
  const [loginHistory, setLoginHistory] = useState<StaffLoginEntry[]>([]);
  const [permissionHistory, setPermissionHistory] = useState<StaffPermissionEntry[]>([]);
  const [activityModule, setActivityModule] = useState<(typeof ACTIVITY_FILTERS)[number]["id"]>("all");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort, status, role: roleFilter });
    if (query.trim()) params.set("q", query.trim());
    const response = await fetch(`/api/super-admin/staff?${params.toString()}`);
    const payload = (await response.json()) as { staff?: StaffListItem[]; roles?: StaffRoleCatalogRow[] };
    setStaff(payload.staff ?? []);
    setRoles(payload.roles ?? []);
    setLoading(false);
  }, [query, roleFilter, sort, status]);

  const loadDetail = useCallback(
    async (staffId: string, moduleFilter = activityModule) => {
      setDetailLoading(true);
      const params = new URLSearchParams();
      if (moduleFilter !== "all") params.set("module", moduleFilter);
      const response = await fetch(`/api/super-admin/staff/${staffId}?${params.toString()}`);
      const payload = (await response.json()) as {
        staff?: StaffProfileDetail;
        activity?: StaffActivityEntry[];
        loginHistory?: StaffLoginEntry[];
        permissionHistory?: StaffPermissionEntry[];
        error?: string;
      };
      if (!response.ok) {
        setMessage(payload.error ?? "Failed to load staff profile.");
        setDetailLoading(false);
        return;
      }
      setDetail(payload.staff ?? null);
      setActivity(payload.activity ?? []);
      setLoginHistory(payload.loginHistory ?? []);
      setPermissionHistory(payload.permissionHistory ?? []);
      setDetailLoading(false);
    },
    [activityModule],
  );

  useEffect(() => {
    startTransition(() => {
      void loadDirectory();
    });
  }, [loadDirectory]);

  useEffect(() => {
    void fetch("/api/super-admin/staff", { method: "PUT" });
  }, []);

  useEffect(() => {
    if (selectedId) {
      startTransition(() => {
        void loadDetail(selectedId);
      });
    }
  }, [loadDetail, selectedId]);

  const selectedStaff = useMemo(
    () => staff.find((member) => member.id === selectedId) ?? detail,
    [detail, selectedId, staff],
  );

  const runAction = useCallback(
    async (action: string, payload?: Record<string, unknown>) => {
      if (!selectedId) return;
      setMessage(null);
      const response = await fetch(`/api/super-admin/staff/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const result = (await response.json()) as { error?: string; staff?: StaffProfileDetail };
      if (!response.ok) {
        setMessage(result.error ?? "Action failed.");
        return;
      }
      setMessage("Staff profile updated.");
      await loadDirectory();
      await loadDetail(selectedId);
    },
    [loadDetail, loadDirectory, selectedId],
  );

  return (
    <EnterpriseEngineAdminShell
      moduleId="staff-profile"
      eyebrow="Super Admin"
      title="Staff Profile & Activity Audit"
      subtitle="Secure personnel management, multi-role assignments, and immutable activity auditing."
      tabs={[
        { id: "directory", label: "Staff Directory" },
        { id: "audit", label: "Activity Audit" },
      ]}
      activeTab={tab}
      onTabChange={setTab}
      message={message}
    >
      <div className="staff-profile">
        <Card padding="md" className="staff-profile__toolbar">
          <div className="staff-profile__toolbar-grid">
            <label className="staff-profile__field">
              <span>Search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="First name, last name, email, phone, role…"
              />
            </label>
            <label className="staff-profile__field">
              <span>Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as StaffStatus | "all")}>
                {STATUS_FILTERS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="staff-profile__field">
              <span>Role</span>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as StaffRoleId | "all")}
              >
                <option value="all">All roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="staff-profile__field">
              <span>Sort</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as StaffSort)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <div className="staff-profile__layout">
          <Card padding="none" className="staff-profile__list">
            {loading ? (
              <p className="staff-profile__empty">Loading staff directory…</p>
            ) : staff.length === 0 ? (
              <p className="staff-profile__empty">No staff members match your filters.</p>
            ) : (
              staff.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`staff-profile__list-item${selectedId === member.id ? " is-active" : ""}`}
                  onClick={() => {
                    setSelectedId(member.id);
                    setTab("audit");
                  }}
                >
                  <div className="staff-profile__list-item-head">
                    <strong>{member.fullName}</strong>
                    <Badge variant={statusVariant(member.status)}>{member.status}</Badge>
                  </div>
                  <RoleBadges roles={member.roles} />
                  <p className="staff-profile__muted">
                    Last login {formatDateTime(member.lastLoginAt)}
                  </p>
                </button>
              ))
            )}
          </Card>

          <div className="staff-profile__detail">
            {!selectedStaff ? (
              <Card padding="lg" className="staff-profile__placeholder">
                <h2>Select a staff member</h2>
                <p className="staff-profile__muted">
                  Choose a profile to view personal information, assigned roles, login history, and
                  the immutable activity audit timeline.
                </p>
              </Card>
            ) : detailLoading && !detail ? (
              <Card padding="lg">
                <p className="staff-profile__muted">Loading profile…</p>
              </Card>
            ) : (
              <>
                <Card padding="lg" className="staff-profile__section">
                  <div className="staff-profile__section-head">
                    <div>
                      <h2>{selectedStaff.fullName}</h2>
                      <RoleBadges roles={selectedStaff.roles} />
                    </div>
                    <Badge variant={statusVariant(selectedStaff.status)}>{selectedStaff.status}</Badge>
                  </div>

                  <div className="staff-profile__info-grid">
                    <div>
                      <dt>First Name</dt>
                      <dd>{selectedStaff.firstName}</dd>
                    </div>
                    <div>
                      <dt>Last Name</dt>
                      <dd>{selectedStaff.lastName}</dd>
                    </div>
                    <div>
                      <dt>Personal Email</dt>
                      <dd>{selectedStaff.personalEmail}</dd>
                    </div>
                    <div>
                      <dt>Phone Number</dt>
                      <dd>{selectedStaff.phoneNumber ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Registration Date</dt>
                      <dd>{formatDateTime(selectedStaff.registeredAt)}</dd>
                    </div>
                    <div>
                      <dt>Last Login</dt>
                      <dd>{formatDateTime(selectedStaff.lastLoginAt)}</dd>
                    </div>
                  </div>

                  <div className="staff-profile__quick-actions">
                    <label className="staff-profile__field staff-profile__field--inline">
                      <span>Assign Role</span>
                      <select
                        defaultValue=""
                        onChange={(event) => {
                          const roleId = event.target.value as StaffRoleId;
                          if (!roleId) return;
                          void runAction("assign_role", { roleId });
                          event.target.value = "";
                        }}
                      >
                        <option value="">Select role…</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button variant="secondary" onClick={() => void runAction("suspend")}>
                      Suspend
                    </Button>
                    <Button variant="secondary" onClick={() => void runAction("reactivate")}>
                      Reactivate
                    </Button>
                    <Button variant="secondary" onClick={() => void runAction("archive")}>
                      Archive
                    </Button>
                    <Button variant="secondary" onClick={() => void runAction("reset_password")}>
                      Reset Password
                    </Button>
                    <Button variant="secondary" onClick={() => void runAction("force_logout")}>
                      Force Logout
                    </Button>
                  </div>
                </Card>

                <Card padding="lg" className="staff-profile__section">
                  <div className="staff-profile__section-head">
                    <h3>Activity Audit</h3>
                    <select
                      value={activityModule}
                      onChange={(event) => {
                        const next = event.target.value as (typeof ACTIVITY_FILTERS)[number]["id"];
                        setActivityModule(next);
                        if (selectedId) void loadDetail(selectedId, next);
                      }}
                    >
                      {ACTIVITY_FILTERS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="staff-profile__timeline">
                    {activity.length === 0 ? (
                      <p className="staff-profile__muted">No activity recorded yet.</p>
                    ) : (
                      activity.map((entry) => (
                        <article key={entry.id} className="staff-profile__timeline-item">
                          <div className="staff-profile__timeline-meta">
                            <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
                            <Badge variant={entry.result === "success" ? "success" : "warning"}>
                              {entry.result}
                            </Badge>
                          </div>
                          <h4>{entry.action}</h4>
                          <p className="staff-profile__muted">{entry.module}</p>
                          <p className="staff-profile__timeline-device">
                            {[entry.browser, entry.operatingSystem, entry.device].filter(Boolean).join(" · ") ||
                              "Unknown device"}
                          </p>
                          {entry.ipAddressMasked ? (
                            <p className="staff-profile__muted">IP {entry.ipAddressMasked}</p>
                          ) : null}
                        </article>
                      ))
                    )}
                  </div>
                </Card>

                <div className="staff-profile__split">
                  <Card padding="lg" className="staff-profile__section">
                    <h3>Login History</h3>
                    <div className="staff-profile__table-wrap">
                      <table className="staff-profile__table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>IP</th>
                            <th>Browser</th>
                            <th>OS</th>
                            <th>Device</th>
                            <th>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginHistory.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="staff-profile__muted">
                                No login events recorded.
                              </td>
                            </tr>
                          ) : (
                            loginHistory.map((entry) => (
                              <tr key={entry.id}>
                                <td>{formatDateTime(entry.createdAt)}</td>
                                <td>{entry.status}</td>
                                <td>{entry.ipAddressMasked ?? "—"}</td>
                                <td>{entry.browser ?? "—"}</td>
                                <td>{entry.operatingSystem ?? "—"}</td>
                                <td>{entry.device ?? "—"}</td>
                                <td>
                                  {[entry.city, entry.country].filter(Boolean).join(", ") || "—"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Card padding="lg" className="staff-profile__section">
                    <h3>Permission History</h3>
                    <div className="staff-profile__permission-list">
                      {permissionHistory.length === 0 ? (
                        <p className="staff-profile__muted">No permission changes recorded.</p>
                      ) : (
                        permissionHistory.map((entry) => (
                          <div key={entry.id} className="staff-profile__permission-item">
                            <strong>
                              {entry.roleLabel} role {entry.changeType}
                            </strong>
                            <p className="staff-profile__muted">
                              {formatDateTime(entry.createdAt)}
                              {entry.performedByName ? ` · ${entry.performedByName}` : ""}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="staff-profile__footer-note">
          Super Admin only. Personal email and phone are encrypted at rest. Audit logs are immutable.
          Marketplace users are managed separately in{" "}
          <Link href="/super-admin/users">User Management</Link>.
        </p>
      </div>
    </EnterpriseEngineAdminShell>
  );
}
