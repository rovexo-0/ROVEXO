"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-deployment-center/descriptor";
import {
  DEPLOYMENT_CENTER_API,
  DEPLOYMENT_CENTER_ROUTES,
  DEPLOYMENT_STRATEGIES,
  RELEASE_TYPES,
} from "@/lib/enterprise-deployment-center/registry";
import type { DeploymentSnapshot, DeploymentTab } from "@/lib/enterprise-deployment-center/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const MODULE_ID = ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.id;

type EnterpriseDeploymentCenterAdminProps = {
  initialSnapshot: DeploymentSnapshot;
  defaultTab?: DeploymentTab;
};

export function EnterpriseDeploymentCenterAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
}: EnterpriseDeploymentCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(ENTERPRISE_DEPLOYMENT_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { deploymentCenter?: DeploymentSnapshot };
    if (data.deploymentCenter) setSnapshot(data.deploymentCenter);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "build"
            ? DEPLOYMENT_CENTER_API.build
            : action === "validate"
              ? DEPLOYMENT_CENTER_API.validate
              : action === "deploy"
                ? DEPLOYMENT_CENTER_API.deploy
                : action === "approve"
                  ? DEPLOYMENT_CENTER_API.approve
                  : action === "reject"
                    ? DEPLOYMENT_CENTER_API.reject
                    : action === "rollback"
                      ? DEPLOYMENT_CENTER_API.rollback
                      : action === "cancel"
                        ? DEPLOYMENT_CENTER_API.cancel
                        : `${DEPLOYMENT_CENTER_API.snapshot}/action`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; deploymentCenter?: DeploymentSnapshot };
        setMessage(response.ok ? "Deployment action completed." : data.error ?? "Action failed.");
        if (data.deploymentCenter) setSnapshot(data.deploymentCenter);
        else await refresh();
      });
    },
    [refresh],
  );

  const pendingRelease = snapshot.releases.find((r) => r.status === "pending-approval");

  const validations = createOmegaValidations(
    undefined,
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Deployment"),
        kpis: [
          { id: "health", label: "Deployment Health", value: `${snapshot.dashboard.deploymentHealth}%`, status: "healthy" as const },
          { id: "production", label: "Production", value: snapshot.dashboard.productionVersion, status: "healthy" as const },
          { id: "pending", label: "Pending Approvals", value: snapshot.dashboard.pendingApprovals, status: "healthy" as const },
          { id: "queue", label: "Queue", value: snapshot.dashboard.queueLength, status: "healthy" as const },
        ],
        recentActivity: snapshot.auditLog.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: snapshot.aiInsights.slice(0, 3).map((i) => `${i.type}: ${i.summary}`),
        quickActions: [
          { label: "Certification Center", href: "/super-admin/certification" },
          { label: "Recovery Center", href: "/super-admin/recovery" },
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Deployment & Release Center"
      title="Production DevOps Platform"
      description="Validate, approve, deploy, and rollback every ROVEXO component through a certified gateway."
      enterpriseScore={snapshot.health.score}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={DEPLOYMENT_CENTER_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={snapshot.pendingPublish ? "Pending publish — draft differs from live." : undefined}
      aiInsight="OMEGA PRIME: Deployment Center is production ready for global enterprise audit."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("build")}>
            Build
          </Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("validate", { releaseId: pendingRelease?.id })}>
            Validate
          </Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => refresh()}>
            Refresh
          </Button>
        </>
      }
      quickLinks={[
        { label: "Certification Center", href: "/super-admin/certification" },
        { label: "Recovery Center", href: "/super-admin/recovery" },
      ]}
    >
      {activeTab === "dashboard" && snapshot.aiInsights.length > 0 && (
        <section className="ea-panel">
          <h3>AI Insights</h3>
          <ul className="ea-list">
            {snapshot.aiInsights.slice(0, 5).map((i) => (
              <li key={i.id}><strong>{i.type}</strong> — {i.summary} ({i.score}%)</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "environments" && (
        <section className="ea-panel">
          <h3>Environment Center</h3>
          <ul className="ea-list">
            {snapshot.environments.map((e) => (
              <li key={e.id}><strong>{e.label}</strong> — v{e.version} · {e.status}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "releases" && (
        <section className="ea-panel">
          <h3>Release Center</h3>
          <div className="edc-build-modes">
            {RELEASE_TYPES.slice(0, 4).map((type) => (
              <Button key={type} type="button" variant="secondary" disabled={isPending} onClick={() => runAction("create-release", { releaseType: type })}>
                {type}
              </Button>
            ))}
          </div>
          <ul className="ea-list">
            {snapshot.releases.map((r) => (
              <li key={r.id}>
                <strong>{r.version}</strong> [{r.type}] — {r.environment} · {r.status} · {r.stage}
                {r.status === "pending-approval" && (
                  <span className="edc-inline-actions">
                    <Button type="button" size="sm" disabled={isPending} onClick={() => runAction("approve", { releaseId: r.id })}>Approve</Button>
                    <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("reject", { releaseId: r.id })}>Reject</Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "builds" && (
        <section className="ea-panel">
          <h3>Build & Deploy</h3>
          <div className="edc-build-modes">
            {DEPLOYMENT_STRATEGIES.map((s) => (
              <Button key={s} type="button" variant="secondary" disabled={isPending} onClick={() => runAction("deploy", { strategy: s, releaseId: snapshot.releases.find((r) => r.status === "approved")?.id })}>
                {s}
              </Button>
            ))}
          </div>
          <ul className="ea-list">
            {snapshot.builds.map((b) => (
              <li key={b.id}><strong>{b.version}</strong> — {b.artifact} · {b.status} · {b.validations.length} validations</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "rollback" && (
        <section className="ea-panel">
          <h3>Rollback Center</h3>
          <Button type="button" variant="secondary" disabled={isPending || !snapshot.dashboard.rollbackAvailable} onClick={() => runAction("rollback", { releaseId: snapshot.releases.find((r) => r.status === "deployed")?.id })}>
            One-click Rollback
          </Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("rollback", { emergency: true, releaseId: snapshot.releases.find((r) => r.status === "deployed")?.id })}>
            Emergency Rollback
          </Button>
          <ul className="ea-list">
            {snapshot.releases.filter((r) => r.status === "deployed" || r.status === "rolled-back").map((r) => (
              <li key={r.id}>{r.version} — {r.environment} · {r.status}</li>
            ))}
          </ul>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}
