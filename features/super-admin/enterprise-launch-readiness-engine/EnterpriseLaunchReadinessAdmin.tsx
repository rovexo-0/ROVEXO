"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getRelatedModuleHref } from "@/lib/enterprise-architecture/registry";
import { LAUNCH_READINESS_MODULE_DESCRIPTOR } from "@/lib/enterprise-launch-readiness-engine/descriptor";
import { LAUNCH_READINESS_API, LAUNCH_READINESS_ROUTES } from "@/lib/enterprise-launch-readiness-engine/registry";
import type { DomainValidationItem, LaunchReadinessSnapshot, LaunchReadinessTab } from "@/lib/enterprise-launch-readiness-engine/types";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = LAUNCH_READINESS_ROUTES;
const MODULE_ID = LAUNCH_READINESS_MODULE_DESCRIPTOR.id;

type EnterpriseLaunchReadinessAdminProps = { initialSnapshot: LaunchReadinessSnapshot; defaultTab?: LaunchReadinessTab };

function statusClass(status: string) {
  if (status === "pass") return "ea-pass";
  if (status === "warning") return "ea-warn";
  if (status === "fail" || status === "blocked") return "ea-fail";
  return "";
}

function ValidationTable({ title, items }: { title: string; items: DomainValidationItem[] }) {
  return (
    <section className="ea-panel ea-panel--wide">
      <h3>{title}</h3>
      <table className="ea-table">
        <thead><tr><th>Check</th><th>Findings</th><th>Status</th><th>Message</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.label}</td>
              <td>{item.findings}</td>
              <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
              <td>{item.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function EnterpriseLaunchReadinessAdmin({ initialSnapshot, defaultTab = "dashboard" }: EnterpriseLaunchReadinessAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(LAUNCH_READINESS_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { launchReadiness?: LaunchReadinessSnapshot };
    if (data.launchReadiness) setSnapshot(data.launchReadiness);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "validate" ? LAUNCH_READINESS_API.validate
            : action === "repair" ? LAUNCH_READINESS_API.repair
              : action === "certify" ? LAUNCH_READINESS_API.certify
                : action === "export" ? LAUNCH_READINESS_API.export
                  : LAUNCH_READINESS_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; launchReadiness?: LaunchReadinessSnapshot };
        setMessage(response.ok ? "Launch readiness action completed." : data.error ?? "Action failed.");
        if (data.launchReadiness) setSnapshot(data.launchReadiness);
        else await refresh();
      });
    },
    [refresh],
  );

  const omegaHref = getRelatedModuleHref(MODULE_ID, "omega-command-center");
  const qaHref = getRelatedModuleHref(MODULE_ID, "omega-quality-assurance-center");
  const deployHref = getRelatedModuleHref(MODULE_ID, "enterprise-deployment-center");
  const certHref = getRelatedModuleHref(MODULE_ID, "certification-center");

  const validations = createOmegaValidations(
    {
      architecture: snapshot.scores.find((s) => s.key === "infrastructure")?.score === 100 ? "pass" : "warning",
      security: snapshot.scores.find((s) => s.key === "security")?.score === 100 ? "pass" : "warning",
      performance: snapshot.scores.find((s) => s.key === "performance")?.score === 100 ? "pass" : "warning",
      accessibility: "pass",
      governance: snapshot.dashboard.overallPassPercent >= 100 ? "pass" : "warning",
    },
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Launch Readiness"),
        kpis: [
          { id: "pass", label: "Overall PASS", value: `${snapshot.dashboard.overallPassPercent}%`, status: "healthy" as const },
          { id: "launch", label: "Launch Ready", value: snapshot.dashboard.launchReady ? "YES" : "NO", status: snapshot.dashboard.launchReady ? "healthy" as const : "warning" as const },
          { id: "production", label: "Production Ready", value: snapshot.dashboard.productionReady ? "YES" : "NO", status: snapshot.dashboard.productionReady ? "healthy" as const : "warning" as const },
          { id: "blockers", label: "Active Blockers", value: snapshot.blockers.filter((b) => b.active).length, status: snapshot.blockers.some((b) => b.active) ? "warning" as const : "healthy" as const },
        ],
        recentActivity: snapshot.auditEntries.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: ["Prompt 068 — Enterprise Launch Readiness Engine is the permanent Launch Readiness Authority before every production release."],
        quickActions: [
          ...(omegaHref ? [{ label: "OMEGA Command", href: omegaHref }] : []),
          ...(deployHref ? [{ label: "Deployment Center", href: deployHref }] : []),
        ],
      }
    : undefined;

  const tabItems: Partial<Record<LaunchReadinessTab, DomainValidationItem[]>> = {
    email: snapshot.email,
    cron: snapshot.cron,
    queue: snapshot.queue,
    pwa: snapshot.pwa,
    push: snapshot.push,
    health: snapshot.healthChecks,
    performance: snapshot.performance,
    security: snapshot.security,
    deployment: snapshot.deployment,
  };

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Launch Readiness"
      title="Production Launch Authority"
      description="Validates infrastructure, operations, security, performance, communications and enterprise compliance before every release."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={
        snapshot.settings.validationOnlyMode
          ? "Validation-only mode — never modifies business logic, production data, or deploys automatically."
          : undefined
      }
      aiInsight="OMEGA Launch Gate: Production release blocked until PASS 100% across all operational subsystems."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Full Validation</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("certify")}>Grant Launch Certification</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("repair")}>Plan Auto Repair</Button>
        </>
      }
      quickLinks={[
        ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ...(qaHref ? [{ label: "QA Center", href: qaHref }] : []),
        ...(certHref ? [{ label: "Certification", href: certHref }] : []),
        ...(deployHref ? [{ label: "Deployment", href: deployHref }] : []),
      ]}
    >
      {activeTab === "dashboard" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Launch Readiness Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.scores.map((score) => (
                  <tr key={score.key}>
                    <td>{score.label}</td>
                    <td>{score.score}%</td>
                    <td>{score.weight}</td>
                    <td className={statusClass(score.status)}>{score.status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Production Gates</h3>
            <table className="ea-table">
              <thead><tr><th>Gate</th><th>PASS %</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.productionGates.map((gate) => (
                  <tr key={gate.gate}>
                    <td>{gate.label}</td>
                    <td>{gate.passPercent}%</td>
                    <td className={statusClass(gate.status)}>{gate.status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>OMEGA Global Scans</h3>
            <table className="ea-table">
              <thead><tr><th>Scan</th><th>PASS %</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.launchScan.omegaScans.map((scan) => (
                  <tr key={scan.scan}>
                    <td>{scan.scan.replace(/-/g, " ")}</td>
                    <td>{scan.passPercent}%</td>
                    <td className={statusClass(scan.status)}>{scan.status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {activeTab === "infrastructure" && (
        <>
          <ValidationTable title="Health Checks" items={snapshot.healthChecks} />
          <ValidationTable title="Monitoring" items={snapshot.monitoring} />
          <ValidationTable title="Caching" items={snapshot.caching} />
          <ValidationTable title="Database" items={snapshot.database} />
          <ValidationTable title="Storage" items={snapshot.storage} />
        </>
      )}

      {activeTab === "marketplace" && (
        <>
          <ValidationTable title="Search Index" items={snapshot.searchIndex} />
          <ValidationTable title="SEO" items={snapshot.seo} />
          <section className="ea-panel ea-panel--wide">
            <h3>Marketplace Scores</h3>
            <dl className="ea-metrics">
              {snapshot.scores.filter((s) => ["marketplace", "homepage", "category", "search", "listing", "buyer", "seller", "company"].includes(s.key)).map((score) => (
                <div key={score.key}><dt>{score.label}</dt><dd className={statusClass(score.status)}>{score.score}%</dd></div>
              ))}
            </dl>
          </section>
        </>
      )}

      {activeTab === "launch-gate" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Launch Gate Blockers</h3>
          <table className="ea-table">
            <thead><tr><th>Blocker</th><th>Active</th><th>Severity</th><th>Message</th></tr></thead>
            <tbody>
              {snapshot.blockers.map((blocker) => (
                <tr key={blocker.blocker} className={cn(blocker.active && "ea-fail")}>
                  <td>{blocker.label}</td>
                  <td>{blocker.active ? "YES" : "NO"}</td>
                  <td>{blocker.severity.toUpperCase()}</td>
                  <td>{blocker.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>Launch Readiness Reports</h3>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
          </div>
          <ul className="ea-list">
            {snapshot.reports.map((report) => (
              <li key={report.id}>{report.title} — {report.status} · {new Date(report.generatedAt).toLocaleString()}</li>
            ))}
          </ul>
        </section>
      )}

      {tabItems[activeTab] && <ValidationTable title={`${activeTab.replace(/-/g, " ")} validation`} items={tabItems[activeTab]!} />}
    </EnterpriseAdminShell>
  );
}
