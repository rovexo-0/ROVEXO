"use client";

/**
 * Absolute Final — hero carousel / premium effects removed from consumer paths.
 * Retained export for registry / legacy imports; renders Master Menu entry only.
 */
import { AccountIcon } from "@/components/account/AccountIcons";
import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";

export function StoreMigrationHeroBanner() {
  return (
    <CanonicalSection title="Import">
      <CanonicalCard variant="list">
        <CanonicalMenuRow
          title="Bring Your Item"
          description="Import listings"
          href={MIGRATION_CENTER_PATH}
          icon={
            <span className="ac-canonical__menu-icon" aria-hidden>
              <AccountIcon name="import" />
            </span>
          }
        />
      </CanonicalCard>
    </CanonicalSection>
  );
}

/** @deprecated Absolute Final — alias kept for registry refs. */
export const HomeHeroBannerEngine = StoreMigrationHeroBanner;
