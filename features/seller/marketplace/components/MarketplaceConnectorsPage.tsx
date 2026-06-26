"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { StickyPageHeader } from "@/components/ui/StickyPageHeader";
import { MarketplaceConnectorCard } from "@/features/seller/marketplace/components/MarketplaceConnectorCard";
import { useMarketplaceConnectors } from "@/features/seller/marketplace/hooks/use-marketplace-connectors";
import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { MarketplaceProviderView } from "@/lib/seller/marketplace/types";

const MarketplaceConnectorSettingsModal = dynamic(
  () =>
    import("@/features/seller/marketplace/components/MarketplaceConnectorSettingsModal").then(
      (mod) => mod.MarketplaceConnectorSettingsModal,
    ),
  { ssr: false },
);

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function ConnectorGridSkeleton() {
  return (
    <div className="grid gap-ds-3 sm:grid-cols-2" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-56 animate-pulse rounded-ds-lg bg-surface" />
      ))}
    </div>
  );
}

export function MarketplaceConnectorsPage() {
  const router = useRouter();
  const { summary, analytics, loading, error, reload, runAction, connectProvider } =
    useMarketplaceConnectors();
  const [settingsProvider, setSettingsProvider] = useState<MarketplaceProviderView | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleOpenSettings = useCallback((provider: MarketplaceProviderView) => {
    setSettingsProvider(provider);
    setSettingsOpen(true);
  }, []);

  const handleImport = useCallback(
    (provider: MarketplaceProviderView) => {
      router.push(`${MIGRATION_CENTER_PATH}?platform=${provider.id}`);
    },
    [router],
  );

  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
    setSettingsProvider(null);
  }, []);

  const sortedProviders = useMemo(() => {
    const providers = summary?.providers ?? [];
    return [...providers].sort((left, right) => {
      if (left.status === "connected" && right.status !== "connected") return -1;
      if (right.status === "connected" && left.status !== "connected") return 1;
      return left.name.localeCompare(right.name);
    });
  }, [summary?.providers]);

  return (
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto w-full max-w-4xl bg-white px-5 py-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <StickyPageHeader>
          <div className="flex items-center gap-ds-2">
            <IconButton
              label="Back to seller dashboard"
              onClick={() => router.push("/seller/dashboard")}
              className={focusRing}
            >
              <BackIcon className="h-5 w-5" />
            </IconButton>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-text-primary">Marketplace Connectors</h1>
              <p className="truncate text-xs text-text-secondary">Connect and manage import sources</p>
            </div>
          </div>
        </StickyPageHeader>

        <div className="mt-ds-4 flex flex-col gap-ds-4">
          {error ? (
            <Card padding="sm" className="border-error/30 bg-error/5" role="alert">
              <p className="text-sm text-error">{error}</p>
            </Card>
          ) : null}

          {summary ? (
            <Card padding="md" className="border-border bg-surface/50">
              <dl className="grid grid-cols-2 gap-ds-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-text-secondary">Providers</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-text-primary">{summary.totalProviders}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Connected</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-text-primary">{summary.connectedCount}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Healthy</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-success">{summary.healthyCount}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Imports</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-text-primary">{analytics?.imports ?? 0}</dd>
                </div>
              </dl>
            </Card>
          ) : null}

          {loading ? (
            <ConnectorGridSkeleton />
          ) : (
            <div className="grid gap-ds-3 sm:grid-cols-2">
              {sortedProviders.map((provider) => (
                <MarketplaceConnectorCard
                  key={provider.id}
                  provider={provider}
                  onOpenSettings={handleOpenSettings}
                  onImport={handleImport}
                />
              ))}
            </div>
          )}

          {!loading && sortedProviders.length === 0 ? (
            <Card padding="lg" className="text-center">
              <p className="text-sm text-text-secondary">No marketplace connectors are available yet.</p>
              <button
                type="button"
                onClick={() => void reload()}
                className={cn(
                  "mt-ds-3 text-sm font-medium text-primary underline",
                  focusRing,
                )}
              >
                Refresh
              </button>
            </Card>
          ) : null}
        </div>

        <MarketplaceConnectorSettingsModal
          key={settingsProvider?.id ?? "closed"}
          provider={settingsProvider}
          open={settingsOpen}
          onClose={handleCloseSettings}
          onConnect={connectProvider}
          onAction={runAction}
        />
      </main>
    </BetaAppShell>
  );
}
