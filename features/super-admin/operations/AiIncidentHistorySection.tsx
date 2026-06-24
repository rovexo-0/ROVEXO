"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { IncidentRecord } from "@/lib/super-admin/operations/types";

const STATUS_VARIANT: Record<IncidentRecord["status"], "success" | "warning" | "danger"> = {
  completed: "success",
  failed: "danger",
  rolled_back: "warning",
};

export function AiIncidentHistorySection({ incidents }: { incidents: IncidentRecord[] }) {
  return (
    <section className="ai-ops-section">
      <h2 className="text-lg font-semibold text-text-primary">Incident History</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">AI-assisted repairs and rollback availability.</p>

      <Card padding="none" className="premium-card mt-ds-4 overflow-hidden border border-border/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/60 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-ds-4 py-ds-3 font-semibold">Date</th>
                <th className="px-ds-4 py-ds-3 font-semibold">Issue</th>
                <th className="px-ds-4 py-ds-3 font-semibold">AI Solution</th>
                <th className="px-ds-4 py-ds-3 font-semibold">Repair Time</th>
                <th className="px-ds-4 py-ds-3 font-semibold">Status</th>
                <th className="px-ds-4 py-ds-3 font-semibold">Rollback</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-ds-4 py-ds-6 text-center text-text-secondary">
                    No incidents recorded yet.
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id} className="border-b border-border/60 last:border-0">
                    <td className="px-ds-4 py-ds-3 whitespace-nowrap text-text-secondary">
                      {new Date(incident.date).toLocaleString()}
                    </td>
                    <td className="px-ds-4 py-ds-3 text-text-primary">{incident.issue}</td>
                    <td className="max-w-xs px-ds-4 py-ds-3 text-text-secondary">{incident.aiSolution}</td>
                    <td className="px-ds-4 py-ds-3 text-text-secondary">{incident.repairTimeMs}ms</td>
                    <td className="px-ds-4 py-ds-3">
                      <Badge variant={STATUS_VARIANT[incident.status]}>{incident.status}</Badge>
                    </td>
                    <td className="px-ds-4 py-ds-3 text-text-secondary">
                      {incident.rollbackAvailable ? "Yes" : "No"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
