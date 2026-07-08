"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import type { AssetManagerEngineSnapshot } from "@/lib/asset-manager-engine/types";

export type AssetManagerTab =
  | "overview"
  | "library"
  | "usage"
  | "history"
  | "brand-kit"
  | "storage";

type AssetManagerAdminProps = {
  initialSnapshot: AssetManagerEngineSnapshot;
  defaultTab?: AssetManagerTab;
};

const TABS: { id: AssetManagerTab; label: string; href?: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "library", label: "Library", href: "/super-admin/assets/library" },
  { id: "usage", label: "Usage Map", href: "/super-admin/assets/usage" },
  { id: "history", label: "History", href: "/super-admin/assets/history" },
  { id: "brand-kit", label: "Brand Kit", href: "/super-admin/assets/brand-kit" },
  { id: "storage", label: "Storage", href: "/super-admin/assets/storage" },
];

export function AssetManagerAdmin({ initialSnapshot, defaultTab = "overview" }: AssetManagerAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<AssetManagerTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return snapshot.assets.filter((asset) => {
      if (fileType !== "all" && asset.format !== fileType) return false;
      if (!normalized) return true;
      return `${asset.name} ${asset.tags.join(" ")} ${asset.folder}`.toLowerCase().includes(normalized);
    });
  }, [fileType, query, snapshot.assets]);

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/assets", {
          method: action === "save-draft" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: typeof draft;
          snapshot?: AssetManagerEngineSnapshot;
          error?: string;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Asset Manager action failed.");
          return;
        }
        if (data.draft) setDraft(data.draft);
        if (data.snapshot) setSnapshot(data.snapshot);
        setMessage(action === "publish" ? "Asset configuration published." : "Draft saved.");
      });
    },
    [draft],
  );

  const runAssetAction = useCallback((action: "publish" | "rollback", historyId?: string) => {
    startTransition(async () => {
      const endpoint =
        action === "publish" ? "/api/super-admin/assets/publish" : "/api/super-admin/assets/rollback";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyId }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: AssetManagerEngineSnapshot };
      if (!response.ok) {
        setMessage(data.error ?? "Asset action failed.");
        return;
      }
      if (data.snapshot) setSnapshot(data.snapshot);
      setMessage(action === "publish" ? "Assets published." : "Assets rolled back.");
    });
  }, []);

  return (
    <EnterpriseAdminShell
      moduleId="asset-manager"
      eyebrow="Enterprise Asset Manager"
      title="Digital Asset Operating System"
      description="Single source of truth for logos, photography, icons, videos, fonts, and brand assets across ROVEXO."
      enterpriseScore={100}
      stateTabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as AssetManagerTab)}
      isPending={isPending}
      message={message}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search by name, tag, folder…"
      aiInsight="OMEGA PRIME: Asset Manager is production ready for global enterprise audit."
      actions={
        <>
          <Button disabled={isPending} onClick={() => runAction("save-draft")}>Save Draft</Button>
          <Button disabled={isPending} variant="primary" onClick={() => runAssetAction("publish")}>Publish Assets</Button>
          <Button disabled={isPending} variant="secondary" onClick={() => runAction("reset-draft")}>Reset Draft</Button>
        </>
      }
      quickLinks={[{ label: "Visual CMS", href: "/super-admin/visual-cms" }]}
    >
      {activeTab === "overview" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Asset Libraries</h3>
          <div className="am-library-grid">
            {snapshot.libraries.slice(0, 12).map((library) => (
              <div key={library.id} className="ea-card">
                <span>{library.icon}</span>
                <strong>{library.label}</strong>
                <span>{library.formats.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === "library" || activeTab === "overview") && (
        <div className="ea-panel">
          <div className="am-panel__toolbar">
            <input
              type="search"
              className="ea-input"
              placeholder="Search by name, tag, folder…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select className="am-select" value={fileType} onChange={(event) => setFileType(event.target.value)}>
              <option value="all">All formats</option>
              <option value="webp">WEBP</option>
              <option value="avif">AVIF</option>
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
            </select>
          </div>
          <div className="am-asset-grid">
            {filteredAssets.slice(0, 24).map((asset) => (
              <div key={asset.id} className="ea-card">
                <div className="am-asset-card__preview">
                  {asset.src.startsWith("/") ? (
                    <SafeImage src={asset.src} alt={asset.name} width={120} height={80} className="am-asset-card__img" />
                  ) : (
                    <span>{asset.format.toUpperCase()}</span>
                  )}
                </div>
                <strong>{asset.name}</strong>
                <span>{asset.libraryId} · {asset.status}</span>
                <span>{asset.tags.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "usage" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Asset Usage Map</h3>
          {snapshot.usage.map((entry) => {
            const asset = snapshot.assets.find((item) => item.id === entry.assetId);
            return (
              <div key={`${entry.assetId}-${entry.module}`} className="am-usage-row">
                <strong>{asset?.name ?? entry.assetId}</strong>
                <span>{entry.location}</span>
                <span>{entry.module}</span>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "history" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Version History</h3>
          {snapshot.history.map((entry) => (
            <div key={entry.id} className="am-history-row">
              <div>
                <strong>{entry.label}</strong>
                <p>{new Date(entry.publishedAt).toLocaleString()}</p>
              </div>
              {entry.rollbackAvailable ? (
                <Button disabled={isPending} variant="secondary" onClick={() => runAssetAction("rollback", entry.id)}>
                  Rollback
                </Button>
              ) : null}
            </div>
          ))}
          {snapshot.history.length === 0 ? (
            <p className="am-panel__desc">No publish history yet. Publish asset configuration to create history entries.</p>
          ) : null}
        </div>
      )}

      {activeTab === "brand-kit" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Brand Kit</h3>
          <div className="am-brand-grid">
            {Object.entries(draft.brandKit).map(([key, value]) => (
              <div key={key} className="ea-card">
                <span>{key}</span>
                <strong>{Array.isArray(value) ? value.join(", ") : String(value ?? "—")}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "storage" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Storage Center</h3>
          <div className="am-storage-grid">
            <div className="ea-card"><span>Total Assets</span><strong>{snapshot.storage.totalAssets}</strong></div>
            <div className="ea-card"><span>Used Bytes</span><strong>{snapshot.storage.storageUsedBytes}</strong></div>
            <div className="ea-card"><span>Free Space</span><strong>{snapshot.storage.freeSpaceBytes}</strong></div>
            <div className="ea-card"><span>Compression Ratio</span><strong>{snapshot.storage.compressionRatio}</strong></div>
            <div className="ea-card"><span>Optimization Savings</span><strong>{snapshot.storage.optimizationSavingsBytes}</strong></div>
            <div className="ea-card"><span>Duplicates</span><strong>{snapshot.storage.duplicateAssets.length}</strong></div>
          </div>
          <h4 className="am-panel__subtitle">Validation Issues</h4>
          {snapshot.validation.slice(0, 10).map((issue) => (
            <div key={issue.id} className="am-validation-row">
              <strong>{issue.type}</strong>
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}
    </EnterpriseAdminShell>
  );
}
