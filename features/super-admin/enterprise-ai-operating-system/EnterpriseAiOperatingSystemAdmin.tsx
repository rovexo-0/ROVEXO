"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ENTERPRISE_AI_OS_MODULE_DESCRIPTOR } from "@/lib/enterprise-ai-operating-system/descriptor";
import {
  ENTERPRISE_AI_OS_API,
  ENTERPRISE_AI_OS_ROUTES,
  SCAN_MODES,
} from "@/lib/enterprise-ai-operating-system/registry";
import type { AiOsSnapshot, AiOsTab } from "@/lib/enterprise-ai-operating-system/types";

type EnterpriseAiOperatingSystemAdminProps = {
  initialSnapshot: AiOsSnapshot;
  defaultTab?: AiOsTab;
};

export function EnterpriseAiOperatingSystemAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
}: EnterpriseAiOperatingSystemAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { enterpriseAiOs?: AiOsSnapshot };
    if (data.enterpriseAiOs) setSnapshot(data.enterpriseAiOs);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "run-scan"
            ? ENTERPRISE_AI_OS_API.runScan
            : action === "run-analysis"
              ? ENTERPRISE_AI_OS_API.runAnalysis
              : action === "create-repair-plan"
                ? ENTERPRISE_AI_OS_API.createRepairPlan
                : action === "approve-repair"
                  ? ENTERPRISE_AI_OS_API.approveRepair
                  : action === "cancel-repair"
                    ? ENTERPRISE_AI_OS_API.cancelRepair
                    : `${ENTERPRISE_AI_OS_API.snapshot}/action`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; enterpriseAiOs?: AiOsSnapshot };
        setMessage(response.ok ? "AI action completed." : data.error ?? "Action failed.");
        if (data.enterpriseAiOs) setSnapshot(data.enterpriseAiOs);
        else await refresh();
      });
    },
    [refresh],
  );

  return (
    <div className="aios-admin">
      <header className="aios-admin__header">
        <div>
          <p className="aios-admin__eyebrow">Enterprise AI Operating System</p>
          <h2 className="aios-admin__title">SCAN • SENTINEL • OMEGA</h2>
          <p className="aios-admin__desc">
            Central AI layer — monitor, analyse, predict, repair, and optimise every enterprise module.
          </p>
        </div>
        <div className="aios-admin__scores">
          <div className="aios-score">
            <span>AI Health</span>
            <strong>{snapshot.dashboard.aiHealthScore}%</strong>
          </div>
          <div className="aios-score aios-score--sentinel">
            <span>Security</span>
            <strong>{snapshot.sentinelScores.securityScore}%</strong>
          </div>
          <div className="aios-score aios-score--omega">
            <span>Status</span>
            <strong>{snapshot.dashboard.aiStatus}</strong>
          </div>
        </div>
      </header>

      <div className="aios-admin__actions">
        <Button type="button" disabled={isPending} onClick={() => runAction("run-scan", { mode: "quick" })}>
          Quick Scan
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("run-analysis")}>
          Run Analysis
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => refresh()}>
          Refresh
        </Button>
        <Link href="/super-admin/module-registry" className="aios-link">Module Registry</Link>
        <Link href="/super-admin/workflows" className="aios-link">Workflow Engine</Link>
      </div>

      {message && <p className="aios-admin__message">{message}</p>}
      {snapshot.pendingPublish && <p className="aios-admin__banner">Pending publish — draft differs from live.</p>}

      <nav className="aios-tabs" aria-label="AI OS sections">
        {ENTERPRISE_AI_OS_ROUTES.map((route) => (
          <Link
            key={route.id}
            href={route.href}
            className={cn("aios-tab", activeTab === route.id && "aios-tab--active")}
          >
            {route.label}
          </Link>
        ))}
      </nav>

      {activeTab === "dashboard" && (
        <div className="aios-grid">
          <section className="aios-panel">
            <h3>AI Command Center</h3>
            <dl className="aios-metrics">
              <div><dt>Active Scans</dt><dd>{snapshot.dashboard.activeScans}</dd></div>
              <div><dt>Sentinel Alerts</dt><dd>{snapshot.dashboard.sentinelAlerts}</dd></div>
              <div><dt>Pending Repairs</dt><dd>{snapshot.dashboard.pendingRepairs}</dd></div>
              <div><dt>Recommendations</dt><dd>{snapshot.dashboard.recommendationsCount}</dd></div>
              <div><dt>Predictions</dt><dd>{snapshot.dashboard.predictionsCount}</dd></div>
              <div><dt>Learning</dt><dd>{snapshot.dashboard.learningStatus}</dd></div>
              <div><dt>Automation Queue</dt><dd>{snapshot.dashboard.automationQueue}</dd></div>
              <div><dt>Health Score</dt><dd>{snapshot.health.score}%</dd></div>
            </dl>
          </section>
          <section className="aios-panel">
            <h3>AI Models</h3>
            <ul className="aios-list">
              {snapshot.models.map((m) => (
                <li key={m.id}>
                  <strong>{m.name}</strong> — {m.provider} · {m.status} · {m.latencyMs}ms
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {activeTab === "scan" && (
        <section className="aios-panel">
          <h3>AI Scan Center</h3>
          <div className="aios-scan-modes">
            {SCAN_MODES.map((mode) => (
              <Button
                key={mode}
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => runAction("run-scan", { mode })}
              >
                {mode}
              </Button>
            ))}
          </div>
          <ul className="aios-list">
            {snapshot.scans.map((s) => (
              <li key={s.id}>
                <strong>{s.mode}</strong> — score {s.score}% · {s.findings} findings · {s.summary}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "sentinel" && (
        <div className="aios-grid">
          <section className="aios-panel">
            <h3>Sentinel Scores</h3>
            <dl className="aios-metrics">
              <div><dt>Security</dt><dd>{snapshot.sentinelScores.securityScore}%</dd></div>
              <div><dt>Trust</dt><dd>{snapshot.sentinelScores.trustScore}%</dd></div>
              <div><dt>Marketplace Risk</dt><dd>{snapshot.sentinelScores.marketplaceRisk}%</dd></div>
              <div><dt>Infrastructure Risk</dt><dd>{snapshot.sentinelScores.infrastructureRisk}%</dd></div>
            </dl>
          </section>
          <section className="aios-panel">
            <h3>Alerts</h3>
            <ul className="aios-list">
              {snapshot.alerts.map((a) => (
                <li key={a.id} className={cn(a.severity === "critical" && "aios-alert--critical")}>
                  <strong>{a.title}</strong> [{a.severity}] — {a.description}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {activeTab === "omega" && (
        <section className="aios-panel">
          <h3>Omega Recommendations</h3>
          <ul className="aios-list">
            {snapshot.recommendations.map((r) => (
              <li key={r.id}>
                <strong>{r.title}</strong> [{r.priority}] — {r.description} (confidence {(r.confidence * 100).toFixed(0)}%)
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "predictions" && (
        <section className="aios-panel">
          <h3>AI Predictions</h3>
          <ul className="aios-list">
            {snapshot.predictions.map((p) => (
              <li key={p.id}>
                <strong>{p.type}</strong> — {p.value} {p.unit} ({p.horizon}) · trend {p.trend}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "repairs" && (
        <section className="aios-panel">
          <h3>Repair Queue</h3>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => runAction("create-repair-plan", { issueType: "configuration-drift" })}
          >
            Create Repair Plan
          </Button>
          <ul className="aios-list">
            {snapshot.repairs.map((r) => (
              <li key={r.id}>
                <strong>{r.title}</strong> — {r.status}
                {r.status === "pending-approval" && (
                  <span className="aios-repair-actions">
                    <Button type="button" size="sm" disabled={isPending} onClick={() => runAction("approve-repair", { repairId: r.id })}>
                      Approve
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("cancel-repair", { repairId: r.id })}>
                      Cancel
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "history" && (
        <section className="aios-panel">
          <h3>Configuration History</h3>
          <ul className="aios-list">
            {snapshot.history.map((h) => (
              <li key={h.id}>{h.action} by {h.actor} at {h.timestamp}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "logs" && (
        <section className="aios-panel">
          <h3>AI Logs</h3>
          <ul className="aios-list">
            {snapshot.auditLog.map((e) => (
              <li key={e.id}>{e.action} — {e.actor} → {e.target} ({e.timestamp})</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
