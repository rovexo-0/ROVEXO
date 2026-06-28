"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-governance-center/descriptor";
import { ENTERPRISE_GOVERNANCE_API, ENTERPRISE_GOVERNANCE_ROUTES } from "@/lib/enterprise-governance-center/registry";
import type { GovernanceSnapshot, GovernanceTab } from "@/lib/enterprise-governance-center/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = ENTERPRISE_GOVERNANCE_ROUTES.filter((r) => r.id !== "constitution-alt");
const MODULE_ID = ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.id;

type EnterpriseGovernanceAdminProps = { initialSnapshot: GovernanceSnapshot; defaultTab?: GovernanceTab };

export function EnterpriseGovernanceAdmin({ initialSnapshot, defaultTab = "constitution" }: EnterpriseGovernanceAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { governance?: GovernanceSnapshot };
    if (data.governance) setSnapshot(data.governance);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "scan" ? ENTERPRISE_GOVERNANCE_API.scan
            : action === "validate" ? ENTERPRISE_GOVERNANCE_API.validate
              : action === "certify" ? ENTERPRISE_GOVERNANCE_API.certify
                : action === "export" ? ENTERPRISE_GOVERNANCE_API.export
                  : action === "report" ? ENTERPRISE_GOVERNANCE_API.report
                    : ENTERPRISE_GOVERNANCE_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; governance?: GovernanceSnapshot };
        setMessage(response.ok ? "Governance action completed." : data.error ?? "Action failed.");
        if (data.governance) setSnapshot(data.governance);
        else await refresh();
      });
    },
    [refresh],
  );

  const validations = createOmegaValidations(
    undefined,
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "constitution"
    ? {
        ...createDefaultEnterpriseDashboard("Governance"),
        kpis: [
          { id: "overall", label: "Overall Score", value: `${snapshot.overallScore}%`, status: "healthy" as const },
          { id: "modules", label: "Modules Tracked", value: snapshot.moduleCompliance.length, status: "healthy" as const },
          { id: "certificates", label: "Certificates", value: snapshot.certificates.length, status: "healthy" as const },
          {
            id: "violations",
            label: "Violations",
            value: snapshot.architectureViolations.length,
            status: snapshot.architectureViolations.length > 0 ? "warning" as const : "healthy" as const,
          },
        ],
        recentActivity: snapshot.auditEntries.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: ["Constitution, certification, and validation authority are OMEGA certified."],
        quickActions: [
          { label: "Module Registry", href: "/super-admin/module-registry" },
          { label: "OMEGA", href: "/super-admin/omega" },
          { label: "Certification Center", href: "/super-admin/certification" },
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Governance Center"
      title="Enterprise Constitution & Certification Authority"
      description="Highest platform authority — constitution, architecture governance, compliance, certification, and validation."
      enterpriseScore={snapshot.overallScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={snapshot.pendingPublish ? "Pending publish — draft differs from live." : undefined}
      aiInsight="OMEGA PRIME: Governance Center is production ready for global enterprise audit."
      showDashboard={activeTab === "constitution"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Full Validation</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("scan")}>Architecture Scan</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("certify")}>Issue Certificate</Button>
        </>
      }
      quickLinks={[
        { label: "Module Registry", href: "/super-admin/module-registry" },
        { label: "OMEGA", href: "/super-admin/omega" },
        { label: "Certification Center", href: "/super-admin/certification" },
      ]}
    >
      {activeTab === "constitution" && (
        <section className="ea-panel">
          <h3>Official Enterprise Constitution v{snapshot.settings.constitutionVersion}</h3>
          <ul className="ea-list">
            {snapshot.constitution.map((a) => (
              <li key={a.id}><strong>{a.title}</strong> — {a.summary} (v{a.version})</li>
            ))}
          </ul>
          <h4>Amendments</h4>
          <ul className="ea-list">
            {snapshot.amendments.map((a) => (
              <li key={a.id}>{a.section}: {a.summary} — {new Date(a.date).toLocaleDateString()}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "architecture" && (
        <section className="ea-panel">
          <h3>Architecture Governance</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Severity</th><th>Message</th><th>Module</th></tr></thead>
            <tbody>
              {snapshot.architectureViolations.map((v) => (
                <tr key={v.id}>
                  <td>{v.check}</td>
                  <td className={v.severity === "high" ? "ea-fail" : ""}>{v.severity}</td>
                  <td>{v.message}</td>
                  <td>{v.moduleId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "compliance" && (
        <section className="ea-panel">
          <h3>Enterprise Compliance</h3>
          <table className="ea-table">
            <thead><tr><th>Module</th><th>Status</th><th>Categories</th></tr></thead>
            <tbody>
              {snapshot.moduleCompliance.map((m) => (
                <tr key={m.moduleId}>
                  <td>{m.label}</td>
                  <td className={m.status === "pass" ? "ea-pass" : m.status === "warning" ? "ea-warn" : "ea-fail"}>{m.status.toUpperCase()}</td>
                  <td>{Object.values(m.categories).filter((s) => s === "pass").length}/{Object.keys(m.categories).length} pass</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "enterprise-rules" && (
        <section className="ea-panel">
          <h3>Enterprise Rule Engine</h3>
          <ul className="ea-list">
            {snapshot.rules.map((r) => (
              <li key={r.id}><strong>{r.name}</strong> — {r.scope} · {r.enabled ? "enabled" : "disabled"} · {r.violations} violations</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "technical-debt" && (
        <section className="ea-panel">
          <h3>Technical Debt Center</h3>
          <div className="ea-grid">
            {snapshot.technicalDebt.map((d) => (
              <div key={d.category} className="ea-card">
                <span>{d.category}</span>
                <strong>{d.score}</strong>
                <small>{d.items} items · {d.trend}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "enterprise-score" && (
        <section className="ea-panel">
          <h3>Enterprise Score</h3>
          <dl className="ea-metrics">
            {snapshot.enterpriseScores.map((s) => (
              <div key={s.domain}><dt>{s.label}</dt><dd>{s.score}%</dd></div>
            ))}
            <div><dt>Overall</dt><dd>{snapshot.overallScore}%</dd></div>
          </dl>
        </section>
      )}

      {activeTab === "certification" && (
        <section className="ea-panel">
          <h3>Certification Center</h3>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("certify")}>Generate ROVEXO Enterprise Certificate</Button>
          <ul className="ea-list">
            {snapshot.certificates.map((c) => (
              <li key={c.id}>
                <strong>{c.id}</strong> — {c.checksPassed}/{c.checksTotal} checks · signed {new Date(c.issuedAt).toLocaleString()} · {c.immutable ? "immutable" : "draft"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "audit" && (
        <section className="ea-panel">
          <h3>Audit Center</h3>
          <table className="ea-table">
            <thead><tr><th>Type</th><th>Action</th><th>Actor</th><th>Target</th><th>Time</th></tr></thead>
            <tbody>
              {snapshot.auditEntries.map((e) => (
                <tr key={e.id}>
                  <td>{e.type}</td>
                  <td>{e.action}</td>
                  <td>{e.actor}</td>
                  <td>{e.target}</td>
                  <td>{new Date(e.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "validation" && (
        <section className="ea-panel">
          <h3>Validation Center</h3>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Full Enterprise Validation</Button>
          <ul className="ea-list">
            {snapshot.validationRuns.map((v) => (
              <li key={v.id}>
                {v.id} — {v.status} · {v.stagesCompleted.length} stages completed
                {v.completedAt && ` · ${new Date(v.completedAt).toLocaleString()}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>Reports</h3>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("report", { reportType: "governance" })}>Governance Report</Button>
          </div>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}
