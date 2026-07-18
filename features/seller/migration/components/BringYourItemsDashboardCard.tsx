import { AccountIcon } from "@/components/account/AccountIcons";
import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";

/** Absolute Final — Master Menu row entry (no gradient card / emoji hero). */
export function BringYourItemsDashboardCard() {
  return (
    <CanonicalSection title="Import">
      <CanonicalCard variant="list">
        <CanonicalMenuRow
          title="Bring Your Item"
          description="Import listings from marketplaces"
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
