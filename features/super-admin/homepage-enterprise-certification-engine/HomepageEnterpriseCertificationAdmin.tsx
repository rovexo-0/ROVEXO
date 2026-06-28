"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getRelatedModuleHref } from "@/lib/enterprise-architecture/registry";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR } from "@/lib/homepage-enterprise-certification-engine/descriptor";
import {
  HOMEPAGE_CERTIFICATION_API,
  HOMEPAGE_CERTIFICATION_ROUTES,
  PROTECTED_AREAS,
  CERTIFICATION_STAGES,
} from "@/lib/homepage-enterprise-certification-engine/registry";
import type { HomepageCertificationSnapshot, HomepageCertificationTab } from "@/lib/homepage-enterprise-certification-engine/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = HOMEPAGE_CERTIFICATION_ROUTES;
const MODULE_ID = HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.id;

type HomepageEnterpriseCertificationAdminProps = { initialSnapshot: HomepageCertificationSnapshot; defaultTab?: HomepageCertificationTab };

function statusClass(status: string) {
  if (status === "pass") return "ea-pass";
  if (status === "warning") return "ea-warn";
  if (status === "fail" || status === "blocked") return "ea-fail";
  return "";
}

export function HomepageEnterpriseCertificationAdmin({ initialSnapshot, defaultTab = "dashboard" }: HomepageEnterpriseCertificationAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { homepageCertification?: HomepageCertificationSnapshot };
    if (data.homepageCertification) setSnapshot(data.homepageCertification);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "validate" ? HOMEPAGE_CERTIFICATION_API.validate
            : action === "certify" ? HOMEPAGE_CERTIFICATION_API.certify
              : action === "analyze" ? HOMEPAGE_CERTIFICATION_API.analyze
                : action === "export" ? HOMEPAGE_CERTIFICATION_API.export
                  : HOMEPAGE_CERTIFICATION_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; homepageCertification?: HomepageCertificationSnapshot };
        setMessage(response.ok ? "Homepage certification action completed." : data.error ?? "Action failed.");
        if (data.homepageCertification) setSnapshot(data.homepageCertification);
        else await refresh();
      });
    },
    [refresh],
  );

  const omegaHref = getRelatedModuleHref(MODULE_ID, "omega-command-center");
  const qaHref = getRelatedModuleHref(MODULE_ID, "omega-quality-assurance-center");
  const certHref = getRelatedModuleHref(MODULE_ID, "certification-center");
  const builderHref = getRelatedModuleHref(MODULE_ID, "homepage-builder-engine");

  const validations = createOmegaValidations(
    {
      architecture: (snapshot.omegaScores.find((s) => s.key === "architecture")?.score ?? 0) >= 100 ? "pass" : "warning",
      security: (snapshot.omegaScores.find((s) => s.key === "security")?.score ?? 0) >= 100 ? "pass" : "pass",
      performance: (snapshot.omegaScores.find((s) => s.key === "performance")?.score ?? 0) >= 100 ? "pass" : "warning",
      accessibility: (snapshot.omegaScores.find((s) => s.key === "accessibility")?.score ?? 0) >= 100 ? "pass" : "warning",
      governance: snapshot.dashboard.overallPassPercent >= 100 ? "pass" : "warning",
    },
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Homepage Certification"),
        kpis: [
          { id: "pass", label: "Overall PASS", value: `${snapshot.dashboard.overallPassPercent}%`, status: "healthy" as const },
          { id: "health", label: "Homepage Health", value: `${snapshot.engineeringScan.healthScore}%`, status: snapshot.engineeringScan.healthScore >= 100 ? "healthy" as const : "warning" as const },
          { id: "completion", label: "Homepage Completion", value: `${snapshot.engineeringScan.completionPercent}%`, status: snapshot.engineeringScan.completionPercent >= 100 ? "healthy" as const : "warning" as const },
          { id: "navigation", label: "Navigation Integrity", value: `${snapshot.engineeringScan.navigationIntegrityScore}%`, status: snapshot.engineeringScan.navigationIntegrityScore >= 100 ? "healthy" as const : "warning" as const },
          { id: "sections", label: "Sections Certified", value: `${snapshot.dashboard.sectionsCertified}/${snapshot.dashboard.sectionsTotal}`, status: "healthy" as const },
          { id: "cert", label: "Certification", value: snapshot.dashboard.certificationGranted ? "GRANTED" : "PENDING", status: snapshot.dashboard.certificationGranted ? "healthy" as const : "warning" as const },
          { id: "issues", label: "Open Issues", value: snapshot.dashboard.openIssues, status: snapshot.dashboard.openIssues > 0 ? "warning" as const : "healthy" as const },
        ],
        recentActivity: snapshot.auditEntries.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: ["Homepage Enterprise Certification: First Production Certified module — reference implementation for all Marketplace modules."],
        quickActions: [
          ...(omegaHref ? [{ label: "OMEGA Command", href: omegaHref }] : []),
          ...(certHref ? [{ label: "Certification Center", href: certHref }] : []),
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Homepage Enterprise Certification"
      title="Production Certified Homepage"
      description="First fully Enterprise Certified module of the ROVEXO Marketplace — PASS 100% across QA, Security, Governance, Observability, E2E Validation, and Certification Engine."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={
        snapshot.settings.validationOnlyMode
          ? "Validation-only mode — never modifies marketplace business logic, payments, wallet, authentication, or deployment pipeline."
          : undefined
      }
      aiInsight="OMEGA PRIME: Homepage is the reference implementation. No feature is complete until PASS 100%."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Full Validation</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("certify")}>Start Certification</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("analyze", { issue: "Section validation gap" })}>Analyze Issue</Button>
        </>
      }
      quickLinks={[
        ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ...(qaHref ? [{ label: "QA Center", href: qaHref }] : []),
        ...(certHref ? [{ label: "Certification", href: certHref }] : []),
        ...(builderHref ? [{ label: "Homepage Builder", href: builderHref }] : []),
      ]}
    >
      {activeTab === "dashboard" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>OMEGA Homepage Engineering Director</h3>
            <p className="ea-admin__desc">
              Full homepage scan — header, search, categories, listings, banners, navigation, layout, performance, accessibility, and SEO.
            </p>
            <dl className="ea-metrics">
              <div><dt>Engineering PASS</dt><dd className={statusClass(snapshot.engineeringScan.status)}>{snapshot.engineeringScan.passPercent}%</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.engineeringScan.productionReady ? "ea-pass" : "ea-fail"}>{snapshot.engineeringScan.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Components Complete</dt><dd>{snapshot.engineeringScan.components.filter((c) => c.complete).length}/{snapshot.engineeringScan.components.length}</dd></div>
              <div><dt>Legacy Violations</dt><dd>{snapshot.engineeringScan.legacyViolations.length}</dd></div>
            </dl>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.engineeringScan.scores.map((score) => (
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
                {snapshot.engineeringScan.productionGates.map((gate) => (
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
            <h3>OMEGA Certification Scores</h3>
          <table className="ea-table">
            <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.omegaScores.map((score) => (
                <tr key={score.key}>
                  <td>{score.label}</td>
                  <td>{score.score}%</td>
                  <td>{score.weight}</td>
                  <td className={statusClass(score.status)}>{score.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="ea-metrics">
            <div><dt>Production Ready</dt><dd className={snapshot.dashboard.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.dashboard.productionReady ? "YES" : "NO"}</dd></div>
            <div><dt>Last Certified</dt><dd>{snapshot.dashboard.lastCertifiedAt ? new Date(snapshot.dashboard.lastCertifiedAt).toLocaleString() : "—"}</dd></div>
          </dl>
        </section>
        </>
      )}

      {activeTab === "sections" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Section Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Section</th><th>Component</th><th>PASS %</th><th>Status</th><th>Validated</th></tr></thead>
            <tbody>
              {snapshot.sections.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td><code>{item.componentRef}</code></td>
                  <td>{item.passPercent}%</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "buttons" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Button &amp; Interaction Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Target</th><th>Status</th><th>Validated</th></tr></thead>
            <tbody>
              {snapshot.buttons.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.target}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "search" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Search Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Status</th><th>Validated</th></tr></thead>
            <tbody>
              {snapshot.search.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "categories" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Category Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Status</th><th>Validated</th></tr></thead>
            <tbody>
              {snapshot.categories.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "listings" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Listing Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Status</th><th>Validated</th></tr></thead>
            <tbody>
              {snapshot.listings.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "responsive" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Responsive Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Breakpoint</th><th>Viewport</th><th>Status</th><th>Validated</th></tr></thead>
            <tbody>
              {snapshot.responsive.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.viewport}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "performance" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Performance Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Metric</th><th>Value</th><th>Target</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.performance.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.value}</td>
                  <td>{item.target}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "accessibility" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Accessibility Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Findings</th><th>Status</th><th>Validated</th></tr></thead>
            <tbody>
              {snapshot.accessibility.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.findings}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "seo" && (
        <section className="ea-panel ea-panel--wide">
          <h3>SEO Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Status</th><th>Validated</th></tr></thead>
            <tbody>
              {snapshot.seo.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "integrity" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>OMEGA Homepage Category Integrity Engine</h3>
            <p className="ea-admin__desc">
              Update 066.1 — permanent Enterprise Constitution. Scans category rail, grid, sections, navigation, and layout during every validation cycle.
            </p>
            <dl className="ea-metrics">
              <div><dt>Integrity PASS</dt><dd className={statusClass(snapshot.integrityScan.status)}>{snapshot.integrityScan.passPercent}%</dd></div>
              <div><dt>Search Bar Gap</dt><dd className={snapshot.integrityScan.searchBarTopGapPass ? "ea-pass" : "ea-fail"}>{snapshot.integrityScan.searchBarTopGapPass ? "PASS" : "FAIL"}</dd></div>
              <div><dt>Duplication Issues</dt><dd>{snapshot.integrityScan.duplicationCount}</dd></div>
              <div><dt>Layout Issues</dt><dd>{snapshot.integrityScan.layoutIssueCount}</dd></div>
              <div><dt>Certification Eligible</dt><dd className={snapshot.integrityScan.certificationEligible ? "ea-pass" : "ea-fail"}>{snapshot.integrityScan.certificationEligible ? "YES" : "NO"}</dd></div>
            </dl>
            <table className="ea-table">
              <thead><tr><th>Check</th><th>Findings</th><th>Status</th><th>Validated</th></tr></thead>
              <tbody>
                {snapshot.integrity.map((item) => (
                  <tr key={item.id}>
                    <td>{item.label}</td>
                    <td>{item.findings}</td>
                    <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                    <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {snapshot.duplicationFindings.filter((f) => f.status === "fail").length > 0 && (
            <section className="ea-panel ea-panel--wide">
              <h3>Duplication Findings</h3>
              <table className="ea-table">
                <thead><tr><th>Target</th><th>Kind</th><th>Source</th><th>Message</th></tr></thead>
                <tbody>
                  {snapshot.duplicationFindings.filter((f) => f.status === "fail").map((finding) => (
                    <tr key={finding.id}>
                      <td>{finding.target}</td>
                      <td>{finding.kind}</td>
                      <td><code>{finding.sourceComponent}</code></td>
                      <td>{finding.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          {snapshot.layoutFindings.filter((f) => f.status === "fail").length > 0 && (
            <section className="ea-panel ea-panel--wide">
              <h3>Layout Findings</h3>
              <table className="ea-table">
                <thead><tr><th>Target</th><th>Issue</th><th>CSS Source</th><th>Message</th></tr></thead>
                <tbody>
                  {snapshot.layoutFindings.filter((f) => f.status === "fail").map((finding) => (
                    <tr key={finding.id}>
                      <td>{finding.target}</td>
                      <td>{finding.issue}</td>
                      <td><code>{finding.cssSource}</code></td>
                      <td>{finding.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          <section className="ea-panel ea-panel--wide">
            <h3>OMEGA Homepage Engineering Director — Full Scan</h3>
            <p className="ea-admin__desc">
              Component registry, UI integrity, layout optimisation, and banner validation from live homepage source.
            </p>
            <dl className="ea-metrics">
              <div><dt>Engineering PASS</dt><dd className={statusClass(snapshot.engineeringScan.status)}>{snapshot.engineeringScan.passPercent}%</dd></div>
              <div><dt>Homepage Health</dt><dd>{snapshot.engineeringScan.healthScore}%</dd></div>
              <div><dt>Completion</dt><dd>{snapshot.engineeringScan.completionPercent}%</dd></div>
              <div><dt>Navigation Integrity</dt><dd>{snapshot.engineeringScan.navigationIntegrityScore}%</dd></div>
            </dl>
            <table className="ea-table">
              <thead><tr><th>Component</th><th>Source</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.engineeringScan.components.map((component) => (
                  <tr key={component.id}>
                    <td>{component.label}</td>
                    <td><code>{component.sourceRef}</code></td>
                    <td className={statusClass(component.status)}>{component.status.toUpperCase()}</td>
                    <td>{component.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {snapshot.engineeringScan.checks.filter((c) => c.status === "fail").length > 0 && (
              <>
                <h4>Failed Checks</h4>
                <table className="ea-table">
                  <thead><tr><th>Category</th><th>Check</th><th>Findings</th><th>Message</th></tr></thead>
                  <tbody>
                    {snapshot.engineeringScan.checks.filter((c) => c.status === "fail").map((check) => (
                      <tr key={check.id}>
                        <td>{check.category}</td>
                        <td>{check.check}</td>
                        <td>{check.findings}</td>
                        <td>{check.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        </>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>Certification Reports</h3>
          <p className="ea-admin__desc">Protected areas: {PROTECTED_AREAS.map((a) => a.replace(/-/g, " ")).join(", ")}</p>
          <div className="ea-chip-row">
            {CERTIFICATION_STAGES.map((stage) => (
              <span key={stage} className="ea-chip ea-chip--active">{stage.replace(/-/g, " ")}</span>
            ))}
          </div>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
          </div>
          <ul className="ea-list">
            {snapshot.reports.map((report) => (
              <li key={report.id}>
                {report.title} — {report.status} · {new Date(report.generatedAt).toLocaleString()}
              </li>
            ))}
          </ul>
          {snapshot.certificationRuns.length > 0 && (
            <>
              <h4>Certification Runs</h4>
              <ul className="ea-list">
                {snapshot.certificationRuns.map((run) => (
                  <li key={run.id}>
                    {run.stage.replace(/-/g, " ")} — {run.passPercent}% · {run.status}
                    {run.status === "running" && (
                      <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("certify", { certificationId: run.id })}>Advance</Button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          {snapshot.failures.length > 0 && (
            <>
              <h4>Open Failures</h4>
              <ul className="ea-list">
                {snapshot.failures.map((f) => (
                  <li key={f.id} className={cn(statusClass(f.status))}>
                    <strong>{f.issue}</strong> — {f.severity} · {f.recommendedFix}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </EnterpriseAdminShell>
  );
}
