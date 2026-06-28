"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-governance-center/descriptor";
import { ENTERPRISE_GOVERNANCE_API, ENTERPRISE_GOVERNANCE_ROUTES } from "@/lib/enterprise-governance-center/registry";
import type { GovernanceSnapshot, GovernanceTab } from "@/lib/enterprise-governance-center/types";

const NAV_ROUTES = ENTERPRISE_GOVERNANCE_ROUTES.filter((r) => r.id !== "constitution-alt");

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

  return (
    <div className="egc-admin">
      <header className="egc-admin__header">
        <div>
          <p className="egc-admin__eyebrow">Enterprise Governance Center</p>
          <h2 className="egc-admin__title">Enterprise Constitution & Certification Authority</h2>
          <p className="egc-admin__desc">
            Highest platform authority — constitution, architecture governance, compliance, certification, and validation.
          </p>
        </div>
        <div className="egc-score">
          <strong>{snapshot.overallScore}%</strong>
          <span>Enterprise Score</span>
        </div>
      </header>

      <div className="egc-admin__actions">
        <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Full Validation</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("scan")}>Architecture Scan</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("certify")}>Issue Certificate</Button>
        <Link href="/super-admin/module-registry" className="egc-link">Module Registry</Link>
        <Link href="/super-admin/omega" className="egc-link">OMEGA</Link>
        <Link href="/super-admin/certification" className="egc-link">Certification Center</Link>
      </div>

      {message && <p className="egc-admin__message">{message}</p>}
      {snapshot.pendingPublish && <p className="egc-admin__banner">Pending publish — draft differs from live.</p>}

      <nav className="egc-tabs" aria-label="Governance sections">
        {NAV_ROUTES.map((route) => (
          <Link
            key={route.id}
            href={route.href}
            className={cn("egc-tab", (activeTab === route.id || (activeTab === "constitution" && route.id === "constitution")) && "egc-tab--active")}
          >
            {route.label}
          </Link>
        ))}
      </nav>

      {activeTab === "constitution" && (
        <section className="egc-panel">
          <h3>Official Enterprise Constitution v{snapshot.settings.constitutionVersion}</h3>
          <ul className="egc-list">
            {snapshot.constitution.map((a) => (
              <li key={a.id}><strong>{a.title}</strong> — {a.summary} (v{a.version})</li>
            ))}
          </ul>
          <h4>Amendments</h4>
          <ul className="egc-list">
            {snapshot.amendments.map((a) => (
              <li key={a.id}>{a.section}: {a.summary} — {new Date(a.date).toLocaleDateString()}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "architecture" && (
        <section className="egc-panel">
          <h3>Architecture Governance</h3>
          <table className="egc-table">
            <thead><tr><th>Check</th><th>Severity</th><th>Message</th><th>Module</th></tr></thead>
            <tbody>
              {snapshot.architectureViolations.map((v) => (
                <tr key={v.id}>
                  <td>{v.check}</td>
                  <td className={v.severity === "high" ? "egc-fail" : ""}>{v.severity}</td>
                  <td>{v.message}</td>
                  <td>{v.moduleId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "compliance" && (
        <section className="egc-panel">
          <h3>Enterprise Compliance</h3>
          <table className="egc-table">
            <thead><tr><th>Module</th><th>Status</th><th>Categories</th></tr></thead>
            <tbody>
              {snapshot.moduleCompliance.map((m) => (
                <tr key={m.moduleId}>
                  <td>{m.label}</td>
                  <td className={m.status === "pass" ? "egc-pass" : m.status === "warning" ? "egc-warn" : "egc-fail"}>{m.status.toUpperCase()}</td>
                  <td>{Object.values(m.categories).filter((s) => s === "pass").length}/{Object.keys(m.categories).length} pass</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "enterprise-rules" && (
        <section className="egc-panel">
          <h3>Enterprise Rule Engine</h3>
          <ul className="egc-list">
            {snapshot.rules.map((r) => (
              <li key={r.id}><strong>{r.name}</strong> — {r.scope} · {r.enabled ? "enabled" : "disabled"} · {r.violations} violations</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "technical-debt" && (
        <section className="egc-panel">
          <h3>Technical Debt Center</h3>
          <div className="egc-debt-grid">
            {snapshot.technicalDebt.map((d) => (
              <div key={d.category} className="egc-debt-card">
                <span>{d.category}</span>
                <strong>{d.score}</strong>
                <small>{d.items} items · {d.trend}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "enterprise-score" && (
        <section className="egc-panel">
          <h3>Enterprise Score</h3>
          <dl className="egc-metrics">
            {snapshot.enterpriseScores.map((s) => (
              <div key={s.domain}><dt>{s.label}</dt><dd>{s.score}%</dd></div>
            ))}
            <div><dt>Overall</dt><dd>{snapshot.overallScore}%</dd></div>
          </dl>
        </section>
      )}

      {activeTab === "certification" && (
        <section className="egc-panel">
          <h3>Certification Center</h3>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("certify")}>Generate ROVEXO Enterprise Certificate</Button>
          <ul className="egc-list">
            {snapshot.certificates.map((c) => (
              <li key={c.id}>
                <strong>{c.id}</strong> — {c.checksPassed}/{c.checksTotal} checks · signed {new Date(c.issuedAt).toLocaleString()} · {c.immutable ? "immutable" : "draft"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "audit" && (
        <section className="egc-panel">
          <h3>Audit Center</h3>
          <table className="egc-table">
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
        <section className="egc-panel">
          <h3>Validation Center</h3>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Full Enterprise Validation</Button>
          <ul className="egc-list">
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
        <section className="egc-panel">
          <h3>Reports</h3>
          <div className="egc-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("report", { reportType: "governance" })}>Governance Report</Button>
          </div>
        </section>
      )}
    </div>
  );
}
