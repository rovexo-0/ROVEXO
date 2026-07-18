"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { useMarketplaceConnectors } from "@/features/seller/marketplace/hooks/use-marketplace-connectors";
import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import type { MarketplaceProviderView } from "@/lib/seller/marketplace/types";

const MarketplaceConnectorSettingsModal = dynamic(
  () =>
    import("@/features/seller/marketplace/components/MarketplaceConnectorSettingsModal").then(
      (mod) => mod.MarketplaceConnectorSettingsModal,
    ),
  { ssr: false },
);

function formatStatus(status: MarketplaceProviderView["status"]): string {
  return status.replace(/_/g, " ");
}

function formatHealth(status: MarketplaceProviderView["healthStatus"]): string {
  return status.replace(/_/g, " ");
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
    <AccountCanonicalShell
      title="Connectors"
      backHref="/seller"
      backLabel="Selling"
      showHeaderTitle
      showBottomNav={false}
      intro="Import sources."
    >
      <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5">
        {error ? (
          <p className="cds-field__error" role="alert">
            {error}
          </p>
        ) : null}

        {summary ? (
          <CanonicalSection title="Summary">
            <CanonicalCard variant="list">
              <CanonicalMenuRow title="Providers" value={String(summary.totalProviders)} showChevron={false} />
              <CanonicalMenuRow title="Connected" value={String(summary.connectedCount)} showChevron={false} />
              <CanonicalMenuRow title="Healthy" value={String(summary.healthyCount)} showChevron={false} />
              <CanonicalMenuRow title="Imports" value={String(analytics?.imports ?? 0)} showChevron={false} />
            </CanonicalCard>
          </CanonicalSection>
        ) : null}

        <CanonicalSection title="Connectors">
          <CanonicalCard variant="list">
            {loading ? (
              <CanonicalMenuRow title="Loading connectors…" showChevron={false} disabled />
            ) : sortedProviders.length ? (
              sortedProviders.map((provider) => (
                <CanonicalMenuRow
                  key={provider.id}
                  title={provider.name}
                  description={formatHealth(provider.healthStatus)}
                  value={formatStatus(provider.status)}
                  icon={
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-md bg-surface text-lg" aria-hidden>
                      {provider.logo}
                    </span>
                  }
                  onClick={() => handleImport(provider)}
                  showChevron={false}
                  trailing={
                    <CanonicalButton
                      variant="secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenSettings(provider);
                      }}
                    >
                      Settings
                    </CanonicalButton>
                  }
                />
              ))
            ) : (
              <CanonicalMenuRow title="No connectors yet" showChevron={false} disabled />
            )}
          </CanonicalCard>
        </CanonicalSection>

        {!loading && sortedProviders.length === 0 ? (
          <CanonicalInfoBlock variant="description">
            <p className="font-medium text-text-primary">No marketplace connectors</p>
            <CanonicalButton variant="secondary" className="mt-ds-3" onClick={() => void reload()}>
              Refresh
            </CanonicalButton>
          </CanonicalInfoBlock>
        ) : null}

        <MarketplaceConnectorSettingsModal
          key={settingsProvider?.id ?? "closed"}
          provider={settingsProvider}
          open={settingsOpen}
          onClose={handleCloseSettings}
          onConnect={connectProvider}
          onAction={runAction}
        />
      </div>
    </AccountCanonicalShell>
  );
}
