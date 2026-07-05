import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { DatabaseHealthSnapshot } from "@/lib/super-admin/database-health/types";

function statusVariant(status: string): "success" | "warning" | "danger" | "default" {
  if (status === "healthy") return "success";
  if (status === "degraded") return "warning";
  if (status === "unhealthy") return "danger";
  return "default";
}

type DatabaseCommandCenterProps = {
  snapshot: DatabaseHealthSnapshot;
};

export function DatabaseCommandCenter({ snapshot }: DatabaseCommandCenterProps) {
  return (
    <div className="space-y-ds-6">
      <section className="grid gap-ds-4 md:grid-cols-2 xl:grid-cols-4">
        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Database</p>
          <div className="mt-ds-2 flex items-center gap-ds-2">
            <Badge variant={statusVariant(snapshot.connection.status)}>{snapshot.connection.status}</Badge>
            {snapshot.connection.message ? (
              <span className="text-sm text-text-secondary">{snapshot.connection.message}</span>
            ) : null}
          </div>
        </Card>
        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Migrations</p>
          <p className="mt-ds-2 text-2xl font-bold text-text-primary">{snapshot.migrations.total}</p>
          <p className="text-sm text-text-secondary">Latest: {snapshot.migrations.latest ?? "—"}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Storage</p>
          <div className="mt-ds-2 flex items-center gap-ds-2">
            <Badge variant={statusVariant(snapshot.storage.status)}>{snapshot.storage.status}</Badge>
            <span className="text-sm text-text-secondary">{snapshot.storage.buckets.length} buckets</span>
          </div>
        </Card>
        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">RLS</p>
          <p className="mt-ds-2 text-sm text-text-primary">{snapshot.rls.note}</p>
        </Card>
      </section>

      <section className="grid gap-ds-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card padding="md">
          <h2 className="text-base font-semibold text-text-primary">Core tables</h2>
          <div className="mt-ds-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-ds-2 pr-ds-4">Table</th>
                  <th className="py-ds-2 pr-ds-4">Rows</th>
                  <th className="py-ds-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.tables.map((table) => (
                  <tr key={table.name} className="border-b border-border/60">
                    <td className="py-ds-2 pr-ds-4 font-medium">{table.name}</td>
                    <td className="py-ds-2 pr-ds-4">
                      {table.rowCount === null ? "—" : table.rowCount.toLocaleString()}
                    </td>
                    <td className="py-ds-2">
                      <Badge variant={table.accessible ? "success" : "danger"}>
                        {table.accessible ? "accessible" : "error"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-ds-4">
          <Card padding="md">
            <h2 className="text-base font-semibold text-text-primary">Recent migrations</h2>
            <ul className="mt-ds-3 space-y-ds-2 text-sm">
              {snapshot.migrations.files.map((migration) => (
                <li key={migration.id} className="rounded-ds-md border border-border px-ds-3 py-ds-2">
                  <code className="text-xs">{migration.filename}</code>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="md">
            <h2 className="text-base font-semibold text-text-primary">Storage buckets</h2>
            <ul className="mt-ds-3 space-y-ds-2 text-sm">
              {snapshot.storage.buckets.length ? (
                snapshot.storage.buckets.map((bucket) => (
                  <li key={bucket.id} className="flex items-center justify-between gap-ds-2">
                    <span className="font-medium">{bucket.name}</span>
                    <Badge variant={bucket.public ? "warning" : "default"}>
                      {bucket.public ? "public" : "private"}
                    </Badge>
                  </li>
                ))
              ) : (
                <li className="text-text-secondary">No buckets reported.</li>
              )}
            </ul>
          </Card>

          <Card padding="md">
            <h2 className="text-base font-semibold text-text-primary">Related tools</h2>
            <div className="mt-ds-3 flex flex-col gap-ds-2 text-sm">
              <Link href="/super-admin/recovery" className="font-medium text-primary">
                Backups & Recovery →
              </Link>
              <Link href="/super-admin/development/database-studio" className="font-medium text-primary">
                Development Database Studio →
              </Link>
              <Link href="/super-admin/audit" className="font-medium text-primary">
                Audit & Compliance →
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
