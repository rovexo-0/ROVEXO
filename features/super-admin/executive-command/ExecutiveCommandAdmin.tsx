"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { cn } from "@/lib/cn";
import { EXECUTIVE_ACTIONS, EXECUTIVE_EXPORT_TYPES } from "@/lib/executive-command-engine/registry";
import type { ExecutiveCommandSnapshot, ExecutiveLiveMetric } from "@/lib/executive-command-engine/types";

type ExecutiveCommandAdminProps = {
  initialSnapshot: ExecutiveCommandSnapshot;
};

function MetricCard({ metric, className }: { metric: ExecutiveLiveMetric; className?: string }) {
  return (
    <div className={cn("ecc-metric", !metric.available && "ecc-metric--unavailable", className)}>
      <span>{metric.label}</span>
      <strong>{metric.display}</strong>
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: ExecutiveLiveMetric[] }) {
  return (
    <div className="ecc-metric-grid">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  );
}

export function ExecutiveCommandAdmin({ initialSnapshot }: ExecutiveCommandAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch("/api/super-admin/mobile/omega/executive-command");
    const data = (await response.json()) as { executiveCommand?: ExecutiveCommandSnapshot };
    if (data.executiveCommand) setSnapshot(data.executiveCommand);
  }, []);

  const runAction = useCallback((action: string, payload?: Record<string, string>) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/mobile/omega/executive-command/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: ExecutiveCommandSnapshot };
      setMessage(response.ok ? "Action completed." : data.error ?? "Action failed.");
      if (data.snapshot) setSnapshot(data.snapshot);
      else await refresh();
    });
  }, [refresh]);

  const platformMetrics = Object.values(snapshot.platformHealth);
  const businessMetrics = Object.values(snapshot.business);
  const infraMetrics = Object.values(snapshot.infrastructure);
  const securityMetrics = Object.values(snapshot.security);
  const performanceMetrics = [
    snapshot.performance.apiResponseTime,
    snapshot.performance.databaseSpeed,
    snapshot.performance.cacheStatus,
    snapshot.performance.performanceScore,
    snapshot.performance.currentLoad,
    snapshot.performance.systemAvailability,
  ];
  const incidentMetrics = Object.values(snapshot.incidentSummary);
  const maxTrend = Math.max(...snapshot.performance.trend.filter((t) => t.available && t.value !== null).map((t) => t.value!), 1);

  return (
    <EnterpriseAdminShell
      moduleId="executive-command"
      eyebrow="OMEGA Enterprise · ORI Executive Intelligence"
      title="Executive Command Center"
      description={snapshot.summary}
      enterpriseScore={typeof snapshot.platformHealth.overall.value === "number" ? snapshot.platformHealth.overall.value : 100}
      isPending={isPending}
      message={message}
      aiInsight="OMEGA PRIME: Executive Command Center is production ready for global enterprise audit."
      actions={
        <Button disabled={isPending} variant="secondary" onClick={refresh}>Refresh Live Data</Button>
      }
      quickLinks={[
        { label: "OMEGA Command", href: "/super-admin/mobile/omega" },
        { label: "Incident Command", href: "/super-admin/mobile/incidents" },
        { label: "Device Lifecycle", href: "/super-admin/mobile-distribution/devices" },
      ]}
    >
      <section className="ea-panel ea-panel--wide">
        <h3>Data Availability</h3>
        <div className="ecc-availability">
          <div><strong>Live sources</strong><p>{snapshot.dataSourcesAvailable.join(" · ") || "None"}</p></div>
          <div><strong>Unavailable</strong><p>{snapshot.dataSourcesUnavailable.join(" · ") || "None"}</p></div>
        </div>
      </section>

      <div className="ecc-grid">
        <section className="ea-panel ea-panel--wide">
          <h3>Platform Health</h3>
          <MetricGrid metrics={platformMetrics} />
        </section>

        <section className="ea-panel">
          <h3>Critical Incidents</h3>
          <MetricGrid metrics={incidentMetrics} />
        </section>

        <section className="ea-panel ea-panel--wide">
          <h3>Incident Feed</h3>
          <ul className="ea-list">
            {snapshot.incidents.length ? snapshot.incidents.slice(0, 8).map((incident) => (
              <li key={incident.id} className={`ecc-incident ecc-incident--${incident.severity}`}>
                <div className="ecc-incident__head">
                  <strong>{incident.title}</strong>
                  <span>{incident.severity.toUpperCase()}</span>
                </div>
                <dl className="ecc-dl ecc-dl--compact">
                  <div><dt>Status</dt><dd>{incident.status}</dd></div>
                  <div><dt>Module</dt><dd>{incident.module}</dd></div>
                  <div><dt>Time</dt><dd>{new Date(incident.time).toLocaleString()}</dd></div>
                  <div><dt>Action</dt><dd>{incident.recommendedAction}</dd></div>
                </dl>
              </li>
            )) : (
              <li className="ecc-empty">No live incidents reported.</li>
            )}
          </ul>
        </section>

        <section className="ea-panel">
          <h3>Infrastructure</h3>
          <MetricGrid metrics={infraMetrics} />
        </section>

        <section className="ea-panel">
          <h3>Business Overview</h3>
          <MetricGrid metrics={businessMetrics} />
        </section>

        <section className="ea-panel ea-panel--wide">
          <h3>Certification Status</h3>
          <div className="ecc-cert-grid">
            {snapshot.certifications.map((cert) => (
              <div key={cert.id} className={cn("ecc-cert", cert.status === "pass" && "ecc-cert--pass", cert.status === "warning" && "ecc-cert--warning", cert.status === "fail" && "ecc-cert--fail", cert.status === "unavailable" && "ecc-cert--na")}>
                <strong>{cert.label}</strong>
                <span>{cert.status === "unavailable" ? "NO LIVE DATA" : cert.status.toUpperCase()}</span>
                <p>{cert.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ea-panel">
          <h3>Security Overview</h3>
          <MetricGrid metrics={securityMetrics} />
        </section>

        <section className="ea-panel">
          <h3>Performance</h3>
          <MetricGrid metrics={performanceMetrics} />
          <div className="ecc-chart" role="img" aria-label="Performance trend">
            {snapshot.performance.trend.map((point) => (
              <div key={point.label} className="ecc-chart__bar-wrap">
                <div
                  className={cn("ecc-chart__bar", !point.available && "ecc-chart__bar--na")}
                  style={{ height: point.available && point.value !== null ? `${(point.value / maxTrend) * 100}%` : "12px" }}
                />
                <span>{point.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ea-panel ea-panel--wide">
          <h3>ORI Executive Recommendations</h3>
          <ul className="ea-list">
            {snapshot.oriRecommendations.map((rec) => (
              <li key={rec.id} className="ecc-ori">
                <span className="ecc-ori__priority">Priority {rec.priority}</span>
                <strong>{rec.title}</strong>
                <p><em>Actions:</em> {rec.recommendedActions}</p>
                <p><em>Impact:</em> {rec.estimatedImpact}</p>
                <p><em>Risk:</em> {rec.estimatedRisk}</p>
                <p><em>Improvement:</em> {rec.expectedImprovement}</p>
                {rec.dataNote ? <p className="ecc-ori__note">{rec.dataNote}</p> : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="ea-panel">
          <h3>Executive Actions</h3>
          <div className="ecc-action-grid">
            {EXECUTIVE_ACTIONS.map((action) => {
              if ("href" in action && action.href) {
                return <Link key={action.id} href={action.href} className="ea-link">{action.label}</Link>;
              }
              const item = action as Extract<(typeof EXECUTIVE_ACTIONS)[number], { action: string }>;
              return (
                <Button key={item.id} disabled={isPending} variant="secondary" onClick={() => runAction(item.action)}>
                  {item.label}
                </Button>
              );
            })}
          </div>
        </section>

        <section className="ea-panel">
          <h3>Export</h3>
          <div className="ecc-export-grid">
            {EXECUTIVE_EXPORT_TYPES.map((item) => (
              <Button
                key={item.id}
                disabled={isPending}
                variant="secondary"
                onClick={() => runAction("export", { exportId: item.id, format: item.format })}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {snapshot.exports.length ? (
            <ul className="ea-list">
              {snapshot.exports.slice(0, 5).map((item) => (
                <li key={item.id}>{item.label} · {item.format.toUpperCase()} · {new Date(item.generatedAt).toLocaleString()}</li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </EnterpriseAdminShell>
  );
}
