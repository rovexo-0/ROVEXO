"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getRelatedModuleHref } from "@/lib/enterprise-architecture/registry";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR } from "@/lib/omega-development-director/descriptor";
import {
  OMEGA_DEV_DIRECTOR_API,
  OMEGA_DEV_DIRECTOR_ROUTES,
  PROTECTED_AREAS,
  QUALITY_PIPELINE_STAGES,
  REPAIR_STAGES,
} from "@/lib/omega-development-director/registry";
import type { DevDirectorSnapshot, DevDirectorTab } from "@/lib/omega-development-director/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = OMEGA_DEV_DIRECTOR_ROUTES;
const MODULE_ID = OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.id;

type OmegaDevelopmentDirectorAdminProps = { initialSnapshot: DevDirectorSnapshot; defaultTab?: DevDirectorTab };

function statusClass(status: string) {
  if (status === "pass") return "ea-pass";
  if (status === "warning") return "ea-warn";
  if (status === "fail") return "ea-fail";
  if (status === "blocked") return "ea-fail";
  return "";
}

export function OmegaDevelopmentDirectorAdmin({ initialSnapshot, defaultTab = "dashboard" }: OmegaDevelopmentDirectorAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { developmentDirector?: DevDirectorSnapshot };
    if (data.developmentDirector) setSnapshot(data.developmentDirector);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "analyze" ? OMEGA_DEV_DIRECTOR_API.analyze
            : action === "discover" ? OMEGA_DEV_DIRECTOR_API.discover
              : action === "prioritize" ? OMEGA_DEV_DIRECTOR_API.prioritize
                : action === "repair" ? OMEGA_DEV_DIRECTOR_API.repair
                  : action === "export" ? OMEGA_DEV_DIRECTOR_API.export
                    : OMEGA_DEV_DIRECTOR_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; developmentDirector?: DevDirectorSnapshot };
        setMessage(response.ok ? "Development Director action completed." : data.error ?? "Action failed.");
        if (data.developmentDirector) setSnapshot(data.developmentDirector);
        else await refresh();
      });
    },
    [refresh],
  );

  const omegaHref = getRelatedModuleHref(MODULE_ID, "omega-command-center");
  const qaHref = getRelatedModuleHref(MODULE_ID, "omega-quality-assurance-center");
  const governanceHref = getRelatedModuleHref(MODULE_ID, "enterprise-governance-center");
  const developmentHref = getRelatedModuleHref(MODULE_ID, "enterprise-development-center");

  const validations = createOmegaValidations(
    {
      architecture: snapshot.dashboard.platformCompletion >= 90 ? "pass" : "warning",
      performance: (snapshot.boardMetrics.find((m) => m.key === "performance-progress")?.score ?? 0) >= 90 ? "pass" : "warning",
      security: (snapshot.boardMetrics.find((m) => m.key === "security-progress")?.score ?? 0) >= 95 ? "pass" : "pass",
      governance: snapshot.coordinations.find((c) => c.moduleId === "enterprise-governance-center")?.status === "pass" ? "pass" : "warning",
      accessibility: (snapshot.boardMetrics.find((m) => m.key === "accessibility-progress")?.score ?? 0) >= 95 ? "pass" : "warning",
    },
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Development Director"),
        kpis: [
          { id: "progress", label: "Development Progress", value: `${snapshot.dashboard.developmentProgress}%`, status: "healthy" as const },
          { id: "completion", label: "Platform Completion", value: `${snapshot.dashboard.platformCompletion}%`, status: "healthy" as const },
          { id: "score", label: "Enterprise Score", value: `${snapshot.dashboard.enterpriseScore}%`, status: "healthy" as const },
          { id: "findings", label: "Open Findings", value: snapshot.dashboard.openFindings, status: snapshot.dashboard.openFindings > 0 ? "warning" as const : "healthy" as const },
        ],
        recentActivity: snapshot.auditEntries.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: ["OMEGA Development Director: Never modifies production — all recommendations pass through QA, Security, Governance, and Certification."],
        quickActions: [
          ...(omegaHref ? [{ label: "OMEGA Command", href: omegaHref }] : []),
          ...(qaHref ? [{ label: "QA Center", href: qaHref }] : []),
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="OMEGA Development Director"
      title="Autonomous Enterprise Development Director"
      description="Continuously analyzes the platform, detects unfinished work, prioritizes roadmap items, and coordinates enterprise modules — recommendation-only, never direct production changes."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={
        snapshot.settings.recommendationOnlyMode
          ? "Recommendation-only mode active — no direct production modifications."
          : snapshot.pendingPublish
            ? "Pending publish — draft differs from live."
            : undefined
      }
      aiInsight="OMEGA PRIME: Development Director is the permanent architectural coordinator of the ROVEXO ecosystem."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("analyze")}>Run Code Analysis</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("discover")}>Discovery Scan</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("prioritize")}>Reprioritize Roadmap</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("repair", { issue: "Platform improvement opportunity" })}>Generate Repair Proposal</Button>
        </>
      }
      quickLinks={[
        ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ...(qaHref ? [{ label: "QA Center", href: qaHref }] : []),
        ...(governanceHref ? [{ label: "Governance", href: governanceHref }] : []),
        ...(developmentHref ? [{ label: "Development Center", href: developmentHref }] : []),
        { label: "Certification Center", href: "/super-admin/certification" },
      ]}
    >
      {activeTab === "analysis" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Autonomous Code Analysis</h3>
          <p className="ea-admin__desc">Continuous analysis across codebase, routes, components, APIs, database, enterprise modules, and marketplace domains.</p>
          <table className="ea-table">
            <thead><tr><th>Domain</th><th>Status</th><th>Coverage</th><th>Issues</th><th>Last Analyzed</th></tr></thead>
            <tbody>
              {snapshot.codeAnalysis.map((domain) => (
                <tr key={domain.domain}>
                  <td>{domain.label}</td>
                  <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                  <td>{domain.coverage}%</td>
                  <td>{domain.issues}</td>
                  <td>{new Date(domain.lastAnalyzedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "discovery" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Development Discovery</h3>
          <table className="ea-table">
            <thead><tr><th>Category</th><th>Label</th><th>Target</th><th>Severity</th><th>Status</th><th>Detected</th></tr></thead>
            <tbody>
              {snapshot.discoveries.map((finding) => (
                <tr key={finding.id}>
                  <td>{finding.category.replace(/-/g, " ")}</td>
                  <td>{finding.label}</td>
                  <td>{finding.target}</td>
                  <td className={finding.severity === "critical" ? "ea-fail" : finding.severity === "high" ? "ea-warn" : ""}>{finding.severity}</td>
                  <td className={statusClass(finding.status)}>{finding.status.toUpperCase()}</td>
                  <td>{new Date(finding.detectedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "status" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Implementation Status</h3>
          <table className="ea-table">
            <thead><tr><th>Feature</th><th>Module</th><th>Stage</th><th>Progress</th><th>Blockers</th></tr></thead>
            <tbody>
              {snapshot.implementations.map((item) => (
                <tr key={item.id}>
                  <td>{item.feature}</td>
                  <td>{item.moduleId ?? "—"}</td>
                  <td>{item.stage.replace(/-/g, " ")}</td>
                  <td>{item.progress}%</td>
                  <td>{item.blockers.length ? item.blockers.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "roadmap" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Project Roadmap</h3>
          <table className="ea-table">
            <thead><tr><th>Title</th><th>Priority</th><th>Complexity</th><th>Risk</th><th>Business</th><th>Enterprise</th><th>Certification</th><th>Stage</th></tr></thead>
            <tbody>
              {snapshot.roadmap.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td className={item.priority === "critical" ? "ea-fail" : item.priority === "high" ? "ea-warn" : ""}>{item.priority}</td>
                  <td>{item.complexity}</td>
                  <td>{item.riskScore}</td>
                  <td>{item.businessImpact}</td>
                  <td>{item.enterpriseImpact}</td>
                  <td>{item.certificationImpact}</td>
                  <td>{item.stage.replace(/-/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "dependencies" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Dependency Graph</h3>
          <table className="ea-table">
            <thead><tr><th>Module</th><th>Type</th><th>Dependencies</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.dependencyGraph.nodes.map((node) => (
                <tr key={node.id}>
                  <td>{node.label}</td>
                  <td>{node.type}</td>
                  <td>{node.dependencies.join(", ") || "—"}</td>
                  <td className={statusClass(node.status)}>{node.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4>Dependency Issues</h4>
          <ul className="ea-list">
            {snapshot.dependencyGraph.issues.map((issue) => (
              <li key={issue.id}>
                <strong>{issue.type.replace(/-/g, " ")}</strong> — {issue.message}
                {issue.moduleId && <> · module: {issue.moduleId}</>}
                <span className={cn("ea-chip", issue.severity === "critical" ? "ea-chip--danger" : "")}> {issue.severity}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "pipeline" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Quality Pipeline</h3>
          <div className="ea-chip-row">
            {QUALITY_PIPELINE_STAGES.map((stage) => (
              <span key={stage} className="ea-chip ea-chip--active">{stage.replace(/-/g, " ")}</span>
            ))}
          </div>
          <table className="ea-table">
            <thead><tr><th>Feature</th><th>Current Stage</th><th>Completed</th><th>Blocked</th><th>Awaiting Approval</th></tr></thead>
            <tbody>
              {snapshot.pipeline.map((item) => (
                <tr key={item.id}>
                  <td>{item.feature}</td>
                  <td>{item.currentStage.replace(/-/g, " ")}</td>
                  <td>{item.stagesCompleted.map((s) => s.replace(/-/g, " ")).join(" → ")}</td>
                  <td className={item.blocked ? "ea-fail" : "ea-pass"}>{item.blocked ? "YES" : "NO"}</td>
                  <td className={item.awaitingApproval ? "ea-warn" : "ea-pass"}>{item.awaitingApproval ? "YES" : "NO"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "repair" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Safe Repair Mode</h3>
          <div className="ea-chip-row">
            {REPAIR_STAGES.map((stage) => (
              <span key={stage} className="ea-chip ea-chip--active">{stage.replace(/-/g, " ")}</span>
            ))}
          </div>
          <p className="ea-admin__desc">Protected areas: {PROTECTED_AREAS.map((a) => a.replace(/-/g, " ")).join(", ")}</p>
          <ul className="ea-list">
            {snapshot.repairProposals.map((proposal) => (
              <li key={proposal.id}>
                <strong>{proposal.issue}</strong> — stage: {proposal.stage.replace(/-/g, " ")} · {proposal.status}
                {proposal.protectedAreaViolation && <span className="ea-chip ea-chip--danger"> PROTECTED</span>}
                <br />
                <small>Root cause: {proposal.rootCause}</small>
                <br />
                <small>Proposal: {proposal.proposal}</small>
                {!proposal.protectedAreaViolation && !proposal.readyForReview && (
                  <div className="ea-admin__actions">
                    <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("repair", { repairId: proposal.id })}>Advance Repair</Button>
                  </div>
                )}
                {proposal.readyForReview && (
                  <span className={cn("ea-chip", "ea-chip--active")}>Ready for review</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "insights" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Development Insights</h3>
          <ul className="ea-list">
            {snapshot.insights.map((insight) => (
              <li key={insight.id}>
                <strong>{insight.title}</strong> — {insight.category} · impact: {insight.impact}
                <br />
                <small>{insight.summary}</small>
                {insight.recommendationOnly && <span className="ea-chip ea-chip--active"> Recommendation only</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "coordination" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Enterprise Coordination</h3>
          <table className="ea-table">
            <thead><tr><th>Module</th><th>Role</th><th>Status</th><th>Pending Recommendations</th><th>Last Sync</th></tr></thead>
            <tbody>
              {snapshot.coordinations.map((coord) => (
                <tr key={coord.moduleId}>
                  <td>
                    {getRelatedModuleHref(MODULE_ID, coord.moduleId)
                      ? <Link href={getRelatedModuleHref(MODULE_ID, coord.moduleId)!} className="ea-link">{coord.label}</Link>
                      : coord.label}
                  </td>
                  <td>{coord.role}</td>
                  <td className={statusClass(coord.status)}>{coord.status.toUpperCase()}</td>
                  <td>{coord.pendingRecommendations}</td>
                  <td>{new Date(coord.lastSyncAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>Development Reports & Export</h3>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
          </div>
          <dl className="ea-metrics">
            {snapshot.boardMetrics.map((metric) => (
              <div key={metric.key}><dt>{metric.label}</dt><dd className={statusClass(metric.status)}>{metric.score}%</dd></div>
            ))}
          </dl>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}
