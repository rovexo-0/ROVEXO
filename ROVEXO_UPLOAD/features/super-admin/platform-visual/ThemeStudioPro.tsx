"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ResponsivePreviewFrame } from "@/features/super-admin/mission-control/ResponsivePreviewFrame";
import { MenuBuilderPanel } from "@/features/super-admin/platform-visual/MenuBuilderPanel";
import { VisualCanvas } from "@/features/super-admin/platform-visual/studio-pro/VisualCanvas";
import { useStudioHistory } from "@/features/super-admin/platform-visual/studio-pro/useStudioHistory";
import { cn } from "@/lib/cn";
import {
  applyNodeStylePatch,
  createVisualHistoryEntry,
  duplicateCanvasNode,
  syncHomepageFromCanvas,
  appendVisualHistory,
  deleteCanvasNodes,
  reorderLayers,
  createCanvasNodeFromComponent,
} from "@/lib/platform-visual/studio-pro/canvas";
import {
  STUDIO_ASSET_LIBRARY,
  searchStudioAssets,
} from "@/lib/platform-visual/studio-pro/assets";
import {
  STUDIO_COMPONENT_LIBRARY,
  STUDIO_TEMPLATE_LIBRARY,
} from "@/lib/platform-visual/studio-pro/defaults";
import { STUDIO_MODULE_REGISTRY } from "@/lib/platform-visual/studio-pro/registry";
import { STUDIO_VIEWPORT_PRESETS } from "@/lib/platform-visual/studio-pro/types";
import type { PlatformVisualBundle, PlatformVisualHistoryEntry } from "@/lib/platform-visual/types";
import type { CanvasNode, StudioBreakpoint, ThemeStudioProDocument } from "@/lib/platform-visual/studio-pro/types";

type ThemeStudioProProps = {
  initialDraft: PlatformVisualBundle;
  initialHistory: PlatformVisualHistoryEntry[];
};

type StudioTab = "canvas" | "homepage" | "menus" | "libraries" | "history";

export function ThemeStudioPro({ initialDraft, initialHistory }: ThemeStudioProProps) {
  const initialDocument = initialDraft.studioPro;
  const { document: studioDocument, canUndo, canRedo, commit, replace, undo, redo } = useStudioHistory(initialDocument);
  const [draft, setDraft] = useState(initialDraft);
  const [history, setHistory] = useState(initialHistory);
  const [activeTab, setActiveTab] = useState<StudioTab>("canvas");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedNode = useMemo(
    () => studioDocument.canvas.nodes.find((node) => studioDocument.canvas.selectedIds.includes(node.id)) ?? null,
    [studioDocument.canvas.nodes, studioDocument.canvas.selectedIds],
  );

  const filteredAssets = useMemo(() => searchStudioAssets(libraryQuery), [libraryQuery]);

  const pushDocument = useCallback(
    (nextDocument: ThemeStudioProDocument, action: string, component = "canvas") => {
      const entry = createVisualHistoryEntry({
        administrator: "Super Admin",
        component,
        action,
        newValue: { timestamp: nextDocument.updatedAt },
      });
      commit({
        ...nextDocument,
        visualHistory: appendVisualHistory(nextDocument.visualHistory, entry),
        updatedAt: new Date().toISOString(),
      });
    },
    [commit],
  );

  const syncDraftBundle = useCallback(
    (nextDocument: ThemeStudioProDocument) => {
      const homepageBuilder = syncHomepageFromCanvas(draft.homepageBuilder, nextDocument.canvas.nodes);
      setDraft((current) => ({
        ...current,
        homepageBuilder,
        theme: {
          ...current.theme,
          primary: nextDocument.designTokens.primary,
          background: nextDocument.designTokens.background,
          radius: nextDocument.designTokens.radius,
          fontScale: nextDocument.designTokens.fontScale,
          shadow: nextDocument.designTokens.shadow,
        },
        studioPro: nextDocument,
        updatedAt: new Date().toISOString(),
      }));
    },
    [draft.homepageBuilder],
  );

  const handleCanvasChange = useCallback(
    (canvas: ThemeStudioProDocument["canvas"]) => {
      const next = { ...studioDocument, canvas, updatedAt: new Date().toISOString() };
      pushDocument(next, "move");
      syncDraftBundle(next);
    },
    [studioDocument, pushDocument, syncDraftBundle],
  );

  const addComponent = useCallback(
    (componentId: string) => {
      const definition = STUDIO_COMPONENT_LIBRARY.find((item) => item.id === componentId);
      if (!definition) return;
      const node = createCanvasNodeFromComponent(definition, { x: 80, y: 80 + studioDocument.canvas.nodes.length * 24 }, studioDocument.canvas.nodes.length);
      const next = {
        ...studioDocument,
        canvas: { ...studioDocument.canvas, nodes: [...studioDocument.canvas.nodes, node], selectedIds: [node.id] },
      };
      pushDocument(next, "add-component", componentId);
      syncDraftBundle(next);
    },
    [studioDocument, pushDocument, syncDraftBundle],
  );

  const runBundleAction = useCallback(
    (action: "save-draft" | "publish" | "duplicate" | "reset-draft" | "export" | "import") => {
      startTransition(async () => {
        setMessage(null);
        const bundle = { ...draft, studioPro: studioDocument };
        const response = await fetch("/api/super-admin/platform-visual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, bundle }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: PlatformVisualBundle;
          history?: PlatformVisualHistoryEntry[];
          bundle?: PlatformVisualBundle;
          error?: string;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Theme Studio action failed.");
          return;
        }
        if (data.draft) {
          setDraft(data.draft);
          replace(data.draft.studioPro);
        }
        if (data.history) setHistory(data.history);
        if (action === "export" && data.bundle) {
          const blob = new Blob([JSON.stringify(data.bundle, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const anchor = window.document.createElement("a");
          anchor.href = url;
          anchor.download = `rovexo-theme-pro-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(
          action === "publish"
            ? "Theme Studio Pro published to the live marketplace."
            : action === "save-draft"
              ? "Draft saved."
              : action === "reset-draft"
                ? "Draft reset from live."
                : action === "duplicate"
                  ? "Theme duplicated."
                  : "Action complete.",
        );
      });
    },
    [studioDocument, draft, replace],
  );

  const quickAction = useCallback(
    (action: "duplicate" | "delete" | "lock" | "unlock" | "hide" | "show" | "publish-section" | "archive-section") => {
      if (!selectedNode && action !== "delete") return;
      let next = studioDocument;

      if (action === "duplicate" && selectedNode) {
        const duplicate = duplicateCanvasNode(selectedNode, studioDocument.canvas.nodes.length);
        next = {
          ...studioDocument,
          canvas: {
            ...studioDocument.canvas,
            nodes: [...studioDocument.canvas.nodes, duplicate],
            selectedIds: [duplicate.id],
          },
        };
      } else if (action === "delete") {
        next = { ...studioDocument, canvas: deleteCanvasNodes(studioDocument.canvas, studioDocument.canvas.selectedIds) };
      } else if (selectedNode) {
        const patch: Partial<CanvasNode> =
          action === "lock"
            ? { locked: true }
            : action === "unlock"
              ? { locked: false }
              : action === "hide"
                ? { hidden: true }
                : action === "show"
                  ? { hidden: false }
                  : action === "publish-section"
                    ? { published: true }
                    : action === "archive-section"
                      ? { archived: true, published: false }
                      : {};
        next = {
          ...studioDocument,
          canvas: {
            ...studioDocument.canvas,
            nodes: studioDocument.canvas.nodes.map((node) =>
              node.id === selectedNode.id ? { ...node, ...patch } : node,
            ),
          },
        };
      }

      pushDocument(next, action, selectedNode?.label ?? "selection");
      syncDraftBundle(next);
    },
    [studioDocument, pushDocument, selectedNode, syncDraftBundle],
  );

  const updateSelectedStyle = useCallback(
    (patch: Parameters<typeof applyNodeStylePatch>[1]) => {
      if (!selectedNode) return;
      const updated = applyNodeStylePatch(selectedNode, patch);
      const next = {
        ...studioDocument,
        canvas: {
          ...studioDocument.canvas,
          nodes: studioDocument.canvas.nodes.map((node) => (node.id === updated.id ? updated : node)),
        },
      };
      pushDocument(next, "pixel-edit", selectedNode.label);
      syncDraftBundle(next);
    },
    [studioDocument, pushDocument, selectedNode, syncDraftBundle],
  );

  const setBreakpoint = (breakpoint: StudioBreakpoint) => {
    const next = { ...studioDocument, activeBreakpoint: breakpoint };
    pushDocument(next, "breakpoint-change");
  };

  return (
    <div className="tsp-shell">
      <div className="tsp-shell__header">
        <div>
          <p className="tsp-shell__eyebrow">Theme Studio Pro</p>
          <p className="mc-manager__hint">
            Visual platform designer · Preview{" "}
            <Link href="/?visualPreview=draft" className="mc-section__link" target="_blank">
              /?visualPreview=draft
            </Link>
          </p>
        </div>
        <div className="mc-dev-tools__actions">
          <Button size="sm" variant="secondary" disabled={!canUndo || isPending} onClick={undo}>
            Undo
          </Button>
          <Button size="sm" variant="secondary" disabled={!canRedo || isPending} onClick={redo}>
            Redo
          </Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runBundleAction("reset-draft")}>
            Reset
          </Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runBundleAction("export")}>
            Export
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => runBundleAction("save-draft")}>
            Save Draft
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => runBundleAction("publish")}>
            Publish Live
          </Button>
        </div>
      </div>
      {message ? <p className="mc-manager__message">{message}</p> : null}

      <div className="tsp-shell__tabs">
        {(
          [
            ["canvas", "Visual Canvas"],
            ["homepage", "Homepage Designer"],
            ["menus", "Menu Designer"],
            ["libraries", "Libraries"],
            ["history", "Visual History"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn("tsp-shell__tab", activeTab === id && "tsp-shell__tab--active")}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tsp-shell__viewport-bar">
        {STUDIO_VIEWPORT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={cn("mc-preview__device", studioDocument.activeBreakpoint === preset.id && "mc-preview__device--active")}
            onClick={() => setBreakpoint(preset.id)}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          className={cn("mc-preview__device", studioDocument.orientation === "landscape" && "mc-preview__device--active")}
          onClick={() => pushDocument({ ...studioDocument, orientation: studioDocument.orientation === "landscape" ? "portrait" : "landscape" }, "orientation-toggle")}
        >
          {studioDocument.orientation === "landscape" ? "Landscape" : "Portrait"}
        </button>
      </div>

      {activeTab === "canvas" ? (
        <div className="tsp-workspace">
          <aside className="tsp-panel">
            <h3 className="tsp-panel__title">Component Library</h3>
            <div className="tsp-panel__list">
              {STUDIO_COMPONENT_LIBRARY.map((component) => (
                <button key={component.id} type="button" className="tsp-library-item" onClick={() => addComponent(component.id)}>
                  <span aria-hidden>{component.icon}</span>
                  <span>{component.label}</span>
                </button>
              ))}
            </div>
            <h3 className="tsp-panel__title">Registered Modules</h3>
            <div className="tsp-panel__modules">
              {STUDIO_MODULE_REGISTRY.map((module) => (
                <div key={module.id} className="tsp-module-chip">
                  <span>{module.icon}</span>
                  <span>{module.label}</span>
                </div>
              ))}
            </div>
          </aside>

          <main className="tsp-workspace__canvas">
            <VisualCanvas canvas={studioDocument.canvas} onChange={handleCanvasChange} />
          </main>

          <aside className="tsp-panel">
            <h3 className="tsp-panel__title">Pixel Editor</h3>
            {selectedNode ? (
              <div className="mc-pixel-editor">
                {(
                  [
                    ["width", "Width", 80, 1200],
                    ["height", "Height", 40, 800],
                    ["padding", "Padding", 0, 64],
                    ["margin", "Margin", 0, 64],
                    ["gap", "Gap", 0, 48],
                    ["borderRadius", "Radius", 0, 48],
                    ["opacity", "Opacity", 0.2, 1],
                    ["rotation", "Rotation", 0, 360],
                    ["fontSize", "Font Size", 10, 48],
                    ["iconSize", "Icon Size", 16, 128],
                  ] as const
                ).map(([key, label, min, max]) => (
                  <label key={key} className="mc-pixel-editor__field">
                    <span>{label}</span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={key === "opacity" ? 0.05 : 1}
                      value={Number(
                        key === "rotation"
                          ? selectedNode.rotation
                          : selectedNode.style[key] ?? selectedNode.width,
                      )}
                      onChange={(event) =>
                        updateSelectedStyle({ [key]: Number(event.target.value) } as Parameters<typeof updateSelectedStyle>[0])
                      }
                    />
                  </label>
                ))}
              </div>
            ) : (
              <p className="mc-section__desc">Select a canvas object to edit pixels.</p>
            )}

            <h3 className="tsp-panel__title">Quick Actions</h3>
            <div className="tsp-quick-actions">
              <Button size="sm" variant="secondary" onClick={() => quickAction("duplicate")}>Duplicate</Button>
              <Button size="sm" variant="secondary" onClick={() => quickAction("hide")}>Hide</Button>
              <Button size="sm" variant="secondary" onClick={() => quickAction("show")}>Show</Button>
              <Button size="sm" variant="secondary" onClick={() => quickAction("lock")}>Lock</Button>
              <Button size="sm" variant="secondary" onClick={() => quickAction("unlock")}>Unlock</Button>
              <Button size="sm" variant="secondary" onClick={() => quickAction("publish-section")}>Publish</Button>
              <Button size="sm" variant="secondary" onClick={() => quickAction("archive-section")}>Archive</Button>
              <Button size="sm" variant="secondary" onClick={() => quickAction("delete")}>Delete</Button>
            </div>

            <h3 className="tsp-panel__title">Layers</h3>
            <div className="tsp-layer-list">
              {[...studioDocument.canvas.nodes]
                .sort((a, b) => b.layer - a.layer)
                .map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className={cn("tsp-layer-item", studioDocument.canvas.selectedIds.includes(node.id) && "tsp-layer-item--active")}
                    onClick={() => handleCanvasChange({ ...studioDocument.canvas, selectedIds: [node.id] })}
                  >
                    <span>{node.label}</span>
                    <span className="tsp-layer-item__actions">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          const next = {
                            ...studioDocument,
                            canvas: { ...studioDocument.canvas, nodes: reorderLayers(studioDocument.canvas.nodes, node.id, "up") },
                          };
                          pushDocument(next, "layer-up", node.label);
                          syncDraftBundle(next);
                        }}
                      >
                        ↑
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          const next = {
                            ...studioDocument,
                            canvas: { ...studioDocument.canvas, nodes: reorderLayers(studioDocument.canvas.nodes, node.id, "down") },
                          };
                          pushDocument(next, "layer-down", node.label);
                          syncDraftBundle(next);
                        }}
                      >
                        ↓
                      </span>
                    </span>
                  </button>
                ))}
            </div>
          </aside>
        </div>
      ) : null}

      {activeTab === "homepage" ? (
        <div className="tsp-homepage-grid">
          <section className="rx-surface-card rounded-ds-xl p-ds-5">
            <h2 className="mc-section__title">Homepage sections</h2>
            <p className="mc-section__desc">Canvas and homepage builder stay in sync. Publish from the toolbar to go live.</p>
            <div className="tsp-homepage-list">
              {draft.homepageBuilder.components
                .filter((component) => !["header", "search", "footer", "bottom-navigation"].includes(component.id))
                .sort((a, b) => a.order - b.order)
                .map((component) => (
                  <div key={component.id} className="tsp-homepage-row">
                    <span>{component.label}</span>
                    <span className={cn("mc-builder__pill", component.published ? "mc-builder__pill--live" : "mc-builder__pill--draft")}>
                      {component.published ? "Published" : "Draft"}
                    </span>
                  </div>
                ))}
            </div>
          </section>
          <ResponsivePreviewFrame src="/?visualPreview=draft" title="Homepage live preview" />
        </div>
      ) : null}

      {activeTab === "menus" ? <MenuBuilderPanel initialMenus={draft.menus} /> : null}

      {activeTab === "libraries" ? (
        <div className="tsp-libraries">
          <section className="rx-surface-card rounded-ds-xl p-ds-5">
            <h2 className="mc-section__title">Template Library</h2>
            <div className="tsp-template-grid">
              {STUDIO_TEMPLATE_LIBRARY.map((template) => (
                <div key={template.id} className="tsp-template-card">
                  <span className="tsp-template-card__icon">{template.icon}</span>
                  <p className="font-semibold">{template.label}</p>
                  <p className="text-sm text-text-secondary">{template.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rx-surface-card rounded-ds-xl p-ds-5">
            <h2 className="mc-section__title">Asset Library</h2>
            <input
              className="mc-manager__input"
              placeholder="Search assets, folders, tags..."
              value={libraryQuery}
              onChange={(event) => setLibraryQuery(event.target.value)}
            />
            <div className="tsp-asset-grid">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="tsp-asset-card">
                  <div className="tsp-asset-card__preview">
                    <Image src={asset.src} alt={asset.name} width={120} height={80} className="object-cover" />
                  </div>
                  <p className="font-semibold">{asset.name}</p>
                  <p className="text-xs text-text-secondary">{asset.folder} · {asset.format.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rx-surface-card rounded-ds-xl p-ds-5">
            <h2 className="mc-section__title">Theme Library</h2>
            <div className="mc-theme-studio__history">
              {studioDocument.themeLibrary.map((theme) => (
                <div key={theme.id} className="mc-theme-studio__history-row">
                  <div>
                    <p className="font-semibold">{theme.name}</p>
                    <p className="text-sm text-text-secondary">{theme.status} · v{theme.version}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rx-surface-card rounded-ds-xl p-ds-5">
            <h2 className="mc-section__title">Component Marketplace</h2>
            <p className="mc-section__desc">Save, reuse, share, and archive premium components.</p>
            {studioDocument.componentMarketplace.length === 0 ? (
              <p className="text-sm text-text-secondary">No shared components yet. Duplicate a canvas object to add one.</p>
            ) : null}
          </section>
        </div>
      ) : null}

      {activeTab === "history" ? (
        <section className="rx-surface-card rounded-ds-xl p-ds-5">
          <h2 className="mc-section__title">Visual history</h2>
          <div className="mc-theme-studio__history">
            {studioDocument.visualHistory.length === 0 && history.length === 0 ? (
              <p className="mc-section__desc">Edits will appear here with rollback support.</p>
            ) : null}
            {studioDocument.visualHistory.map((entry) => (
              <div key={entry.id} className="mc-theme-studio__history-row">
                <div>
                  <p className="font-semibold">{entry.component} · {entry.action}</p>
                  <p className="text-sm text-text-secondary">
                    {entry.administrator} · {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {history.map((entry) => (
              <div key={entry.id} className="mc-theme-studio__history-row">
                <div>
                  <p className="font-semibold">Published theme · {entry.label}</p>
                  <p className="text-sm text-text-secondary">{new Date(entry.publishedAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="tsp-shell__preview">
        <ResponsivePreviewFrame src="/?visualPreview=draft" title="Responsive live preview" />
      </section>
    </div>
  );
}

