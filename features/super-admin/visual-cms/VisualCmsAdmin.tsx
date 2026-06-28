"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { ResponsivePreviewFrame } from "@/features/super-admin/mission-control/ResponsivePreviewFrame";
import { VisualCanvas } from "@/features/super-admin/platform-visual/studio-pro/VisualCanvas";
import { useStudioHistory } from "@/features/super-admin/platform-visual/studio-pro/useStudioHistory";
import { cn } from "@/lib/cn";
import {
  createCanvasNodeFromComponent,
  duplicateCanvasNode,
  syncHomepageFromCanvas,
} from "@/lib/platform-visual/studio-pro/canvas";
import { STUDIO_ASSET_LIBRARY, searchStudioAssets } from "@/lib/platform-visual/studio-pro/assets";
import { STUDIO_COMPONENT_LIBRARY } from "@/lib/platform-visual/studio-pro/defaults";
import type { VisualCmsEngineSnapshot } from "@/lib/visual-cms-engine/types";
import { getPublishWorkflowStages } from "@/lib/visual-cms-engine/timeline";

export type VisualCmsTab =
  | "overview"
  | "builders"
  | "canvas"
  | "assets"
  | "theme"
  | "preview"
  | "history"
  | "publish";

type VisualCmsAdminProps = {
  initialSnapshot: VisualCmsEngineSnapshot;
  defaultTab?: VisualCmsTab;
};

const TABS: { id: VisualCmsTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "builders", label: "Builders" },
  { id: "canvas", label: "Canvas" },
  { id: "assets", label: "Assets" },
  { id: "theme", label: "Theme Manager" },
  { id: "preview", label: "Live Preview" },
  { id: "history", label: "History" },
  { id: "publish", label: "Publish" },
];

export function VisualCmsAdmin({ initialSnapshot, defaultTab = "overview" }: VisualCmsAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<VisualCmsTab>(defaultTab);
  const [assetQuery, setAssetQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const studioDocument = snapshot.visualBundle.studioPro;
  const { document: canvasDoc, canUndo, canRedo, commit, undo, redo } = useStudioHistory(studioDocument);

  const filteredAssets = useMemo(() => searchStudioAssets(assetQuery), [assetQuery]);
  const workflowStages = getPublishWorkflowStages();
  const enabledBuilders = useMemo(
    () =>
      snapshot.builders.filter((builder) =>
        draft.builders.find((item) => item.id === builder.id)?.enabled,
      ),
    [draft.builders, snapshot.builders],
  );

  const runCmsAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/visual-cms", {
          method: action === "save-draft" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: typeof draft;
          snapshot?: VisualCmsEngineSnapshot;
          error?: string;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Visual CMS action failed.");
          return;
        }
        if (data.draft) setDraft(data.draft);
        if (data.snapshot) setSnapshot(data.snapshot);
        setMessage("Visual CMS configuration saved.");
      });
    },
    [draft],
  );

  const runThemeAction = useCallback(
    (action: "publish-theme" | "rollback-theme", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const endpoint =
          action === "publish-theme" ? "/api/super-admin/publish-theme" : "/api/super-admin/rollback-theme";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ historyId }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: VisualCmsEngineSnapshot };
        if (!response.ok) {
          setMessage(data.error ?? "Theme action failed.");
          return;
        }
        if (data.snapshot) setSnapshot(data.snapshot);
        setMessage(action === "publish-theme" ? "Theme published live." : "Theme rolled back.");
      });
    },
    [],
  );

  const saveVisualDraft = useCallback(() => {
    startTransition(async () => {
      const homepageBuilder = syncHomepageFromCanvas(snapshot.visualBundle.homepageBuilder, canvasDoc.canvas.nodes);
      const bundle = {
        ...snapshot.visualBundle,
        homepageBuilder,
        studioPro: canvasDoc,
      };
      const response = await fetch("/api/super-admin/platform-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-draft", bundle }),
      });
      if (response.ok) setMessage("Visual draft saved.");
    });
  }, [canvasDoc, snapshot.visualBundle]);

  const addComponent = (componentId: string) => {
    const definition = STUDIO_COMPONENT_LIBRARY.find((item) => item.id === componentId);
    if (!definition) return;
    const node = createCanvasNodeFromComponent(definition, { x: 40, y: 40 }, canvasDoc.canvas.nodes.length);
    commit({
      ...canvasDoc,
      canvas: {
        ...canvasDoc.canvas,
        nodes: [...canvasDoc.canvas.nodes, node],
        selectedIds: [node.id],
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const duplicateSelected = () => {
    const selected = canvasDoc.canvas.nodes.find((node) => canvasDoc.canvas.selectedIds.includes(node.id));
    if (!selected) return;
    const duplicate = duplicateCanvasNode(selected, canvasDoc.canvas.nodes.length);
    commit({
      ...canvasDoc,
      canvas: { ...canvasDoc.canvas, nodes: [...canvasDoc.canvas.nodes, duplicate], selectedIds: [duplicate.id] },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <EnterpriseAdminShell
      moduleId="visual-cms"
      eyebrow="Enterprise Visual CMS"
      title="Live Platform Design System"
      description="Create, edit, preview, version, and publish every visual element — configuration-driven and fully reversible."
      enterpriseScore={snapshot.live.publishStage === "published" ? 95 : 88}
      stateTabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as VisualCmsTab)}
      isPending={isPending}
      message={message}
      aiInsight="OMEGA PRIME: Visual CMS is production ready for global enterprise audit."
      actions={
        <>
          <Button disabled={isPending} onClick={() => runCmsAction("save-draft")}>Save Draft</Button>
          <Button disabled={isPending} variant="primary" onClick={() => runThemeAction("publish-theme")}>Publish Theme</Button>
          <Button disabled={isPending} variant="secondary" onClick={saveVisualDraft}>Save Visual Draft</Button>
        </>
      }
      quickLinks={[{ label: "Theme Studio Pro", href: "/super-admin/theme-studio" }]}
    >
      {activeTab === "overview" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Enterprise Visual CMS</h3>
          <p className="vcms-panel__desc">
            Super Admin command center for visual configuration. All changes are audited, versioned, and rollback-ready.
          </p>
          <div className="vcms-workflow">
            {workflowStages.map((stage, index) => (
              <div key={stage} className={cn("vcms-workflow__step", draft.publishStage === stage && "vcms-workflow__step--active")}>
                <span>{index + 1}</span>
                {stage}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "builders" && (
        <div className="vcms-builder-grid">
          {enabledBuilders.map((builder) => (
            <Link key={builder.id} href={builder.href} className="ea-card">
              <span className="vcms-builder-card__icon">{builder.icon}</span>
              <span className="vcms-builder-card__title">{builder.label}</span>
              <span className="vcms-builder-card__desc">{builder.description}</span>
            </Link>
          ))}
        </div>
      )}

      {activeTab === "canvas" && (
        <div className="vcms-canvas-layout">
          <aside className="vcms-canvas-sidebar">
            <h3 className="ea-panel__title">Component Library</h3>
            <div className="ea-list">
              {STUDIO_COMPONENT_LIBRARY.slice(0, 12).map((component) => (
                <button key={component.id} type="button" className="ea-chip" onClick={() => addComponent(component.id)}>
                  {component.icon} {component.label}
                </button>
              ))}
            </div>
            <div className="ea-admin__actions">
              <Button variant="secondary" disabled={!canUndo} onClick={undo}>
                Undo
              </Button>
              <Button variant="secondary" disabled={!canRedo} onClick={redo}>
                Redo
              </Button>
              <Button variant="secondary" onClick={duplicateSelected}>
                Duplicate
              </Button>
            </div>
          </aside>
          <div className="vcms-canvas-main">
            <VisualCanvas
              canvas={canvasDoc.canvas}
              onChange={(canvas) =>
                commit({ ...canvasDoc, canvas, updatedAt: new Date().toISOString() })
              }
            />
          </div>
        </div>
      )}

      {activeTab === "assets" && (
        <div className="ea-panel">
          <input
            type="search"
            className="ea-input"
            placeholder="Search assets by name, folder, or tag…"
            value={assetQuery}
            onChange={(event) => setAssetQuery(event.target.value)}
          />
          <div className="vcms-asset-grid">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="ea-card">
                <div className="vcms-asset-card__preview">
                  <Image src={asset.src} alt={asset.name} width={120} height={80} className="vcms-asset-card__img" />
                </div>
                <strong>{asset.name}</strong>
                <span>{asset.folder} · {asset.format.toUpperCase()}</span>
                <span>{asset.tags.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "theme" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Theme Manager</h3>
          <p className="vcms-panel__desc">Active theme: {snapshot.live.activeThemeLabel}</p>
          <div className="vcms-token-grid">
            {Object.entries(snapshot.visualBundle.theme).map(([key, value]) => (
              <div key={key} className="ea-card">
                <span>{key}</span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="ea-panel">
          <ResponsivePreviewFrame src="/" title="Live marketplace preview" />
        </div>
      )}

      {activeTab === "history" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Theme History</h3>
          {snapshot.themeHistory.map((entry) => (
            <div key={entry.id} className="vcms-history-row">
              <div>
                <strong>{entry.label}</strong>
                <p>{new Date(entry.publishedAt).toLocaleString()}</p>
              </div>
              {entry.rollbackAvailable ? (
                <Button disabled={isPending} variant="secondary" onClick={() => runThemeAction("rollback-theme", entry.id)}>
                  Rollback
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {activeTab === "publish" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Live Publishing Workflow</h3>
          <div className="vcms-workflow vcms-workflow--vertical">
            {workflowStages.map((stage) => (
              <div key={stage} className={cn("vcms-workflow__step", draft.publishStage === stage && "vcms-workflow__step--active")}>
                {stage}
              </div>
            ))}
          </div>
          <div className="ea-admin__actions">
            <Button disabled={isPending} variant="primary" onClick={() => runThemeAction("publish-theme")}>
              Approve & Publish Live
            </Button>
            <Button disabled={isPending} variant="secondary" onClick={() => runCmsAction("reset-draft")}>
              Reset Draft
            </Button>
          </div>
        </div>
      )}
    </EnterpriseAdminShell>
  );
}
