"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { LiveServiceStatus } from "@/lib/super-admin/operations/types";
import { SEVERITY_BADGE, SEVERITY_DOT } from "@/features/super-admin/operations/utils";

export function AiLiveMonitoringSection({ services }: { services: LiveServiceStatus[] }) {
  return (
    <section className="ai-ops-section">
      <h2 className="text-lg font-semibold text-text-primary">Live Monitoring</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">Real-time integration and subsystem status.</p>

      <div className="mt-ds-4 grid gap-ds-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((service) => (
          <Card
            key={service.id}
            padding="sm"
            className="premium-glass flex items-center justify-between gap-ds-3 border border-border/70"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{service.label}</p>
              <p className="mt-ds-1 truncate text-xs text-text-secondary">{service.detail}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-ds-1">
              <span className={`h-3 w-3 rounded-full ${SEVERITY_DOT[service.status]}`} aria-hidden />
              <Badge variant={SEVERITY_BADGE[service.status]}>{service.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
