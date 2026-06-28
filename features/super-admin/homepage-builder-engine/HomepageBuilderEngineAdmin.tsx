"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { HOMEPAGE_BUILDER_MODULE_DESCRIPTOR } from "@/lib/homepage-builder-engine/descriptor";
import {
  HOMEPAGE_BUILDER_API,
  HOMEPAGE_BUILDER_ROUTES,
  HOMEPAGE_PREVIEW_MODES,
  HOMEPAGE_SECTION_TYPES,
} from "@/lib/homepage-builder-engine/registry";
import type { HomepageBuilderSnapshot, HomepageBuilderTab, HomepagePreviewMode } from "@/lib/homepage-builder-engine/types";

type HomepageBuilderEngineAdminProps = {
  initialSnapshot: HomepageBuilderSnapshot;
  defaultTab?: HomepageBuilderTab;
};

export function HomepageBuilderEngineAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
}: HomepageBuilderEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [previewMode, setPreviewMode] = useState<HomepagePreviewMode>("desktop");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snapshot.draft.sections;
    return snapshot.draft.sections.filter(
      (s) => s.label.toLowerCase().includes(q) || s.type.includes(q),
    );
  }, [query, snapshot.draft.sections]);

  const refresh = useCallback(async () => {
    const response = await fetch(HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { homepageBuilder?: HomepageBuilderSnapshot };
    if (data.homepageBuilder) setSnapshot(data.homepageBuilder);
  }, []);

  const runAction = useCallback(
    (endpoint: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: HomepageBuilderSnapshot };
        setMessage(response.ok ? "Homepage action completed." : data.error ?? "Action failed.");
        if (data.snapshot) setSnapshot(data.snapshot);
        else await refresh();
      });
    },
    [refresh],
  );

  return (
    <div className="hpb-admin">
      <header className="hpb-admin__header">
        <div>
          <p className="hpb-admin__eyebrow">Visual CMS Pro v2</p>
          <h2 className="hpb-admin__title">Enterprise Homepage Builder</h2>
          <p className="hpb-admin__desc">
            Create, edit, publish, preview, and rollback every homepage section across the marketplace.
          </p>
        </div>
        <div className="hpb-admin__scores">
          <div className="hpb-score">
            <span>Production</span>
            <strong>{snapshot.dashboard.productionSections}</strong>
          </div>
          <div className="hpb-score hpb-score--health">
            <span>Health</span>
            <strong>{snapshot.health.score}%</strong>
          </div>
          <div className="hpb-score hpb-score--theme">
            <span>Theme</span>
            <strong>{snapshot.production.lastEditor ? "Live" : "—"}</strong>
          </div>
        </div>
      </header>

      <div className="hpb-admin__actions">
        <Button type="button" disabled={isPending} onClick={() => runAction(HOMEPAGE_BUILDER_API.publish)}>
          Publish
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction(HOMEPAGE_BUILDER_API.validate)}>
          Validate
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction(HOMEPAGE_BUILDER_API.export)}>
          Export
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => refresh()}>
          Refresh
        </Button>
        <Link href="/super-admin/assets" className="hpb-link">Asset Manager</Link>
        <Link href="/super-admin/visual-cms" className="hpb-link">Visual CMS</Link>
      </div>

      {message && <p className="hpb-admin__message">{message}</p>}
      {snapshot.pendingPublish && <p className="hpb-admin__banner">Pending publish — draft differs from production.</p>}

      <nav className="hpb-tabs" aria-label="Homepage builder sections">
        {HOMEPAGE_BUILDER_ROUTES.map((route) => (
          <Link key={route.id} href={route.href} className={cn("hpb-tab", activeTab === route.id && "hpb-tab--active")}>
            {route.label}
          </Link>
        ))}
      </nav>

      {activeTab === "dashboard" && (
        <div className="hpb-grid">
          <section className="hpb-panel">
            <h3>Homepage Overview</h3>
            <dl className="hpb-metrics">
              <div><dt>Production Sections</dt><dd>{snapshot.dashboard.productionSections}</dd></div>
              <div><dt>Draft Sections</dt><dd>{snapshot.dashboard.draftSections}</dd></div>
              <div><dt>Scheduled</dt><dd>{snapshot.dashboard.scheduledHomepages}</dd></div>
              <div><dt>Rollback Points</dt><dd>{snapshot.dashboard.rollbackPoints}</dd></div>
              <div><dt>Publishing Queue</dt><dd>{snapshot.dashboard.publishingQueue}</dd></div>
              <div><dt>Last Published</dt><dd>{snapshot.production.lastPublishedAt ? new Date(snapshot.production.lastPublishedAt).toLocaleString() : "—"}</dd></div>
              <div><dt>Last Editor</dt><dd>{snapshot.production.lastEditor ?? "—"}</dd></div>
              <div><dt>Active Theme</dt><dd>{snapshot.integrations.visualCms ? "ROVEXO Premium" : "Default"}</dd></div>
            </dl>
          </section>
          <section className="hpb-panel">
            <h3>Integrations</h3>
            <ul className="hpb-flag-list">
              <li><strong>Asset Manager</strong><span>{snapshot.integrations.assetManager ? "Connected" : "Off"}</span></li>
              <li><strong>Visual CMS</strong><span>{snapshot.integrations.visualCms ? "Connected" : "Off"}</span></li>
              <li><strong>Workflow Engine</strong><span>{snapshot.integrations.workflowEngine ? "Connected" : "Off"}</span></li>
            </ul>
          </section>
        </div>
      )}

      {(activeTab === "dashboard" || activeTab === "editor") && (
        <section className="hpb-panel hpb-panel--wide">
          <h3>Section Editor</h3>
          <input className="hpb-search" placeholder="Search sections..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul className="hpb-list">
            {filteredSections.slice(0, activeTab === "editor" ? 100 : 12).map((section) => (
              <li key={section.id} className="hpb-list__item">
                <div>
                  <strong>{section.label}</strong>
                  <span className={`hpb-badge ${section.published ? "hpb-badge--live" : "hpb-badge--draft"}`}>
                    {section.published ? "Published" : "Draft"}
                  </span>
                  {section.hidden && <span className="hpb-badge hpb-badge--hidden">Hidden</span>}
                  {section.locked && <span className="hpb-badge hpb-badge--locked">Locked</span>}
                  <small>{section.type} · order {section.order}</small>
                </div>
              </li>
            ))}
          </ul>
          <p className="hpb-subhead">Supported sections: {HOMEPAGE_SECTION_TYPES.length}</p>
        </section>
      )}

      {activeTab === "preview" && (
        <section className="hpb-panel hpb-panel--wide">
          <h3>Live Preview</h3>
          <div className="hpb-chip-grid">
            {HOMEPAGE_PREVIEW_MODES.map((mode) => (
              <button key={mode} type="button" className={cn("hpb-chip", previewMode === mode && "hpb-chip--active")} onClick={() => setPreviewMode(mode)}>
                {mode}
              </button>
            ))}
          </div>
          <div className="hpb-preview-frame" data-mode={previewMode}>
            <p>Preview mode: {previewMode}</p>
            <p>{filteredSections.filter((s) => !s.hidden).length} visible sections</p>
          </div>
        </section>
      )}

      {activeTab === "components" && (
        <section className="hpb-panel hpb-panel--wide">
          <h3>Component Library</h3>
          <ul className="hpb-list">
            {snapshot.componentLibrary.map((c) => (
              <li key={c.id} className="hpb-list__item">
                <strong>{c.label}</strong>
                <span>{c.type}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "history" && (
        <section className="hpb-panel hpb-panel--wide">
          <h3>History & Audit</h3>
          <ul className="hpb-list">
            {snapshot.history.map((v) => (
              <li key={v.id} className="hpb-list__item">
                <div>
                  <strong>v{v.version}</strong>
                  <p>{v.changeSummary}</p>
                  <small>{v.publishedBy} · {new Date(v.publishedAt).toLocaleString()}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "schedule" && (
        <section className="hpb-panel hpb-panel--wide">
          <h3>Scheduled Publishing</h3>
          {snapshot.schedules.length === 0 ? (
            <p className="hpb-subhead">No scheduled publishes.</p>
          ) : (
            <ul className="hpb-list">
              {snapshot.schedules.map((s) => (
                <li key={s.id} className="hpb-list__item">
                  <strong>{s.status}</strong>
                  <small>{new Date(s.publishAt).toLocaleString()} · {s.timezone}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {(activeTab === "dashboard" || activeTab === "settings") && snapshot.aiSuggestions.length > 0 && (
        <section className="hpb-panel hpb-panel--wide">
          <h3>Homepage AI Suggestions</h3>
          <ul className="hpb-list">
            {snapshot.aiSuggestions.map((s) => (
              <li key={s.id} className="hpb-list__item">
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.description}</p>
                  <small>{s.type} · {Math.round(s.confidence * 100)}% confidence</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "settings" && (
        <section className="hpb-panel">
          <h3>Feature Flags</h3>
          <ul className="hpb-flag-list">
            {Object.entries(snapshot.featureFlags).map(([id, enabled]) => (
              <li key={id}><strong>{id}</strong><span>{enabled ? "Enabled" : "Disabled"}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
