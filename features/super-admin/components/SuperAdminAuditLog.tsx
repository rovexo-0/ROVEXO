"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type AuditEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function SuperAdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/super-admin/audit?limit=100");
      const payload = (await response.json()) as { entries?: AuditEntry[] };
      setEntries(payload.entries ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-text-secondary">Loading audit log…</p>;
  }

  return (
    <div className="space-y-ds-2">
      {entries.map((entry) => (
        <Card key={entry.id} padding="md" className="bg-white">
          <div className="flex flex-wrap items-start justify-between gap-ds-2">
            <div>
              <p className="font-semibold text-text-primary">{entry.action}</p>
              <p className="text-sm text-text-secondary">
                {entry.resource_type}
                {entry.resource_id ? ` · ${entry.resource_id}` : ""}
              </p>
            </div>
            <p className="text-xs text-text-muted">
              {new Date(entry.created_at).toLocaleString("en-GB")}
            </p>
          </div>
        </Card>
      ))}
      {entries.length === 0 ? (
        <Card padding="md" className="bg-white">
          <p className="text-sm text-text-secondary">No audit entries yet.</p>
        </Card>
      ) : null}
    </div>
  );
}
