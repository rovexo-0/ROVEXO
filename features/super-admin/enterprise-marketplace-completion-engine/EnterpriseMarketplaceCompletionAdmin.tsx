"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getRelatedModuleHref } from "@/lib/enterprise-architecture/registry";
import { MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR } from "@/lib/enterprise-marketplace-completion-engine/descriptor";
import { MARKETPLACE_COMPLETION_API, MARKETPLACE_COMPLETION_ROUTES } from "@/lib/enterprise-marketplace-completion-engine/registry";
import type { CompletionValidationItem, MarketplaceCompletionSnapshot, MarketplaceCompletionTab } from "@/lib/enterprise-marketplace-completion-engine/types";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const MODULE_ID = MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR.id;

type Props = { initialSnapshot: MarketplaceCompletionSnapshot; defaultTab?: MarketplaceCompletionTab };

function statusClass(status: string) {
  if (status === "pass") return "ea-pass";
  if (status === "warning") return "ea-warn";
  if (status === "fail" || status === "blocked") return "ea-fail";
  return "";
}

function ValidationTable({ title, items }: { title: string; items: CompletionValidationItem[] }) {
  if (items.length === 0) return null;
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

export function EnterpriseMarketplaceCompletionAdmin({ initialSnapshot, defaultTab = "dashboard" }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(MARKETPLACE_COMPLETION_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { marketplaceCompletion?: MarketplaceCompletionSnapshot };
    if (data.marketplaceCompletion) setSnapshot(data.marketplaceCompletion);
  }, []);

  const runAction = useCallback((action: string, payload?: Record<string, unknown>) => {
    startTransition(async () => {
      const endpoint =
        action === "validate" ? MARKETPLACE_COMPLETION_API.validate
          : action === "repair" ? MARKETPLACE_COMPLETION_API.repair
            : action === "certify" ? MARKETPLACE_COMPLETION_API.certify
              : action === "export" ? MARKETPLACE_COMPLETION_API.export
                : MARKETPLACE_COMPLETION_API.action;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, mfaVerified: true, ...payload }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; marketplaceCompletion?: MarketplaceCompletionSnapshot };
      setMessage(response.ok ? "Marketplace completion action completed." : data.error ?? "Action failed.");
      if (data.marketplaceCompletion) setSnapshot(data.marketplaceCompletion);
      else await refresh();
    });
  }, [refresh]);

  const omegaHref = getRelatedModuleHref(MODULE_ID, "omega-command-center");
  const launchHref = getRelatedModuleHref(MODULE_ID, "enterprise-launch-readiness-engine");
  const certHref = getRelatedModuleHref(MODULE_ID, "certification-center");

  const validations = createOmegaValidations(
    {
      architecture: snapshot.scores.find((s) => s.key === "architecture")?.score === 100 ? "pass" : "warning",
      security: snapshot.scores.find((s) => s.key === "security")?.score === 100 ? "pass" : "warning",
      performance: snapshot.scores.find((s) => s.key === "performance")?.score === 100 ? "pass" : "warning",
      accessibility: snapshot.scores.find((s) => s.key === "accessibility")?.score === 100 ? "pass" : "warning",
      governance: snapshot.dashboard.overallPassPercent >= 100 ? "pass" : "warning",
    },
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const tabChecks: Partial<Record<MarketplaceCompletionTab, CompletionValidationItem[]>> = {
    buttons: snapshot.buttons,
    routes: snapshot.routes,
    "buyer-journey": snapshot.buyerJourney,
    "seller-journey": snapshot.sellerJourney,
    "company-journey": snapshot.companyJourney,
    homepage: snapshot.homepage,
    search: snapshot.search,
    categories: snapshot.categories,
    listings: snapshot.listings,
    "ui-integrity": snapshot.uiIntegrity,
  };

  const dashboard = activeTab === "dashboard" ? {
    ...createDefaultEnterpriseDashboard("Execution Mode"),
    kpis: [
      { id: "communication", label: "Comms PASS", value: `${snapshot.communicationCompletion.passPercent}%`, status: snapshot.communicationCompletion.communicationCompletionPass ? "healthy" as const : "warning" as const },
      { id: "certified", label: "Comms Certified", value: snapshot.communicationCompletion.communicationCertified ? "YES" : "NO", status: snapshot.communicationCompletion.communicationCertified ? "healthy" as const : "warning" as const },
      { id: "domains", label: "Domains", value: `${snapshot.communicationCompletion.domainsComplete}/${snapshot.communicationCompletion.domainsTotal}`, status: snapshot.communicationCompletion.domainsComplete === snapshot.communicationCompletion.domainsTotal ? "healthy" as const : "warning" as const },
      { id: "shipping", label: "Shipping Certified", value: snapshot.shippingCompletion.shippingCertified ? "YES" : "NO", status: snapshot.shippingCompletion.shippingCertified ? "healthy" as const : "warning" as const },
    ],
    recentActivity: snapshot.auditEntries.slice(0, 5).map((e) => ({ id: e.id, action: e.action, actor: e.actor, target: e.target, timestamp: e.timestamp })),
    aiInsights: ["Prompt 086 — Enterprise Communication Platform. Launch Priority #12 — Every buyer, seller, company and administrator must receive fast, reliable and secure communications."],
    quickActions: [
      ...(omegaHref ? [{ label: "OMEGA Command", href: omegaHref }] : []),
      ...(launchHref ? [{ label: "Launch Readiness", href: launchHref }] : []),
    ],
  } : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Launch Priority #12"
      title="Enterprise Communication Platform"
      description="Official Enterprise Communication Platform — OMEGA validates, monitors, optimizes and certifies every communication channel inside the ROVEXO Marketplace."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={MARKETPLACE_COMPLETION_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={snapshot.communicationCompletion.active ? "Enterprise Communication Platform ACTIVE — Launch Priority #12. Communication is Production Critical — messages, notifications, email and push must pass 100%." : snapshot.settings.validationOnlyMode ? "Validation-only mode — never modifies business rules, payments, wallet, authentication, or production database." : undefined}
      aiInsight="Communication must achieve PASS 100%, Enterprise Certified, Production Ready. Shipping (Priority #11) must remain certified."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Full Validation</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("certify")}>Grant Certification</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("repair")}>Plan Auto Repair</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("continuous-improvement", { trigger: "commit" })}>Run CI Cycle</Button>
        </>
      }
      quickLinks={[
        ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ...(launchHref ? [{ label: "Launch Readiness", href: launchHref }] : []),
        ...(certHref ? [{ label: "Certification", href: certHref }] : []),
      ]}
    >
      {activeTab === "dashboard" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Communication Platform Summary</h3>
            <dl className="ea-metrics">
              <div><dt>Communication PASS</dt><dd className={snapshot.communicationCompletion.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.communicationCompletion.passPercent}%</dd></div>
              <div><dt>Enterprise Certified</dt><dd className={snapshot.communicationCompletion.communicationCertified ? "ea-pass" : "ea-warn"}>{snapshot.communicationCompletion.communicationCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Domains</dt><dd className={snapshot.communicationCompletion.domainsComplete === snapshot.communicationCompletion.domainsTotal ? "ea-pass" : "ea-warn"}>{snapshot.communicationCompletion.domainsComplete}/{snapshot.communicationCompletion.domainsTotal}</dd></div>
              <div><dt>Launch Priority</dt><dd className="ea-pass">#{snapshot.communicationCompletion.launchPriority}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Enterprise Certification Scores</h3>
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
                  <tr key={gate.gate}><td>{gate.label}</td><td>{gate.passPercent}%</td><td className={statusClass(gate.status)}>{gate.status.toUpperCase()}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {activeTab === "modules" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Marketplace Module Coverage</h3>
          <table className="ea-table">
            <thead><tr><th>Module</th><th>Route</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
            <tbody>
              {snapshot.modules.map((module) => (
                <tr key={module.id}>
                  <td>{module.label}</td>
                  <td><code>{module.route}</code></td>
                  <td>{module.passPercent}%</td>
                  <td className={statusClass(module.status)}>{module.status.toUpperCase()}</td>
                  <td>{module.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "launch-gate" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Marketplace Release Blockers</h3>
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
          <dl className="ea-metrics">
            <div><dt>Launch Readiness</dt><dd className={snapshot.completionScan.launchReadinessPass ? "ea-pass" : "ea-fail"}>{snapshot.completionScan.launchReadinessPass ? "PASS" : "FAIL"}</dd></div>
            <div><dt>Homepage</dt><dd className={snapshot.completionScan.homepagePass ? "ea-pass" : "ea-fail"}>{snapshot.completionScan.homepagePass ? "PASS" : "FAIL"}</dd></div>
            <div><dt>Global UI</dt><dd className={snapshot.completionScan.globalUiPass ? "ea-pass" : "ea-fail"}>{snapshot.completionScan.globalUiPass ? "PASS" : "FAIL"}</dd></div>
          </dl>
        </section>
      )}

      {activeTab === "certification" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Enterprise Certification Status</h3>
          <dl className="ea-metrics">
            <div><dt>Overall PASS</dt><dd>{snapshot.dashboard.overallPassPercent}%</dd></div>
            <div><dt>Marketplace Ready</dt><dd className={snapshot.dashboard.marketplaceReady ? "ea-pass" : "ea-warn"}>{snapshot.dashboard.marketplaceReady ? "YES" : "NO"}</dd></div>
            <div><dt>Production Ready</dt><dd className={snapshot.dashboard.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.dashboard.productionReady ? "YES" : "NO"}</dd></div>
            <div><dt>Certification</dt><dd className={snapshot.dashboard.certificationGranted ? "ea-pass" : "ea-warn"}>{snapshot.dashboard.certificationGranted ? "GRANTED" : "PENDING"}</dd></div>
          </dl>
        </section>
      )}

      {activeTab === "infrastructure" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Infrastructure Integration</h3>
          <p className="ea-admin__desc">Infrastructure validation delegated to Enterprise Launch Readiness Engine.</p>
          <dl className="ea-metrics">
            <div><dt>Launch Readiness PASS</dt><dd className={snapshot.completionScan.launchReadinessPass ? "ea-pass" : "ea-fail"}>{snapshot.completionScan.launchReadinessPass ? "100%" : "Pending"}</dd></div>
          </dl>
        </section>
      )}

      {activeTab === "intelligence" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Marketplace Intelligence Detections</h3>
          <p className="ea-admin__desc">{snapshot.intelligence.clearDetections}/{snapshot.intelligence.totalDetections} detections clear — PASS {snapshot.intelligence.passPercent}%</p>
          <table className="ea-table">
            <thead><tr><th>Detection</th><th>Severity</th><th>Status</th><th>Message</th></tr></thead>
            <tbody>
              {snapshot.intelligence.findings.map((finding) => (
                <tr key={finding.id}>
                  <td>{finding.label}</td>
                  <td>{finding.severity.toUpperCase()}</td>
                  <td className={statusClass(finding.status)}>{finding.status.toUpperCase()}</td>
                  <td>{finding.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "consistency" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Marketplace Consistency Engine</h3>
          <table className="ea-table">
            <thead><tr><th>Domain</th><th>Dimension</th><th>Score</th><th>Status</th><th>Message</th></tr></thead>
            <tbody>
              {snapshot.consistency.checks.map((check) => (
                <tr key={check.id}>
                  <td>{check.domain}</td>
                  <td>{check.dimension}</td>
                  <td>{check.score}%</td>
                  <td className={statusClass(check.status)}>{check.status.toUpperCase()}</td>
                  <td>{check.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "cleanup" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Enterprise Cleanup Proposals</h3>
          <table className="ea-table">
            <thead><tr><th>Category</th><th>Target</th><th>Safe</th><th>Impact</th><th>Message</th></tr></thead>
            <tbody>
              {snapshot.cleanup.proposals.map((proposal) => (
                <tr key={proposal.id}>
                  <td>{proposal.label}</td>
                  <td><code>{proposal.target}</code></td>
                  <td>{proposal.safe ? "YES" : "NO"}</td>
                  <td>{proposal.estimatedImpact.toUpperCase()}</td>
                  <td>{proposal.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "modernization" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Premium 2026 Modernization Plan</h3>
          <p className="ea-admin__desc">Modernization PASS {snapshot.modernization.passPercent}%</p>
          <table className="ea-table">
            <thead><tr><th>Category</th><th>Current</th><th>Target</th><th>Priority</th><th>Message</th></tr></thead>
            <tbody>
              {snapshot.modernization.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.current}</td>
                  <td>{item.target}</td>
                  <td>{item.priority.toUpperCase()}</td>
                  <td>{item.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "health-scores" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Enterprise Health Scores</h3>
          <p className="ea-admin__desc">Overall Platform Score: {snapshot.healthScores.overallScore}%</p>
          <table className="ea-table">
            <thead><tr><th>Domain</th><th>Score</th><th>Trend</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.healthScores.scores.map((score) => (
                <tr key={score.key}>
                  <td>{score.label}</td>
                  <td>{score.score}%</td>
                  <td>{score.trend.toUpperCase()}</td>
                  <td className={statusClass(score.status)}>{score.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "continuous-improvement" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Continuous Improvement</h3>
          {snapshot.continuousImprovement.lastCycle && (
            <dl className="ea-metrics">
              <div><dt>Last Trigger</dt><dd>{snapshot.continuousImprovement.lastCycle.trigger}</dd></div>
              <div><dt>Last PASS</dt><dd className={snapshot.continuousImprovement.lastCycle.status === "pass" ? "ea-pass" : "ea-warn"}>{snapshot.continuousImprovement.lastCycle.passPercent}%</dd></div>
              <div><dt>Actions</dt><dd>{snapshot.continuousImprovement.lastCycle.actions.join(", ")}</dd></div>
            </dl>
          )}
          <h4>Enabled Triggers</h4>
          <ul className="ea-list">
            {snapshot.continuousImprovement.triggersEnabled.map((trigger) => (
              <li key={trigger}>{trigger.replace(/-/g, " ")}</li>
            ))}
          </ul>
          <h4>Final Completion Rules</h4>
          <table className="ea-table">
            <thead><tr><th>Rule</th><th>Status</th><th>Message</th></tr></thead>
            <tbody>
              {snapshot.finalRules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.label}</td>
                  <td className={rule.pass ? "ea-pass" : "ea-fail"}>{rule.pass ? "PASS" : "FAIL"}</td>
                  <td>{rule.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "director" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Global Marketplace Control</h3>
          <p className="ea-admin__desc">OMEGA monitors {snapshot.director.globalControl.length} marketplace domains — PASS {snapshot.director.passPercent}%</p>
          <table className="ea-table">
            <thead><tr><th>Domain</th><th>Status</th><th>Message</th></tr></thead>
            <tbody>
              {snapshot.director.globalControl.map((item) => (
                <tr key={item.id}><td>{item.label}</td><td className={statusClass(item.status)}>{item.status.toUpperCase()}</td><td>{item.message}</td></tr>
              ))}
            </tbody>
          </table>
          <h4>Director Dashboard Scores</h4>
          <table className="ea-table">
            <thead><tr><th>Domain</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.director.dashboardScores.map((score) => (
                <tr key={score.key}><td>{score.label}</td><td>{score.score}%</td><td className={statusClass(score.status)}>{score.status.toUpperCase()}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "components" && (
        <ValidationTable title="Global Component Validation" items={snapshot.director.components.checks} />
      )}

      {activeTab === "workflows" && (
        <>
          <ValidationTable title="Global Workflow Validation" items={snapshot.director.workflows.workflows} />
          <ValidationTable title="Global Button Interactions" items={snapshot.director.workflows.interactions} />
        </>
      )}

      {activeTab === "premium" && (
        <ValidationTable title="Premium 2026 Consistency" items={snapshot.director.premium.checks} />
      )}

      {activeTab === "improvements" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Smart Improvement Engine</h3>
          <table className="ea-table">
            <thead><tr><th>Category</th><th>Priority</th><th>Recommendation</th><th>Impact</th></tr></thead>
            <tbody>
              {snapshot.director.improvements.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.priority.toUpperCase()}</td>
                  <td>{item.recommendation}</td>
                  <td>{item.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "certification-gate" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Final Certification Gate</h3>
          <dl className="ea-metrics">
            <div><dt>Gate PASS</dt><dd className={snapshot.certificationGate.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.certificationGate.passPercent}%</dd></div>
            <div><dt>Enterprise Certified</dt><dd className={snapshot.certificationGate.certificationEligible ? "ea-pass" : "ea-warn"}>{snapshot.certificationGate.certificationEligible ? "YES" : "NO"}</dd></div>
            <div><dt>Production Ready</dt><dd className={snapshot.certificationGate.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.certificationGate.productionReady ? "YES" : "NO"}</dd></div>
            <div><dt>Launch Ready</dt><dd className={snapshot.certificationGate.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.certificationGate.launchReady ? "YES" : "NO"}</dd></div>
            <div><dt>World-Class Standard</dt><dd className={snapshot.certificationGate.worldClassStandard ? "ea-pass" : "ea-warn"}>{snapshot.certificationGate.worldClassStandard ? "YES" : "NO"}</dd></div>
          </dl>
          <table className="ea-table">
            <thead><tr><th>Gate</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
            <tbody>
              {snapshot.certificationGate.gates.map((gate) => (
                <tr key={gate.gate}>
                  <td>{gate.label}</td>
                  <td>{gate.passPercent}%</td>
                  <td className={gate.pass ? "ea-pass" : "ea-fail"}>{gate.pass ? "PASS" : "FAIL"}</td>
                  <td>{gate.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "launch-mode" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Launch Mode Status</h3>
            <dl className="ea-metrics">
              <div><dt>Launch PASS</dt><dd className={snapshot.launchMode.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.launchMode.passPercent}%</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.launchMode.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.launchMode.launchReady ? "YES" : "NO"}</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.launchMode.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.launchMode.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Active Blockers</dt><dd className={snapshot.launchMode.activeBlockers === 0 ? "ea-pass" : "ea-fail"}>{snapshot.launchMode.activeBlockers}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Launch Priorities (18)</h3>
            <table className="ea-table">
              <thead><tr><th>#</th><th>Module</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.launchMode.priorities.map((p) => (
                  <tr key={p.id}>
                    <td>{p.priority}</td>
                    <td>{p.label}</td>
                    <td>{p.passPercent}%</td>
                    <td className={statusClass(p.status)}>{p.status.toUpperCase()}</td>
                    <td>{p.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Launch Certification Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.launchMode.certificationScores.map((score) => (
                  <tr key={score.key}><td>{score.label}</td><td>{score.score}%</td><td>{score.weight}</td><td className={statusClass(score.status)}>{score.status.toUpperCase()}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Final Launch Report</h3>
            <table className="ea-table">
              <thead><tr><th>Section</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.launchMode.report.map((section) => (
                  <tr key={section.id}><td>{section.label}</td><td>{section.passPercent}%</td><td className={statusClass(section.status)}>{section.status.toUpperCase()}</td><td>{section.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Launch Rules</h3>
            <table className="ea-table">
              <thead><tr><th>Rule</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.launchMode.launchRules.map((rule) => (
                  <tr key={rule.id}><td>{rule.label}</td><td className={rule.pass ? "ea-pass" : "ea-fail"}>{rule.pass ? "PASS" : "FAIL"}</td><td>{rule.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Launch Blockers</h3>
            <table className="ea-table">
              <thead><tr><th>Blocker</th><th>Active</th><th>Severity</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.launchMode.blockers.filter((b) => b.active).length === 0 ? (
                  <tr><td colSpan={4} className="ea-pass">No active launch blockers</td></tr>
                ) : snapshot.launchMode.blockers.filter((b) => b.active).map((blocker) => (
                  <tr key={blocker.blocker} className="ea-fail">
                    <td>{blocker.label}</td><td>YES</td><td>{blocker.severity.toUpperCase()}</td><td>{blocker.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {activeTab === "zero-defect" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Zero Defect Status</h3>
            <dl className="ea-metrics">
              <div><dt>Zero Defect PASS</dt><dd className={snapshot.zeroDefect.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.zeroDefect.passPercent}%</dd></div>
              <div><dt>Critical Defects</dt><dd className={snapshot.zeroDefect.criticalDefects === 0 ? "ea-pass" : "ea-fail"}>{snapshot.zeroDefect.criticalDefects}</dd></div>
              <div><dt>High Priority</dt><dd className={snapshot.zeroDefect.highPriorityDefects === 0 ? "ea-pass" : "ea-fail"}>{snapshot.zeroDefect.highPriorityDefects}</dd></div>
              <div><dt>Active Gates</dt><dd className={snapshot.zeroDefect.activeGates === 0 ? "ea-pass" : "ea-fail"}>{snapshot.zeroDefect.activeGates}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Scan Domains (23)</h3>
            <table className="ea-table">
              <thead><tr><th>Domain</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.zeroDefect.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.label}</td>
                    <td>{domain.passPercent}%</td>
                    <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                    <td>{domain.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Zero Defect Gates</h3>
            <table className="ea-table">
              <thead><tr><th>Gate</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.zeroDefect.gates.map((gate) => (
                  <tr key={gate.gate}><td>{gate.label}</td><td className={gate.pass ? "ea-pass" : "ea-fail"}>{gate.pass ? "PASS" : "FAIL"}</td><td>{gate.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Enterprise Certification</h3>
            <table className="ea-table">
              <thead><tr><th>Requirement</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.zeroDefect.certification.map((req) => (
                  <tr key={req.id}><td>{req.label}</td><td className={req.pass ? "ea-pass" : "ea-fail"}>{req.pass ? "PASS" : "FAIL"}</td><td>{req.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Platform Health Report</h3>
            <table className="ea-table">
              <thead><tr><th>Metric</th><th>Score</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.zeroDefect.report.map((metric) => (
                  <tr key={metric.id}><td>{metric.label}</td><td>{metric.score}%</td><td className={statusClass(metric.status)}>{metric.status.toUpperCase()}</td><td>{metric.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Defect Classifications</h3>
            <table className="ea-table">
              <thead><tr><th>Classification</th><th>Count</th></tr></thead>
              <tbody>
                {snapshot.zeroDefect.classifications.map((item) => (
                  <tr key={item.classification}><td>{item.label}</td><td className={item.count === 0 ? "ea-pass" : "ea-fail"}>{item.count}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <ValidationTable title="Defect discovery" items={snapshot.zeroDefect.discoveryChecks} />
          <ValidationTable title="Quality validation" items={snapshot.zeroDefect.qualityChecks} />
          <ValidationTable title="Regression scans" items={snapshot.zeroDefect.regressionChecks} />
        </>
      )}

      {activeTab === "execution-release" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Release Status</h3>
            <dl className="ea-metrics">
              <div><dt>Execution PASS</dt><dd className={snapshot.executionRelease.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.executionRelease.passPercent}%</dd></div>
              <div><dt>Release Approved</dt><dd className={snapshot.executionRelease.releaseApproved ? "ea-pass" : "ea-warn"}>{snapshot.executionRelease.releaseApproved ? "YES" : "NO"}</dd></div>
              <div><dt>Release Gates</dt><dd className={snapshot.executionRelease.activeGates === 0 ? "ea-pass" : "ea-fail"}>{snapshot.executionRelease.activeGates} active</dd></div>
              <div><dt>Blocked Tasks</dt><dd className={snapshot.executionRelease.blockedTasks === 0 ? "ea-pass" : "ea-fail"}>{snapshot.executionRelease.blockedTasks}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Execution Board</h3>
            <table className="ea-table">
              <thead><tr><th>Queue</th><th>Items</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionRelease.board.map((item) => (
                  <tr key={item.id}>
                    <td>{item.label}</td>
                    <td>{item.itemCount}</td>
                    <td>{item.passPercent}%</td>
                    <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                    <td>{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Module Progress (24)</h3>
            <table className="ea-table">
              <thead><tr><th>Module</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionRelease.modules.map((module) => (
                  <tr key={module.id}>
                    <td>{module.label}</td>
                    <td>{module.passPercent}%</td>
                    <td className={statusClass(module.status)}>{module.status.toUpperCase()}</td>
                    <td>{module.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Quality Dashboard</h3>
            <table className="ea-table">
              <thead><tr><th>Metric</th><th>Score</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionRelease.dashboard.map((metric) => (
                  <tr key={metric.id}><td>{metric.label}</td><td>{metric.score}%</td><td className={statusClass(metric.status)}>{metric.status.toUpperCase()}</td><td>{metric.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Release Gates</h3>
            <table className="ea-table">
              <thead><tr><th>Gate</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionRelease.gates.map((gate) => (
                  <tr key={gate.gate}><td>{gate.label}</td><td className={gate.pass ? "ea-pass" : "ea-fail"}>{gate.pass ? "PASS" : "FAIL"}</td><td>{gate.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Success Criteria</h3>
            <table className="ea-table">
              <thead><tr><th>Criterion</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionRelease.successCriteria.map((criterion) => (
                  <tr key={criterion.id}><td>{criterion.label}</td><td className={criterion.pass ? "ea-pass" : "ea-fail"}>{criterion.pass ? "PASS" : "FAIL"}</td><td>{criterion.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Implementation Control</h3>
            <table className="ea-table">
              <thead><tr><th>Check</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionRelease.implementation.map((item) => (
                  <tr key={item.id}><td>{item.label}</td><td className={statusClass(item.status)}>{item.status.toUpperCase()}</td><td>{item.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Release Readiness</h3>
            <table className="ea-table">
              <thead><tr><th>Check</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionRelease.readiness.map((item) => (
                  <tr key={item.id}><td>{item.label}</td><td className={statusClass(item.status)}>{item.status.toUpperCase()}</td><td>{item.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {activeTab === "enterprise-delivery" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Enterprise Delivery Status</h3>
            <dl className="ea-metrics">
              <div><dt>Delivery PASS</dt><dd className={snapshot.enterpriseDelivery.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.enterpriseDelivery.passPercent}%</dd></div>
              <div><dt>Production Launch</dt><dd className={snapshot.enterpriseDelivery.productionLaunchReady ? "ea-pass" : "ea-warn"}>{snapshot.enterpriseDelivery.productionLaunchReady ? "YES" : "NO"}</dd></div>
              <div><dt>World-Class</dt><dd className={snapshot.enterpriseDelivery.worldClassStandard ? "ea-pass" : "ea-warn"}>{snapshot.enterpriseDelivery.worldClassStandard ? "YES" : "NO"}</dd></div>
              <div><dt>Active Policies</dt><dd className={snapshot.enterpriseDelivery.activePolicies === 0 ? "ea-pass" : "ea-fail"}>{snapshot.enterpriseDelivery.activePolicies}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Delivery Management (15)</h3>
            <table className="ea-table">
              <thead><tr><th>Queue</th><th>Items</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.enterpriseDelivery.management.map((item) => (
                  <tr key={item.id}>
                    <td>{item.label}</td>
                    <td>{item.itemCount}</td>
                    <td>{item.passPercent}%</td>
                    <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                    <td>{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Platform Validation (25)</h3>
            <table className="ea-table">
              <thead><tr><th>Domain</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.enterpriseDelivery.platform.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.label}</td>
                    <td>{domain.passPercent}%</td>
                    <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                    <td>{domain.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Executive Dashboard</h3>
            <table className="ea-table">
              <thead><tr><th>Metric</th><th>Score</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.enterpriseDelivery.dashboard.map((metric) => (
                  <tr key={metric.id}><td>{metric.label}</td><td>{metric.score}%</td><td className={statusClass(metric.status)}>{metric.status.toUpperCase()}</td><td>{metric.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Final Release Gate</h3>
            <table className="ea-table">
              <thead><tr><th>Requirement</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.enterpriseDelivery.releaseGate.map((gate) => (
                  <tr key={gate.id}><td>{gate.label}</td><td className={gate.pass ? "ea-pass" : "ea-fail"}>{gate.pass ? "PASS" : "FAIL"}</td><td>{gate.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Zero Defect Policy</h3>
            <table className="ea-table">
              <thead><tr><th>Policy</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.enterpriseDelivery.zeroDefectPolicy.map((policy) => (
                  <tr key={policy.id}><td>{policy.label}</td><td className={policy.pass ? "ea-pass" : "ea-fail"}>{policy.pass ? "PASS" : "FAIL"}</td><td>{policy.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Integrity</h3>
            <table className="ea-table">
              <thead><tr><th>Check</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.enterpriseDelivery.integrity.map((item) => (
                  <tr key={item.id}><td>{item.label}</td><td className={statusClass(item.status)}>{item.status.toUpperCase()}</td><td>{item.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Infrastructure Validation</h3>
            <table className="ea-table">
              <thead><tr><th>Check</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.enterpriseDelivery.infrastructure.map((item) => (
                  <tr key={item.id}><td>{item.label}</td><td className={statusClass(item.status)}>{item.status.toUpperCase()}</td><td>{item.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {activeTab === "execution-mode" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Execution Mode Status</h3>
            <dl className="ea-metrics">
              <div><dt>Execution PASS</dt><dd className={snapshot.executionMode.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.executionMode.passPercent}%</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.executionMode.launchReadyFinal ? "ea-pass" : "ea-warn"}>{snapshot.executionMode.launchReadyFinal ? "YES" : "NO"}</dd></div>
              <div><dt>Enterprise Certified</dt><dd className={snapshot.executionMode.enterpriseCertified ? "ea-pass" : "ea-warn"}>{snapshot.executionMode.enterpriseCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Active Policies</dt><dd className={snapshot.executionMode.activePolicies === 0 ? "ea-pass" : "ea-fail"}>{snapshot.executionMode.activePolicies}</dd></div>
            </dl>
            <p className="ea-insight">{snapshot.executionMode.directive}</p>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Autonomous Execution Cycle</h3>
            <table className="ea-table">
              <thead><tr><th>Step</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionMode.cycle.map((step) => (
                  <tr key={step.id}><td>{step.label}</td><td className={statusClass(step.status)}>{step.status.toUpperCase()}</td><td>{step.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Execution Order (18)</h3>
            <table className="ea-table">
              <thead><tr><th>#</th><th>Priority</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionMode.priorities.map((p) => (
                  <tr key={p.id}>
                    <td>{p.priority}</td>
                    <td>{p.label}</td>
                    <td>{p.passPercent}%</td>
                    <td className={statusClass(p.status)}>{p.status.toUpperCase()}</td>
                    <td>{p.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Live Execution Dashboard</h3>
            <table className="ea-table">
              <thead><tr><th>Metric</th><th>Score</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionMode.dashboard.map((metric) => (
                  <tr key={metric.id}><td>{metric.label}</td><td>{metric.score}%</td><td className={statusClass(metric.status)}>{metric.status.toUpperCase()}</td><td>{metric.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Final Success Criteria</h3>
            <table className="ea-table">
              <thead><tr><th>Criterion</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionMode.finalSuccess.map((criterion) => (
                  <tr key={criterion.id}><td>{criterion.label}</td><td className={criterion.pass ? "ea-pass" : "ea-fail"}>{criterion.pass ? "PASS" : "FAIL"}</td><td>{criterion.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Release Policy</h3>
            <table className="ea-table">
              <thead><tr><th>Policy</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionMode.releasePolicy.map((policy) => (
                  <tr key={policy.id}><td>{policy.label}</td><td className={policy.pass ? "ea-pass" : "ea-fail"}>{policy.pass ? "PASS" : "FAIL"}</td><td>{policy.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Improvements</h3>
            <table className="ea-table">
              <thead><tr><th>Check</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionMode.improvements.map((item) => (
                  <tr key={item.id}><td>{item.label}</td><td className={statusClass(item.status)}>{item.status.toUpperCase()}</td><td>{item.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Infrastructure Validation</h3>
            <table className="ea-table">
              <thead><tr><th>Check</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.executionMode.infrastructure.map((item) => (
                  <tr key={item.id}><td>{item.label}</td><td className={statusClass(item.status)}>{item.status.toUpperCase()}</td><td>{item.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {activeTab === "homepage-completion" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Homepage Status</h3>
            <dl className="ea-metrics">
              <div><dt>Homepage PASS</dt><dd className={snapshot.homepageCompletion.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.homepageCompletion.passPercent}%</dd></div>
              <div><dt>Certified</dt><dd className={snapshot.homepageCompletion.homepageCertified ? "ea-pass" : "ea-warn"}>{snapshot.homepageCompletion.homepageCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.homepageCompletion.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.homepageCompletion.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.homepageCompletion.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.homepageCompletion.launchReady ? "YES" : "NO"}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Homepage Scan (16)</h3>
            <table className="ea-table">
              <thead><tr><th>Component</th><th>PASS %</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.homepageCompletion.components.map((component) => (
                  <tr key={component.id}>
                    <td>{component.label}</td>
                    <td>{component.passPercent}%</td>
                    <td className={statusClass(component.status)}>{component.status.toUpperCase()}</td>
                    <td>{component.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Certification Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.homepageCompletion.certificationScores.map((score) => (
                  <tr key={score.key}><td>{score.label}</td><td>{score.score}%</td><td>{score.weight}</td><td className={statusClass(score.status)}>{score.status.toUpperCase()}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>PASS Conditions</h3>
            <table className="ea-table">
              <thead><tr><th>Condition</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.homepageCompletion.passConditions.map((condition) => (
                  <tr key={condition.id}><td>{condition.label}</td><td className={condition.pass ? "ea-pass" : "ea-fail"}>{condition.pass ? "PASS" : "FAIL"}</td><td>{condition.message}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <ValidationTable title="Visual integrity" items={snapshot.homepageCompletion.visualIntegrity} />
          <ValidationTable title="Search area" items={snapshot.homepageCompletion.searchArea} />
          <ValidationTable title="Category validation" items={snapshot.homepageCompletion.categoryValidation} />
          <ValidationTable title="Layout validation" items={snapshot.homepageCompletion.layoutValidation} />
          <ValidationTable title="Featured content" items={snapshot.homepageCompletion.featuredContent} />
          <ValidationTable title="Button validation" items={snapshot.homepageCompletion.buttonValidation} />
          <ValidationTable title="Responsive validation" items={snapshot.homepageCompletion.responsiveValidation} />
          <ValidationTable title="Performance" items={snapshot.homepageCompletion.performance} />
          <ValidationTable title="SEO" items={snapshot.homepageCompletion.seo} />
        </>
      )}

      {activeTab === "category-completion" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Category Completion Status</h3>
            <dl className="ea-metrics">
              <div><dt>Category PASS</dt><dd className={snapshot.categoryCompletion.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.categoryCompletion.passPercent}%</dd></div>
              <div><dt>Certified</dt><dd className={snapshot.categoryCompletion.categoryCertified ? "ea-pass" : "ea-warn"}>{snapshot.categoryCompletion.categoryCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.categoryCompletion.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.categoryCompletion.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.categoryCompletion.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.categoryCompletion.launchReady ? "YES" : "NO"}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Category Domains</h3>
            <table className="ea-table">
              <thead><tr><th>Domain</th><th>Reference</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.categoryCompletion.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.label}</td>
                    <td><code>{domain.ref}</code></td>
                    <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                    <td>{domain.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Certification Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.categoryCompletion.certificationScores.map((score) => (
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
            <h3>PASS Conditions</h3>
            <ul className="ea-list">
              {snapshot.categoryCompletion.passConditions.map((condition) => (
                <li key={condition.id} className={condition.pass ? "ea-pass" : "ea-fail"}>{condition.label} — {condition.message}</li>
              ))}
            </ul>
          </section>
          <ValidationTable title="Category integrity" items={snapshot.categoryCompletion.integrity} />
          <ValidationTable title="Homepage synchronization" items={snapshot.categoryCompletion.homepageSync} />
          <ValidationTable title="Search synchronization" items={snapshot.categoryCompletion.searchSync} />
          <ValidationTable title="Listing synchronization" items={snapshot.categoryCompletion.listingSync} />
          <ValidationTable title="SEO validation" items={snapshot.categoryCompletion.seo} />
          <ValidationTable title="Button validation" items={snapshot.categoryCompletion.buttonValidation} />
          <ValidationTable title="Database validation" items={snapshot.categoryCompletion.databaseValidation} />
          <ValidationTable title="Accessibility" items={snapshot.categoryCompletion.accessibility} />
          <ValidationTable title="Performance" items={snapshot.categoryCompletion.performance} />
          <section className="ea-panel ea-panel--wide">
            <h3>AI Category Engine</h3>
            <table className="ea-table">
              <thead><tr><th>Check</th><th>Confidence</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.categoryCompletion.aiCategoryEngine.map((item) => (
                  <tr key={item.id}>
                    <td>{item.label}</td>
                    <td>{item.confidence}%</td>
                    <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                    <td>{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {activeTab === "search-completion" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Search Completion Status</h3>
            <dl className="ea-metrics">
              <div><dt>Search PASS</dt><dd className={snapshot.searchCompletion.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.searchCompletion.passPercent}%</dd></div>
              <div><dt>Certified</dt><dd className={snapshot.searchCompletion.searchCertified ? "ea-pass" : "ea-warn"}>{snapshot.searchCompletion.searchCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.searchCompletion.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.searchCompletion.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.searchCompletion.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.searchCompletion.launchReady ? "YES" : "NO"}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Search Domains</h3>
            <table className="ea-table">
              <thead><tr><th>Domain</th><th>Reference</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.searchCompletion.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.label}</td>
                    <td><code>{domain.ref}</code></td>
                    <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                    <td>{domain.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Certification Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.searchCompletion.certificationScores.map((score) => (
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
            <h3>PASS Conditions</h3>
            <ul className="ea-list">
              {snapshot.searchCompletion.passConditions.map((condition) => (
                <li key={condition.id} className={condition.pass ? "ea-pass" : "ea-fail"}>{condition.label} — {condition.message}</li>
              ))}
            </ul>
          </section>
          <ValidationTable title="Search engine" items={snapshot.searchCompletion.searchEngine} />
          <ValidationTable title="Filter engine" items={snapshot.searchCompletion.filters} />
          <ValidationTable title="Sorting engine" items={snapshot.searchCompletion.sorting} />
          <ValidationTable title="Search results" items={snapshot.searchCompletion.results} />
          <ValidationTable title="Empty states" items={snapshot.searchCompletion.emptyStates} />
          <ValidationTable title="Performance" items={snapshot.searchCompletion.performance} />
          <ValidationTable title="Database validation" items={snapshot.searchCompletion.database} />
          <ValidationTable title="SEO validation" items={snapshot.searchCompletion.seo} />
          <ValidationTable title="OMEGA global validation" items={snapshot.searchCompletion.omegaGlobal} />
          <ValidationTable title="Accessibility" items={snapshot.searchCompletion.accessibility} />
          <section className="ea-panel ea-panel--wide">
            <h3>AI Search</h3>
            <table className="ea-table">
              <thead><tr><th>Check</th><th>Confidence</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.searchCompletion.aiSearch.map((item) => (
                  <tr key={item.id}>
                    <td>{item.label}</td>
                    <td>{item.confidence}%</td>
                    <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                    <td>{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {activeTab === "listing-completion" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Listing Completion Status</h3>
            <dl className="ea-metrics">
              <div><dt>Listing PASS</dt><dd className={snapshot.listingCompletion.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.listingCompletion.passPercent}%</dd></div>
              <div><dt>Certified</dt><dd className={snapshot.listingCompletion.listingCertified ? "ea-pass" : "ea-warn"}>{snapshot.listingCompletion.listingCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.listingCompletion.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.listingCompletion.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.listingCompletion.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.listingCompletion.launchReady ? "YES" : "NO"}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Listing Domains</h3>
            <table className="ea-table">
              <thead><tr><th>Domain</th><th>Reference</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.listingCompletion.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.label}</td>
                    <td><code>{domain.ref}</code></td>
                    <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                    <td>{domain.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Certification Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.listingCompletion.certificationScores.map((score) => (
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
            <h3>PASS Conditions</h3>
            <ul className="ea-list">
              {snapshot.listingCompletion.passConditions.map((condition) => (
                <li key={condition.id} className={condition.pass ? "ea-pass" : "ea-fail"}>{condition.label} — {condition.message}</li>
              ))}
            </ul>
          </section>
          <ValidationTable title="Listing workflow" items={snapshot.listingCompletion.workflow} />
          <ValidationTable title="Field validation" items={snapshot.listingCompletion.fields} />
          <ValidationTable title="Photo engine" items={snapshot.listingCompletion.photoEngine} />
          <ValidationTable title="Live validation" items={snapshot.listingCompletion.liveValidation} />
          <ValidationTable title="Preview engine" items={snapshot.listingCompletion.previewEngine} />
          <ValidationTable title="Publish validation" items={snapshot.listingCompletion.publishValidation} />
          <ValidationTable title="Button validation" items={snapshot.listingCompletion.buttonValidation} />
          <ValidationTable title="Database validation" items={snapshot.listingCompletion.databaseValidation} />
          <ValidationTable title="OMEGA global validation" items={snapshot.listingCompletion.omegaGlobal} />
          <ValidationTable title="Accessibility" items={snapshot.listingCompletion.accessibility} />
          <ValidationTable title="Performance" items={snapshot.listingCompletion.performance} />
          <section className="ea-panel ea-panel--wide">
            <h3>AI Listing Assistant</h3>
            <table className="ea-table">
              <thead><tr><th>Check</th><th>Confidence</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.listingCompletion.aiListing.map((item) => (
                  <tr key={item.id}>
                    <td>{item.label}</td>
                    <td>{item.confidence}%</td>
                    <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                    <td>{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {activeTab === "buyer-completion" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Buyer Journey Status</h3>
            <dl className="ea-metrics">
              <div><dt>Buyer PASS</dt><dd className={snapshot.buyerCompletion.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.buyerCompletion.passPercent}%</dd></div>
              <div><dt>Certified</dt><dd className={snapshot.buyerCompletion.buyerCertified ? "ea-pass" : "ea-warn"}>{snapshot.buyerCompletion.buyerCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.buyerCompletion.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.buyerCompletion.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.buyerCompletion.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.buyerCompletion.launchReady ? "YES" : "NO"}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Buyer Domains</h3>
            <table className="ea-table">
              <thead><tr><th>Domain</th><th>Reference</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.buyerCompletion.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.label}</td>
                    <td><code>{domain.ref}</code></td>
                    <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                    <td>{domain.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Certification Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.buyerCompletion.certificationScores.map((score) => (
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
            <h3>PASS Conditions</h3>
            <ul className="ea-list">
              {snapshot.buyerCompletion.passConditions.map((condition) => (
                <li key={condition.id} className={condition.pass ? "ea-pass" : "ea-fail"}>{condition.label} — {condition.message}</li>
              ))}
            </ul>
          </section>
          <ValidationTable title="Buyer workflow" items={snapshot.buyerCompletion.workflow} />
          <ValidationTable title="Buyer profile" items={snapshot.buyerCompletion.profile} />
          <ValidationTable title="Shopping experience" items={snapshot.buyerCompletion.shopping} />
          <ValidationTable title="Product page" items={snapshot.buyerCompletion.productPage} />
          <ValidationTable title="Cart" items={snapshot.buyerCompletion.cart} />
          <ValidationTable title="Checkout" items={snapshot.buyerCompletion.checkout} />
          <ValidationTable title="Order management" items={snapshot.buyerCompletion.orders} />
          <ValidationTable title="Notifications" items={snapshot.buyerCompletion.notifications} />
          <ValidationTable title="Button validation" items={snapshot.buyerCompletion.buttons} />
          <ValidationTable title="Database validation" items={snapshot.buyerCompletion.database} />
          <ValidationTable title="OMEGA global validation" items={snapshot.buyerCompletion.omegaGlobal} />
          <ValidationTable title="Accessibility" items={snapshot.buyerCompletion.accessibility} />
          <ValidationTable title="Performance" items={snapshot.buyerCompletion.performance} />
        </>
      )}

      {activeTab === "checkout-completion" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Checkout Program Status</h3>
            <dl className="ea-metrics">
              <div><dt>Checkout PASS</dt><dd className={snapshot.checkoutCompletion.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.checkoutCompletion.passPercent}%</dd></div>
              <div><dt>Certified</dt><dd className={snapshot.checkoutCompletion.checkoutCertified ? "ea-pass" : "ea-warn"}>{snapshot.checkoutCompletion.checkoutCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.checkoutCompletion.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.checkoutCompletion.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.checkoutCompletion.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.checkoutCompletion.launchReady ? "YES" : "NO"}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Checkout Domains</h3>
            <table className="ea-table">
              <thead><tr><th>Domain</th><th>Reference</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.checkoutCompletion.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.label}</td>
                    <td><code>{domain.ref}</code></td>
                    <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                    <td>{domain.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Certification Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.checkoutCompletion.certificationScores.map((score) => (
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
            <h3>PASS Conditions</h3>
            <ul className="ea-list">
              {snapshot.checkoutCompletion.passConditions.map((condition) => (
                <li key={condition.id} className={condition.pass ? "ea-pass" : "ea-fail"}>{condition.label} — {condition.message}</li>
              ))}
            </ul>
          </section>
          <ValidationTable title="Checkout flow" items={snapshot.checkoutCompletion.flow} />
          <ValidationTable title="Payment validation" items={snapshot.checkoutCompletion.payment} />
          <ValidationTable title="Order validation" items={snapshot.checkoutCompletion.order} />
          <ValidationTable title="Security validation" items={snapshot.checkoutCompletion.security} />
          <ValidationTable title="UX validation" items={snapshot.checkoutCompletion.ux} />
          <ValidationTable title="Button validation" items={snapshot.checkoutCompletion.buttons} />
          <ValidationTable title="Database validation" items={snapshot.checkoutCompletion.database} />
          <ValidationTable title="Accessibility" items={snapshot.checkoutCompletion.accessibility} />
          <ValidationTable title="Performance" items={snapshot.checkoutCompletion.performance} />
        </>
      )}

      {activeTab === "order-completion" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Order Management Status</h3>
            <dl className="ea-metrics">
              <div><dt>Order PASS</dt><dd className={snapshot.orderCompletion.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.orderCompletion.passPercent}%</dd></div>
              <div><dt>Certified</dt><dd className={snapshot.orderCompletion.orderCertified ? "ea-pass" : "ea-warn"}>{snapshot.orderCompletion.orderCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.orderCompletion.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.orderCompletion.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.orderCompletion.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.orderCompletion.launchReady ? "YES" : "NO"}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Order Domains</h3>
            <table className="ea-table">
              <thead><tr><th>Domain</th><th>Reference</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.orderCompletion.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.label}</td>
                    <td><code>{domain.ref}</code></td>
                    <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                    <td>{domain.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Certification Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.orderCompletion.certificationScores.map((score) => (
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
            <h3>PASS Conditions</h3>
            <ul className="ea-list">
              {snapshot.orderCompletion.passConditions.map((condition) => (
                <li key={condition.id} className={condition.pass ? "ea-pass" : "ea-fail"}>{condition.label} — {condition.message}</li>
              ))}
            </ul>
          </section>
          <ValidationTable title="Order workflow" items={snapshot.orderCompletion.workflow} />
          <ValidationTable title="Buyer validation" items={snapshot.orderCompletion.buyer} />
          <ValidationTable title="Seller validation" items={snapshot.orderCompletion.seller} />
          <ValidationTable title="Company validation" items={snapshot.orderCompletion.company} />
          <ValidationTable title="Order status engine" items={snapshot.orderCompletion.statusEngine} />
          <ValidationTable title="Database validation" items={snapshot.orderCompletion.database} />
          <ValidationTable title="Security validation" items={snapshot.orderCompletion.security} />
          <ValidationTable title="Accessibility" items={snapshot.orderCompletion.accessibility} />
          <ValidationTable title="Performance" items={snapshot.orderCompletion.performance} />
        </>
      )}

      {activeTab === "shipping-completion" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Shipping & Logistics Status</h3>
            <dl className="ea-metrics">
              <div><dt>Shipping PASS</dt><dd className={snapshot.shippingCompletion.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.shippingCompletion.passPercent}%</dd></div>
              <div><dt>Certified</dt><dd className={snapshot.shippingCompletion.shippingCertified ? "ea-pass" : "ea-warn"}>{snapshot.shippingCompletion.shippingCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.shippingCompletion.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.shippingCompletion.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.shippingCompletion.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.shippingCompletion.launchReady ? "YES" : "NO"}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Shipping Domains</h3>
            <table className="ea-table">
              <thead><tr><th>Domain</th><th>Reference</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.shippingCompletion.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.label}</td>
                    <td><code>{domain.ref}</code></td>
                    <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                    <td>{domain.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Certification Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.shippingCompletion.certificationScores.map((score) => (
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
            <h3>PASS Conditions</h3>
            <ul className="ea-list">
              {snapshot.shippingCompletion.passConditions.map((condition) => (
                <li key={condition.id} className={condition.pass ? "ea-pass" : "ea-fail"}>{condition.label} — {condition.message}</li>
              ))}
            </ul>
          </section>
          <ValidationTable title="Shipping platform" items={snapshot.shippingCompletion.platform} />
          <ValidationTable title="Database validation" items={snapshot.shippingCompletion.database} />
          <ValidationTable title="Security validation" items={snapshot.shippingCompletion.security} />
          <ValidationTable title="Accessibility" items={snapshot.shippingCompletion.accessibility} />
          <ValidationTable title="Performance" items={snapshot.shippingCompletion.performance} />
        </>
      )}

      {activeTab === "communication-completion" && (
        <>
          <section className="ea-panel ea-panel--wide">
            <h3>Communication Platform Status</h3>
            <dl className="ea-metrics">
              <div><dt>Communication PASS</dt><dd className={snapshot.communicationCompletion.status === "pass" ? "ea-pass" : "ea-fail"}>{snapshot.communicationCompletion.passPercent}%</dd></div>
              <div><dt>Certified</dt><dd className={snapshot.communicationCompletion.communicationCertified ? "ea-pass" : "ea-warn"}>{snapshot.communicationCompletion.communicationCertified ? "YES" : "NO"}</dd></div>
              <div><dt>Production Ready</dt><dd className={snapshot.communicationCompletion.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.communicationCompletion.productionReady ? "YES" : "NO"}</dd></div>
              <div><dt>Launch Ready</dt><dd className={snapshot.communicationCompletion.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.communicationCompletion.launchReady ? "YES" : "NO"}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Global Communication Domains</h3>
            <table className="ea-table">
              <thead><tr><th>Domain</th><th>Reference</th><th>Status</th><th>Message</th></tr></thead>
              <tbody>
                {snapshot.communicationCompletion.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.label}</td>
                    <td><code>{domain.ref}</code></td>
                    <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                    <td>{domain.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Certification Scores</h3>
            <table className="ea-table">
              <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
              <tbody>
                {snapshot.communicationCompletion.certificationScores.map((score) => (
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
            <h3>PASS Conditions</h3>
            <ul className="ea-list">
              {snapshot.communicationCompletion.passConditions.map((condition) => (
                <li key={condition.id} className={condition.pass ? "ea-pass" : "ea-fail"}>{condition.label} — {condition.message}</li>
              ))}
            </ul>
          </section>
          <ValidationTable title="Email platform" items={snapshot.communicationCompletion.emailPlatform} />
          <ValidationTable title="Email security" items={snapshot.communicationCompletion.emailSecurity} />
          <ValidationTable title="Push platform" items={snapshot.communicationCompletion.pushPlatform} />
          <ValidationTable title="Cron & queues" items={snapshot.communicationCompletion.cronQueues} />
          <ValidationTable title="Realtime engine" items={snapshot.communicationCompletion.realtime} />
          <ValidationTable title="Database validation" items={snapshot.communicationCompletion.database} />
          <ValidationTable title="Security validation" items={snapshot.communicationCompletion.security} />
          <ValidationTable title="Accessibility" items={snapshot.communicationCompletion.accessibility} />
          <ValidationTable title="Performance" items={snapshot.communicationCompletion.performance} />
        </>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>Completion Reports</h3>
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

      {tabChecks[activeTab] && <ValidationTable title={`${activeTab.replace(/-/g, " ")} validation`} items={tabChecks[activeTab]!} />}
    </EnterpriseAdminShell>
  );
}
