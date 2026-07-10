"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { cn } from "@/lib/cn";
import type { CommandOsSearchResult, CommandOsSnapshot } from "@/lib/command-os-v4/types";
import { COMMAND_OS_ROOT_MODULES } from "@/lib/command-os-v4/registry";

export type CommandOsTab =
  | "overview"
  | "mission-control"
  | "digital-twin"
  | "health"
  | "modules"
  | "search"
  | "operations";

type CommandOsShellProps = {
  initialSnapshot: CommandOsSnapshot;
  defaultTab?: string;
};

const STATE_TABS: Array<{ id: CommandOsTab; label: string }> = [
  { id: "overview", label: "Command OS" },
  { id: "mission-control", label: "Mission Control" },
  { id: "digital-twin", label: "Digital Twin" },
  { id: "health", label: "Health Center" },
  { id: "modules", label: "Root Modules" },
  { id: "operations", label: "One-Click Ops" },
];

const VALID = new Set<string>([...STATE_TABS.map((t) => t.id), "search"]);

function resolveTab(value?: string): CommandOsTab {
  if (value && VALID.has(value)) return value as CommandOsTab;
  return "overview";
}

function statusClass(status: string): string {
  if (status === "healthy" || status === "pass") return "cos-status--healthy";
  if (status === "warning" || status === "degraded") return "cos-status--warning";
  return "cos-status--critical";
}

export function CommandOsShell({ initialSnapshot, defaultTab }: CommandOsShellProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [tab, setTab] = useState<CommandOsTab>(() => resolveTab(defaultTab));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CommandOsSearchResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const healthStatus = useMemo(() => {
    if (snapshot.platformScore >= 90) return "healthy" as const;
    if (snapshot.platformScore >= 75) return "warning" as const;
    return "critical" as const;
  }, [snapshot.platformScore]);

  const runAction = useCallback((action: string, query?: string) => {
    startTransition(async () => {
      setMessage(null);
      try {
        const response = await fetch("/api/super-admin/command-os", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, query }),
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          message?: string;
          results?: CommandOsSearchResult[];
          error?: string;
        };
        if (!response.ok || !payload.ok) {
          setMessage(payload.error ?? "Command OS action failed.");
          return;
        }
        if (payload.results) {
          setSearchResults(payload.results);
          setTab("search");
        }
        setMessage(payload.message ?? "Action completed.");
        const refresh = await fetch("/api/super-admin/command-os");
        if (refresh.ok) {
          const next = (await refresh.json()) as CommandOsSnapshot;
          setSnapshot(next);
        }
      } catch {
        setMessage("Network error running Command OS action.");
      }
    });
  }, []);

  const onSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      void runAction("global-search", query);
    },
    [runAction],
  );

  return (
    <EnterpriseAdminShell
      moduleId="command-os-v4"
      eyebrow="ROVEXO Command OS Enterprise v4.0"
      title="Platform Operating System"
      description="Every module, configuration, workflow, audit, certification, and release orchestrated from one centralized Command OS."
      enterpriseScore={snapshot.platformScore}
      healthStatus={healthStatus}
      stateTabs={STATE_TABS}
      activeTab={tab}
      onTabChange={(next) => setTab(resolveTab(next))}
      searchQuery={searchQuery}
      onSearchChange={onSearch}
      searchPlaceholder="Search anything — modules, pages, assets, configuration…"
      message={message}
      isPending={isPending}
      quickLinks={[
        { label: "Mission Control", href: "/super-admin" },
        { label: "Experience OS", href: "/super-admin/experience" },
        { label: "Certification", href: "/super-admin/certification" },
        { label: "Emergency", href: "/super-admin/command" },
      ]}
    >
      {tab === "overview" ? (
        <section className="cos-panel">
          <div className="cos-stats">
            <article className="cos-stat">
              <strong>{snapshot.platformScore}%</strong>
              <span>Platform Score</span>
            </article>
            <article className="cos-stat">
              <strong>{COMMAND_OS_ROOT_MODULES.length}</strong>
              <span>Root OS Modules</span>
            </article>
            <article className="cos-stat">
              <strong className={statusClass(snapshot.platformStatus)}>{snapshot.platformStatus}</strong>
              <span>Platform Status</span>
            </article>
            <article className="cos-stat">
              <strong className={statusClass(snapshot.certifications.bringYourItem)}>BYI</strong>
              <span>Bring Your Item</span>
            </article>
            <article className="cos-stat">
              <strong className={statusClass(snapshot.certifications.sendcloudProduction)}>Sendcloud</strong>
              <span>Shipping Cert</span>
            </article>
          </div>
          <p className="cos-note">
            Command OS is the highest architectural authority of ROVEXO. Single Source of Truth. No duplicate
            configuration. No disconnected modules.
          </p>
          <div className="cos-grid">
            {COMMAND_OS_ROOT_MODULES.slice(0, 12).map((mod) => (
              <Link key={mod.id} href={mod.href} className="cos-module-card">
                <span className="cos-module-card__icon"><ModuleIcon href={mod.href} id={mod.id} /></span>
                <strong>{mod.label}</strong>
                <p>{mod.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "mission-control" ? (
        <section className="cos-panel">
          <h2 className="cos-panel__title">Mission Control — Realtime</h2>
          <div className="cos-metrics">
            {snapshot.missionMetrics.map((metric) => (
              <article key={metric.id} className="cos-metric">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                {metric.href ? (
                  <Link href={metric.href} className="cos-link">
                    Open
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
          <Link href="/super-admin" className="cos-link">
            Open full Mission Control dashboard →
          </Link>
        </section>
      ) : null}

      {tab === "digital-twin" ? (
        <section className="cos-panel">
          <h2 className="cos-panel__title">Digital Twin</h2>
          <p className="cos-note">Live representation synchronized from production metrics.</p>
          <div className="cos-twin-grid">
            {snapshot.digitalTwin.map((node) => (
              <article key={node.id} className={cn("cos-twin-node", statusClass(node.status))}>
                <span className="cos-twin-node__category">{node.category}</span>
                <strong>{node.label}</strong>
                {node.value != null ? <p>{node.value}</p> : null}
                {node.href ? (
                  <Link href={node.href} className="cos-link">
                    Inspect
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "health" ? (
        <section className="cos-panel">
          <h2 className="cos-panel__title">Health Center</h2>
          <div className="cos-health-grid">
            {snapshot.healthDimensions.map((dim) => (
              <article key={dim.id} className={cn("cos-health-card", statusClass(dim.status))}>
                <strong>{dim.label}</strong>
                <span>{dim.score}%</span>
                {dim.href ? (
                  <Link href={dim.href} className="cos-link">
                    Open module
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "modules" ? (
        <section className="cos-panel">
          <h2 className="cos-panel__title">Root Modules ({COMMAND_OS_ROOT_MODULES.length})</h2>
          <div className="cos-grid">
            {COMMAND_OS_ROOT_MODULES.map((mod) => (
              <Link key={mod.id} href={mod.href} className="cos-module-card">
                <span className="cos-module-card__icon"><ModuleIcon href={mod.href} id={mod.id} /></span>
                <strong>{mod.label}</strong>
                <p>{mod.description}</p>
                <span className="cos-module-card__caps">{mod.capabilities.slice(0, 4).join(" · ")}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "search" ? (
        <section className="cos-panel">
          <h2 className="cos-panel__title">Global Search</h2>
          {searchResults.length === 0 ? (
            <p className="cos-note">Search modules, pages, assets, orders, configuration, and API routes.</p>
          ) : (
            <ul className="cos-search-list">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <Link href={result.href} className="cos-search-item">
                    <strong>{result.label}</strong>
                    <span>{result.category}</span>
                    {result.snippet ? <p>{result.snippet}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "operations" ? (
        <section className="cos-panel">
          <h2 className="cos-panel__title">One-Click Operations</h2>
          <div className="cos-ops-grid">
            {snapshot.oneClickOperations.map((op) => (
              <article key={op.id} className={cn("cos-op-card", `cos-op-card--${op.severity}`)}>
                <span>{op.icon}</span>
                <strong>{op.label}</strong>
                <p>{op.description}</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isPending}
                  onClick={() => runAction(op.action)}
                >
                  Run
                </Button>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </EnterpriseAdminShell>
  );
}
