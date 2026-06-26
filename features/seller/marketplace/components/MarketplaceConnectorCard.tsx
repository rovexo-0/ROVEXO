"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MarketplaceProviderView } from "@/lib/seller/marketplace/types";

type MarketplaceConnectorCardProps = {
  provider: MarketplaceProviderView;
  onOpenSettings: (provider: MarketplaceProviderView) => void;
  onImport: (provider: MarketplaceProviderView) => void;
};

function healthLabel(status: MarketplaceProviderView["healthStatus"]): string {
  return status.replace(/_/g, " ");
}

function syncLabel(status: MarketplaceProviderView["syncStatus"]): string {
  return status.replace(/_/g, " ");
}

export function MarketplaceConnectorCard({
  provider,
  onOpenSettings,
  onImport,
}: MarketplaceConnectorCardProps) {
  const connected = provider.status === "connected";

  return (
    <Card padding="md" className="flex h-full flex-col border-border">
      <div className="flex items-start gap-ds-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-lg bg-surface text-xl"
          aria-hidden
        >
          {provider.logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-ds-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{provider.name}</h3>
              <p className="mt-ds-1 line-clamp-2 text-xs text-text-secondary">{provider.description}</p>
            </div>
            <span
              className={
                connected
                  ? "rounded-ds-full bg-success/10 px-ds-2 py-0.5 text-[10px] font-semibold uppercase text-success"
                  : "rounded-ds-full bg-surface px-ds-2 py-0.5 text-[10px] font-semibold uppercase text-text-secondary"
              }
            >
              {provider.status}
            </span>
          </div>
        </div>
      </div>

      <dl className="mt-ds-3 grid grid-cols-2 gap-ds-2 text-xs">
        <div>
          <dt className="text-text-secondary">Health</dt>
          <dd className="mt-0.5 font-medium capitalize text-text-primary">{healthLabel(provider.healthStatus)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Sync</dt>
          <dd className="mt-0.5 font-medium capitalize text-text-primary">{syncLabel(provider.syncStatus)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Auth</dt>
          <dd className="mt-0.5 font-medium uppercase text-text-primary">{provider.authenticationType.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Last sync</dt>
          <dd className="mt-0.5 font-medium text-text-primary">
            {provider.lastSyncAt ? new Date(provider.lastSyncAt).toLocaleDateString() : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-ds-3 flex flex-wrap gap-ds-1">
        {provider.supportedFeatures.slice(0, 4).map((feature) => (
          <span
            key={feature}
            className="rounded-ds-full border border-border px-ds-2 py-0.5 text-[10px] text-text-secondary"
          >
            {feature}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap gap-ds-2 pt-ds-4">
        <Button size="sm" variant="primary" onClick={() => onImport(provider)}>
          Import
        </Button>
        <Button size="sm" variant="outline" onClick={() => onOpenSettings(provider)}>
          Settings
        </Button>
      </div>
    </Card>
  );
}