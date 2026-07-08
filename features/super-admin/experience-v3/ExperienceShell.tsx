"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { cn } from "@/lib/cn";
import type { GlobalSearchResult, XosSnapshot } from "@/lib/design-studio-v1/types";
import { XOS_MODULES } from "@/lib/design-studio-v1/xos-registry";
import { ICON_STANDARD_RULES } from "@/lib/design-studio-v1/icon-standard";

export type ExperienceTab =
  | "overview"
  | "health"
  | "screens"
  | "navigation"
  | "features"
  | "analytics"
  | "guardian"
  | "modules"
  | "search"
  | "dependencies"
  | "icons"
  | "assets"
  | "audit"
  | "publish"
  | "responsive";

type ExperienceShellProps = {
  initialSnapshot: XosSnapshot;
  defaultTab?: string;
};

const STATE_TABS: Array<{ id: ExperienceTab; label: string }> = [
  { id: "overview", label: "Experience Center" },
  { id: "health", label: "Health Dashboard" },
  { id: "screens", label: "Screen Registry" },
  { id: "navigation", label: "Navigation" },
  { id: "features", label: "Feature Toggles" },
  { id: "analytics", label: "Experience Analytics" },
  { id: "guardian", label: "AI Guardian" },
  { id: "modules", label: "XOS Modules" },
  { id: "audit", label: "Audit Center" },
  { id: "publish", label: "Publish Center" },
];

const VALID = new Set<string>([
  ...STATE_TABS.map((t) => t.id),
  "search",
  "dependencies",
  "icons",
  "assets",
  "responsive",
]);

function resolveTab(value?: string): ExperienceTab {
  if (value === "icon-studio") return "icons";
  if (value === "brand-dna") return "guardian";
  if (value === "replace") return "icons";
  if (value && VALID.has(value)) return value as ExperienceTab;
  return "overview";
}

export function ExperienceShell({ initialSnapshot, defaultTab }: ExperienceShellProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab, setActiveTab] = useState<ExperienceTab>(resolveTab(defaultTab));
  const [searchQuery, setSearchQuery] = useState("logo");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>(snapshot.globalSearchIndex);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const findingCounts = useMemo(
    () => ({
      critical: snapshot.iconScan.findings.filter((f) => f.severity === "critical").length,
      warning: snapshot.iconScan.findings.filter((f) => f.severity === "warning").length,
      info: snapshot.iconScan.findings.filter((f) => f.severity === "info").length,
    }),
    [snapshot.iconScan],
  );
  const impact = useMemo(() => {
    const affectedSurfaces = snapshot.dependencyGraph.reduce((sum, node) => sum + node.dependents.length, 0);
    const totalImpact = snapshot.dependencyGraph.reduce((sum, node) => sum + node.impactScore, 0);
    return {
      totalImpact,
      affectedSurfaces,
      recommendation:
        affectedSurfaces > 10
          ? "High impact — review dependency graph before global replace"
          : "Low impact — safe for global replace via Publish Center",
    };
  }, [snapshot.dependencyGraph]);

  const runAction = useCallback(
    (action: "rescan" | "audit" | "guardian-fix" | "replace-global" | "publish" | "rollback", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/experience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, historyId }),
        });
        const data = (await response.json()) as { ok?: boolean; snapshot?: XosSnapshot; error?: string; experienceHealth?: XosSnapshot["experienceHealth"] };
        if (!response.ok) {
          setMessage(data.error ?? "Action failed.");
          return;
        }
        if (data.snapshot) setSnapshot(data.snapshot);
        else setSnapshot((prev) => ({ ...prev, ...(data as Partial<XosSnapshot>), scannedAt: new Date().toISOString() }));
        if (action === "publish") setMessage("Experience Operating System published.");
        if (action === "rollback") setMessage("Experience rolled back.");
        if (action === "audit") setMessage("Experience audit complete.");
        if (action === "rescan") setMessage(`Rescan complete — Overall Experience Score ${data.experienceHealth?.overallExperienceScore ?? snapshot.experienceHealth.overallExperienceScore}%`);
      });
    },
    [snapshot.experienceHealth.overallExperienceScore],
  );

  const runSearch = useCallback(() => {
    startTransition(async () => {
      const response = await fetch(`/api/super-admin/experience?search=${encodeURIComponent(searchQuery)}`);
      const data = (await response.json()) as { results?: GlobalSearchResult[] };
      setSearchResults(data.results ?? []);
    });
  }, [searchQuery]);

  return (
    <EnterpriseAdminShell
      moduleId="experience-os"
      eyebrow="Experience Operating System"
      title="ROVEXO XOS Enterprise v3.0"
      description="Master control center — no hardcoded UI, no duplicated components, single source of truth."
      enterpriseScore={snapshot.experienceHealth.overallExperienceScore}
      healthStatus={snapshot.experienceHealth.pass ? "healthy" : findingCounts.critical > 0 ? "critical" : "warning"}
      stateTabs={STATE_TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(resolveTab(tabId))}
      message={message}
      isPending={isPending}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => runAction("rescan")} disabled={isPending}>Rescan</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runAction("audit")} disabled={isPending}>Run Audit</Button>
          <Button type="button" size="sm" onClick={() => runAction("publish")} disabled={isPending}>Publish XOS</Button>
        </div>
      }
      quickLinks={[
        { label: "Visual CMS", href: "/super-admin/visual-cms" },
        { label: "Live Preview", href: "/super-admin/visual-cms?tab=preview" },
        { label: "Design Studio", href: "/super-admin/experience" },
      ]}
    >
      {activeTab === "overview" && (
        <div className="ds1-root">
          <section className="ds1-score-hero">
            <div>
              <p className="ds1-score-hero__eyebrow">Overall Experience Score</p>
              <p className="ds1-score-hero__value">{snapshot.experienceHealth.overallExperienceScore}%</p>
            </div>
            <dl className="ds1-score-grid">
              {snapshot.experienceHealth.dimensions.slice(0, 9).map((dim) => (
                <div key={dim.id}><dt>{dim.label}</dt><dd>{dim.score}%</dd></div>
              ))}
            </dl>
          </section>
          <section className="ds1-stats">
            <article className="ds1-stat"><strong>{XOS_MODULES.length}</strong><span>XOS Modules</span></article>
            <article className="ds1-stat"><strong>{snapshot.screens.length}</strong><span>Registered Screens</span></article>
            <article className="ds1-stat"><strong>{snapshot.navigation.length}</strong><span>Navigation Surfaces</span></article>
            <article className="ds1-stat"><strong>{snapshot.featureToggles.filter((f) => f.enabled).length}</strong><span>Active Features</span></article>
            <article className="ds1-stat"><strong>{snapshot.designScore.overall}%</strong><span>Design Score</span></article>
            <article className="ds1-stat"><strong>{snapshot.publishCenter.liveLabel}</strong><span>Live v{snapshot.visualBundle.version}</span></article>
          </section>
        </div>
      )}

      {activeTab === "health" && (
        <section className="ds1-panel">
          <header className="ds1-panel__header">
            <h3>Experience Health Dashboard</h3>
            <p>{snapshot.experienceGuardian.findings.length} guardian findings — {snapshot.assetScan.brokenReferences} broken assets</p>
          </header>
          <div className="ds1-audit-grid">
            {snapshot.experienceHealth.dimensions.map((dim) => (
              <article key={dim.id} className="ds1-audit-card ds1-audit-card--pass">
                <strong>{dim.label}</strong><span>{dim.score}%</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "screens" && (
        <section className="ds1-panel">
          <header className="ds1-panel__header"><h3>Screen Registry</h3><p>{snapshot.screens.length} screens auto-registered</p></header>
          <div className="ds1-screen-grid">
            {snapshot.screens.map((screen) => (
              <article key={screen.id} className="ds1-screen-card">
                <strong>{screen.label}</strong>
                <code>{screen.route}</code>
                <dl>
                  <div><dt>Design</dt><dd>{screen.designScore}%</dd></div>
                  <div><dt>A11y</dt><dd>{screen.accessibilityScore}%</dd></div>
                  <div><dt>Perf</dt><dd>{screen.performanceScore}%</dd></div>
                  <div><dt>Status</dt><dd>{screen.status}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "navigation" && (
        <section className="ds1-panel">
          <header className="ds1-panel__header"><h3>Navigation Manager</h3></header>
          <div className="ds1-nav-grid">
            {snapshot.navigation.map((surface) => (
              <article key={surface.id} className="ds1-nav-card">
                <div className="ds1-nav-card__head">
                  <strong>{surface.label}</strong>
                  <span>{surface.itemCount} items</span>
                </div>
                <ul>{surface.items.map((item) => (<li key={item.id}>{item.label} — {item.enabled ? "on" : "off"}</li>))}</ul>
                <Link href={surface.previewHref} className="ds1-module-card__link">Preview</Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "features" && (
        <section className="ds1-panel">
          <header className="ds1-panel__header"><h3>Feature Toggle Center</h3></header>
          <ul className="ds1-findings">
            {snapshot.featureToggles.map((toggle) => (
              <li key={toggle.id} className={cn("ds1-finding", toggle.enabled ? "ds1-finding--info" : "ds1-finding--warning")}>
                <p><strong>{toggle.label}</strong> — {toggle.state} — {toggle.scope}</p>
                <p>{toggle.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "analytics" && (
        <section className="ds1-panel">
          <header className="ds1-panel__header">
            <h3>Experience Analytics</h3>
            <p>{snapshot.experienceAnalytics.clicks.toLocaleString()} clicks — scroll depth {snapshot.experienceAnalytics.scrollDepth}%</p>
          </header>
          <div className="ds1-stats">
            <article className="ds1-stat"><strong>{snapshot.experienceAnalytics.deadClicks}</strong><span>Dead Clicks</span></article>
            <article className="ds1-stat"><strong>{snapshot.experienceAnalytics.rageClicks}</strong><span>Rage Clicks</span></article>
            <article className="ds1-stat"><strong>{snapshot.experienceAnalytics.searches.toLocaleString()}</strong><span>Searches</span></article>
          </div>
          <ul className="ds1-findings">
            {snapshot.experienceAnalytics.navigationPaths.map((path) => (
              <li key={path.path} className="ds1-finding ds1-finding--info">
                <p>{path.path} — {path.count} sessions — {path.conversionRate}% conversion</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "guardian" && (
        <div className="ds1-root">
          <section className="ds1-panel">
            <header className="ds1-panel__header"><h3>AI Experience Guardian</h3></header>
            <ul className="ds1-findings">
              {snapshot.experienceGuardian.recommendations.map((rec) => (
                <li key={rec} className="ds1-finding ds1-finding--info"><p>{rec}</p></li>
              ))}
            </ul>
            <div className="ds1-actions-row">
              <Button type="button" onClick={() => runAction("guardian-fix")} disabled={isPending}>One-Click Correction</Button>
            </div>
          </section>
          <section className="ds1-panel">
            <ul className="ds1-findings">
              {snapshot.experienceGuardian.findings.slice(0, 20).map((f) => (
                <li key={f.id} className={cn("ds1-finding", `ds1-finding--${f.severity}`)}>
                  <p>{f.message}</p><p className="ds1-finding__fix">{f.recommendedFix}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {activeTab === "modules" && (
        <section className="ds1-modules">
          {XOS_MODULES.map((module) => (
            <article key={module.id} className="ds1-module-card">
              <div className="ds1-module-card__head">
                <span className="ds1-module-card__order">{String(module.order).padStart(2, "0")}</span>
                <span className="ds1-module-card__icon" aria-hidden><ModuleIcon href={module.href} id={module.id} /></span>
                <div><h3 className="ds1-module-card__title">{module.label}</h3><p className="ds1-module-card__desc">{module.description}</p></div>
              </div>
              <Link href={module.href} className="ds1-module-card__link">Open {module.label}</Link>
            </article>
          ))}
        </section>
      )}

      {activeTab === "search" && (
        <section className="ds1-panel">
          <div className="ds1-search-bar">
            <input className="ds1-search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search component, page, widget, asset…" />
            <Button type="button" size="sm" onClick={runSearch} disabled={isPending}>Search</Button>
          </div>
          <ul className="ds1-findings">
            {searchResults.map((r, i) => (
              <li key={`${r.assetPath}-${i}`} className="ds1-finding">
                <p>{r.file ?? r.assetPath} — usage {r.usageCount} — deps {r.dependencyCount}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "dependencies" && (
        <section className="ds1-panel">
          <header className="ds1-panel__header"><h3>Dependency Graph</h3><p>{impact.recommendation}</p></header>
          <ol className="ds1-dep-chain">
            {snapshot.dependencyGraph.map((node) => (
              <li key={node.id}><strong>{node.label}</strong><span>impact {node.impactScore}%</span></li>
            ))}
          </ol>
        </section>
      )}

      {(activeTab === "icons" || activeTab === "assets") && (
        <div className="ds1-root">
          {activeTab === "icons" && (
            <section className="ds1-panel">
              <header className="ds1-panel__header"><h3>Icon Studio — Global Standard</h3></header>
              <div className="ds1-rules">{ICON_STANDARD_RULES.map((rule) => (<article key={rule.id} className="ds1-rule"><strong>{rule.title}</strong><p>{rule.description}</p></article>))}</div>
              <div className="ds1-actions-row"><Button type="button" onClick={() => runAction("replace-global")} disabled={isPending}>Replace Globally</Button></div>
            </section>
          )}
          {activeTab === "assets" && (
            <section className="ds1-panel">
              <header className="ds1-panel__header"><h3>Asset Scanner</h3><p>{snapshot.assetScan.brokenReferences} broken references</p></header>
              <ul className="ds1-findings">{snapshot.assetScan.findings.slice(0, 12).map((f) => (<li key={f.id} className="ds1-finding"><p>{f.message}</p></li>))}</ul>
            </section>
          )}
        </div>
      )}

      {activeTab === "responsive" && (
        <section className="ds1-panel">
          <header className="ds1-panel__header"><h3>Responsive Studio</h3></header>
          <div className="ds1-audit-grid">
            {snapshot.responsiveModes.map((mode) => (
              <article key={mode.id} className="ds1-audit-card ds1-audit-card--pass">
                <strong>{mode.label}</strong><span>{mode.width}×{mode.height}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "audit" && (
        <section className="ds1-panel">
          <div className="ds1-audit-grid">
            {snapshot.designAudit.sections.map((section) => (
              <article key={section.id} className={cn("ds1-audit-card", section.pass ? "ds1-audit-card--pass" : "ds1-audit-card--fail")}>
                <strong>{section.label}</strong><span>{section.score}%</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "publish" && (
        <div className="ds1-root">
          <section className="ds1-panel">
            <header className="ds1-panel__header">
              <h3>Publish Center</h3>
              <p>{snapshot.publishManifest.dependencyReport}</p>
            </header>
            <ul className="ds1-findings">{snapshot.publishManifest.visualChangelog.map((entry) => (<li key={entry} className="ds1-finding ds1-finding--info"><p>{entry}</p></li>))}</ul>
            <div className="ds1-actions-row"><Button type="button" onClick={() => runAction("publish")} disabled={isPending}>Publish Experience</Button></div>
          </section>
          <section className="ds1-panel">
            <ul className="ds1-version-list">
              {snapshot.versionControl.map((entry) => (
                <li key={entry.id} className="ds1-version-item">
                  <div><strong>{entry.label}</strong><span>v{entry.version}</span></div>
                  {entry.rollbackAvailable ? (<Button type="button" variant="secondary" size="sm" onClick={() => runAction("rollback", entry.id)} disabled={isPending}>Rollback</Button>) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </EnterpriseAdminShell>
  );
}
