"use client";

import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { BRING_YOUR_ITEM_PLATFORM_FLOWS } from "@/lib/bring-your-item/platform-flow";
import { resolveMigrationPlatformIcon } from "@/lib/icons/migration-platform-icons";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";
import { cn } from "@/lib/cn";

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
    <div className="byi-panel__body flex flex-col gap-ds-3">
      <div>
        <h2 className="byi-section-title">Choose marketplace</h2>
        <p className="byi-section-subtitle">
          Tap where your listings live today. The next step connects and imports in one flow.
        </p>
      </div>
      <ul className="byi-platform-grid" role="listbox" aria-label="Supported marketplaces">
        {BRING_YOUR_ITEM_PLATFORM_FLOWS.map((platform) => {
          const isSelected = selected === platform.id;
          const isConnected = connectedPlatformIds?.has(platform.id) ?? false;
          const isSoon = platform.connectMode === "coming_soon";

          return (
            <li key={platform.id}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isSoon}
                onClick={() => onSelect(platform.id)}
                className={cn(
                  "byi-platform-tile",
                  isSelected && "byi-platform-tile--selected",
                )}
              >
                <span className="byi-platform-tile__icon" aria-hidden>
                  <RovexoIcon icon={resolveMigrationPlatformIcon(platform.id)} variant="category" />
                </span>
                <span className="byi-platform-tile__name">{platform.name}</span>
                {isConnected ? (
                  <span className="byi-badge byi-badge--connected">Connected</span>
                ) : null}
                {isSoon ? <span className="byi-badge byi-badge--soon">Coming soon</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="byi-hint">
        eBay, Etsy, and Shopify use secure OAuth. Paste a listing link or upload CSV when supported.
      </p>
    </div>
  );
}
