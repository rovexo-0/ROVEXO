"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR } from "@/lib/omega-command-center/descriptor";
import { OMEGA_COMMAND_CENTER_API, OMEGA_ENGINE_ROUTES, OMEGA_SCAN_TYPES } from "@/lib/omega-command-center/registry";
import type { OmegaSnapshot } from "@/lib/omega-command-center/types";

type OmegaCommandCenterAdminProps = { initialSnapshot: OmegaSnapshot };

function statusColor(status: string) {
  if (status === "running" || status === "completed" || status === "healthy") return "omega-status--green";
  if (status === "waiting" || status === "paused" || status === "warning") return "omega-status--orange";
  return "omega-status--red";
}

export function OmegaCommandCenterAdmin({ initialSnapshot }: OmegaCommandCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { omega?: OmegaSnapshot };
    if (data.omega) setSnapshot(data.omega);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "run-scan" ? OMEGA_COMMAND_CENTER_API.runScan
            : action === "quick-scan" ? OMEGA_COMMAND_CENTER_API.quickScan
              : action === "deep-scan" ? OMEGA_COMMAND_CENTER_API.deepScan
                : action === "pause" ? OMEGA_COMMAND_CENTER_API.pause
                  : action === "resume" ? OMEGA_COMMAND_CENTER_API.resume
                    : action === "cancel" ? OMEGA_COMMAND_CENTER_API.cancel
                      : action === "repair" ? OMEGA_COMMAND_CENTER_API.repair
                        : action === "deploy" ? OMEGA_COMMAND_CENTER_API.deploy
                          : action === "rollback" ? OMEGA_COMMAND_CENTER_API.rollback
                            : action === "report" ? OMEGA_COMMAND_CENTER_API.report
                              : action === "export" ? OMEGA_COMMAND_CENTER_API.export
                                : OMEGA_COMMAND_CENTER_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; omega?: OmegaSnapshot };
        setMessage(response.ok ? "OMEGA action completed." : data.error ?? "Action failed.");
        if (data.omega) setSnapshot(data.omega);
        else await refresh();
      });
    },
    [refresh],
  );

  const d = snapshot.dashboard;
  const score = d.enterpriseScore;

  return (
    <div className="omega-admin">
      <header className="omega-admin__header">
        <div>
          <p className="omega-admin__eyebrow">ROVEXO OMEGA Command Center</p>
          <h2 className="omega-admin__title">Unified Enterprise AI Orchestrator</h2>
          <p className="omega-admin__desc">
            All AI flows through OMEGA — SCAN analyzes, SENTINEL protects, ORACLE predicts, PHOENIX heals, TITAN automates, ATLAS maps, GUARDIAN governs.
          </p>
        </div>
        <div className="omega-gauge" aria-label={`Enterprise Score ${score}`}>
          <div className="omega-gauge__ring" style={{ "--omega-score": score } as React.CSSProperties}>
            <strong>{score}</strong>
            <span>Enterprise Score</span>
          </div>
        </div>
      </header>

      <div className="omega-admin__actions">
        <Button type="button" disabled={isPending} onClick={() => runAction("run-scan")}>Run Enterprise Scan</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("quick-scan")}>Quick Scan</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("deep-scan")}>Deep Scan</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("report")}>Generate Report</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("pause")}>Pause</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("resume")}>Resume</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("cancel")}>Cancel</Button>
        <Link href="/super-admin/mobile/omega" className="omega-link">Mobile Mirror</Link>
        <Link href="/super-admin/ai" className="omega-link">AI OS</Link>
      </div>

      <div className="omega-scan-types">
        {OMEGA_SCAN_TYPES.filter((t) => !["enterprise", "quick", "deep"].includes(t)).map((type) => (
          <Button key={type} type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("run-scan", { scanType: type })}>
            {type.replace(/-/g, " ")}
          </Button>
        ))}
      </div>

      {message && <p className="omega-admin__message">{message}</p>}
      {snapshot.pendingPublish && <p className="omega-admin__banner">Pending publish — draft differs from live.</p>}

      {d.activeScan && (
        <section className="omega-panel omega-panel--scan">
          <h3>Enterprise Scan Progress</h3>
          <p>Status: {d.activeScan.status} · Engine: {d.activeScan.currentEngine ?? "complete"} · Phase: {d.activeScan.currentPhase ?? "done"}</p>
          <div className="omega-progress">
            <div className="omega-progress__bar" style={{ width: `${(d.activeScan.enginesCompleted.length / 7) * 100}%` }} />
          </div>
        </section>
      )}

      <section className="omega-panel">
        <h3>Enterprise Health</h3>
        <div className="omega-health-grid">
          {d.healthCards.map((card) => (
            <div key={card.domain} className={cn("omega-health-card", `omega-health-card--${card.status}`)}>
              <span>{card.label}</span>
              <strong>{card.score}%</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="omega-panel">
        <h3>AI Engines — Live Status</h3>
        <div className="omega-engines">
          {d.engineStates.map((engine) => (
            <Link key={engine.id} href={OMEGA_ENGINE_ROUTES.find((e) => e.id === engine.id)?.href ?? "/super-admin/omega"} className={cn("omega-engine", statusColor(engine.status))}>
              <span className="omega-engine__label">{engine.label}</span>
              <span className="omega-engine__status">{engine.status}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="omega-grid">
        <section className="omega-panel">
          <h3>AI Timeline</h3>
          <ol className="omega-timeline">
            {d.timeline.map((entry) => (
              <li key={entry.id} className={`omega-timeline__item omega-timeline__item--${entry.severity}`}>
                <time>{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                <span>{entry.message}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="omega-panel">
          <h3>Executive Decision</h3>
          {d.executiveReport && (
            <div className="omega-exec">
              <p>{d.executiveReport.executiveSummary}</p>
              <p className="omega-exec__risk">{d.executiveReport.riskSummary}</p>
            </div>
          )}
          <ul className="omega-recs">
            {d.recommendations.map((rec) => (
              <li key={rec.id} className={`omega-rec omega-rec--${rec.priority}`}>
                <strong>{rec.title}</strong>
                <span>{rec.priority} · Risk {rec.risk}% · ~{rec.repairTimeMinutes}min</span>
                <div className="omega-rec__actions">
                  <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("repair", { recommendationId: rec.id })}>Auto Repair</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="omega-panel">
        <h3>Live Monitor</h3>
        <div className="omega-monitor-grid">
          {d.liveMonitor.map((m) => (
            <div key={m.widget} className={cn("omega-monitor", `omega-monitor--${m.status}`)}>
              <span>{m.label}</span>
              <strong>{m.value}{m.unit === "%" ? "%" : ` ${m.unit}`}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="omega-panel">
        <h3>Enterprise Search</h3>
        <input
          className="omega-search"
          type="search"
          placeholder="Search orders, listings, users, modules, workflows, incidents, AI, security..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery.length >= 2 && (
          <p className="omega-search-hint">Search routed through OMEGA — query: &quot;{searchQuery}&quot;</p>
        )}
      </section>

      <div className="omega-admin__footer-actions">
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>Export JSON</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>Export PDF</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>Export CSV</Button>
        <Link href="/super-admin/mobile/omega/scans" className="omega-link">Mobile Quick Scan</Link>
      </div>
    </div>
  );
}
