"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { MonitoringWidget } from "@/lib/super-admin/insights";

const STATUS_VARIANT: Record<MonitoringWidget["status"], "success" | "warning" | "danger"> = {
  healthy: "success",
  degraded: "warning",
  unhealthy: "danger",
};

const STATUS_DOT: Record<MonitoringWidget["status"], string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  unhealthy: "bg-red-500",
};

type SuperAdminMonitoringWidgetsProps = {
  widgets: MonitoringWidget[];
};

export function SuperAdminMonitoringWidgets({ widgets }: SuperAdminMonitoringWidgetsProps) {
  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Live monitoring</h3>
      <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-5">
        {widgets.map((widget) => (
          <Card key={widget.id} padding="md" className="bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-ds-2">
              <p className="text-sm font-medium text-text-primary">{widget.label}</p>
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[widget.status]}`} aria-hidden />
            </div>
            <div className="mt-ds-2">
              <Badge variant={STATUS_VARIANT[widget.status]}>{widget.status}</Badge>
            </div>
            <p className="mt-ds-2 text-xs text-text-secondary">{widget.detail}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
