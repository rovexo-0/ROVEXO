import { SuperAdminAuditLog } from "@/features/super-admin/components/SuperAdminAuditLog";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { requireSuperAdmin } from "@/lib/auth/session";
import { getSuperAdminSecuritySnapshot } from "@/lib/super-admin/insights";

export default async function SuperAdminSecurityPage() {
  const { user } = await requireSuperAdmin();
  const snapshot = await getSuperAdminSecuritySnapshot(user.id);

  return (
    <>
      <SuperAdminPageHeader
        title="Security"
        description="Audit logs, session oversight, rate limiting, and platform security controls."
      />
      <div className="mb-ds-6 grid gap-ds-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-text-secondary">Active Sessions</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.activeSessions}</p>
        </Card>
        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-text-secondary">Registered Devices</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.registeredDevices.length}</p>
        </Card>
        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-text-secondary">Failed Login Attempts (24h)</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.failedLoginAttempts24h}</p>
        </Card>
        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-text-secondary">Last Login</p>
          <p className="mt-ds-1 text-sm font-semibold">
            {snapshot.lastLogin ? new Date(snapshot.lastLogin).toLocaleString("en-GB") : "Unknown"}
          </p>
        </Card>
        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm text-text-secondary">Last IP</p>
          <p className="mt-ds-1 text-sm font-semibold">{snapshot.lastIp ?? "Not recorded"}</p>
        </Card>
        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <p className="font-semibold">Single Super Admin</p>
          <p className="mt-ds-1 text-sm text-text-secondary">Only one super_admin account can exist on ROVEXO.</p>
          <Badge className="mt-ds-3" variant="success">
            Enforced
          </Badge>
        </Card>
      </div>

      {snapshot.registeredDevices.length ? (
        <Card padding="md" className="mb-ds-6 bg-white">
          <h3 className="font-semibold">Registered devices</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {snapshot.registeredDevices.map((device) => (
              <li key={device.id} className="flex items-center justify-between gap-ds-3 border-b border-border pb-ds-2">
                <span>{device.platform ?? "unknown"}</span>
                <span className="text-xs text-text-muted">
                  {device.updated_at ? new Date(device.updated_at).toLocaleString("en-GB") : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <SuperAdminAuditLog />
    </>
  );
}
