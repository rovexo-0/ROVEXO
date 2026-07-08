import type { ResolutionMonitorStats } from "@/lib/resolution-engine/types";

type ResolutionMonitorAdminProps = {
  stats: ResolutionMonitorStats;
};

export function ResolutionMonitorAdmin({ stats }: ResolutionMonitorAdminProps) {
  const metrics = [
    { label: "Open cases", value: stats.openCases },
    { label: "Processing", value: stats.processingCases },
    { label: "Refunded", value: stats.refundedCases },
    { label: "Closed", value: stats.closedCases },
    { label: "Carrier claims open", value: stats.carrierClaimsOpen },
    { label: "Automation actions (24h)", value: stats.automationActions24h },
  ];

  return (
    <section className="rounded-ds-lg border border-border bg-surface p-ds-5">
      <header className="mb-ds-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Resolution Engine</p>
        <h2 className="text-lg font-semibold text-text-primary">Automated resolution monitor</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Monitor-only dashboard. All standard cases resolve automatically — no operational buttons.
        </p>
      </header>
      <div className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-ds-md bg-surface-muted px-ds-4 py-ds-3">
            <p className="text-xs text-text-muted">{metric.label}</p>
            <p className="mt-ds-1 text-lg font-semibold text-text-primary">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
