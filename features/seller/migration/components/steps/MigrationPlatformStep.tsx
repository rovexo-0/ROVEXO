"use client";

import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { BRING_YOUR_ITEM_PLATFORM_FLOWS } from "@/lib/bring-your-item/platform-flow";
import { resolveMigrationPlatformIcon } from "@/lib/icons/migration-platform-icons";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";

type MigrationPlatformStepProps = {
  selected: MigrationPlatformId | null;
  onSelect: (platform: MigrationPlatformId) => void;
  connectedPlatformIds?: ReadonlySet<string>;
};

export function MigrationPlatformStep({
  selected,
  onSelect,
  connectedPlatformIds,
}: MigrationPlatformStepProps) {
  return (
    <div className="flex w-full flex-col gap-ds-3">
      <CanonicalSection title="Choose marketplace">
        <CanonicalCard variant="list">
          <div role="listbox" aria-label="Supported marketplaces">
            {BRING_YOUR_ITEM_PLATFORM_FLOWS.filter((platform) => platform.connectMode !== "coming_soon").map(
              (platform) => {
                const isSelected = selected === platform.id;
                const isConnected = connectedPlatformIds?.has(platform.id) ?? false;

                return (
                  <CanonicalMenuRow
                    key={platform.id}
                    title={platform.name}
                    description={isConnected ? "Connected" : undefined}
                    value={isSelected ? "Selected" : undefined}
                    showChevron={false}
                    onClick={() => onSelect(platform.id)}
                    icon={
                      <span className="ac-canonical__menu-icon" aria-hidden>
                        <RovexoIcon icon={resolveMigrationPlatformIcon(platform.id)} variant="category" />
                      </span>
                    }
                  />
                );
              },
            )}
          </div>
        </CanonicalCard>
      </CanonicalSection>
      <p className="px-0 text-[13px] text-text-secondary">
        eBay, Etsy, and Shopify use secure OAuth. Paste a listing link or upload CSV when supported.
      </p>
    </div>
  );
}
