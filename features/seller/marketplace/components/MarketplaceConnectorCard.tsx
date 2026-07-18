"use client";

import type { MarketplaceProviderView } from "@/lib/seller/marketplace/types";
import { CanonicalMenuRow } from "@/src/components/canonical";

type MarketplaceConnectorCardProps = {
  provider: MarketplaceProviderView;
  onOpenSettings: (provider: MarketplaceProviderView) => void;
  onImport: (provider: MarketplaceProviderView) => void;
};

function statusLabel(status: MarketplaceProviderView["status"]): string {
  return status.replace(/_/g, " ");
}

/**
 * Absolute Final — Master Menu row (no fancy connector cards).
 */
export function MarketplaceConnectorCard({
  provider,
  onOpenSettings,
  onImport,
}: MarketplaceConnectorCardProps) {
  return (
    <CanonicalMenuRow
      title={provider.name}
      description={statusLabel(provider.status)}
      value="Import"
      onClick={() => onImport(provider)}
      trailing={
        <button
          type="button"
          className="text-[13px] font-semibold text-primary"
          onClick={(event) => {
            event.stopPropagation();
            onOpenSettings(provider);
          }}
        >
          Settings
        </button>
      }
      showChevron={false}
    />
  );
}
