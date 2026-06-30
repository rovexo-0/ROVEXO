"use client";

import { Card } from "@/components/ui/Card";
import { MIGRATION_PLATFORMS } from "@/lib/seller/migration/constants";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type MigrationPlatformStepProps = {
  selected: MigrationPlatformId | null;
  onSelect: (platform: MigrationPlatformId) => void;
};

export function MigrationPlatformStep({ selected, onSelect }: MigrationPlatformStepProps) {
  return (
    <div className="flex flex-col gap-ds-3">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Choose platform</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Select where your listings live today. Connectors will plug in here later.
        </p>
      </div>
      <ul className="grid max-h-[28rem] grid-cols-2 gap-ds-2 overflow-y-auto sm:grid-cols-3" role="listbox" aria-label="Supported platforms">
        {MIGRATION_PLATFORMS.map((platform) => {
          const isSelected = selected === platform.id;
          return (
            <li key={platform.id}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(platform.id)}
                className={cn(
                  "rx-surface-card flex w-full flex-col items-start gap-ds-2 p-ds-3 text-left",
                  isSelected && "ring-2 ring-primary",
                  focusRing,
                )}
              >
                <span className="text-2xl" aria-hidden>
                  {platform.icon}
                </span>
                <span className="text-sm font-semibold text-text-primary">{platform.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Card padding="sm" className="border-dashed border-primary/25 bg-primary/5">
        <p className="text-xs text-text-secondary">
          Architecture ready for Facebook Marketplace, eBay, Amazon, Etsy, Vinted, Shopify, WooCommerce,
          and additional marketplaces.
        </p>
      </Card>
    </div>
  );
}
