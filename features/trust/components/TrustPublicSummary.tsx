import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import type { PublicTrustSummary } from "@/lib/trust/types";

type TrustPublicSummaryProps = {
  summary: PublicTrustSummary;
  /** @deprecated One Product — ignored; always Master Menu density. */
  compact?: boolean;
};

/** Public trust — One Product Master Menu rows. */
export function TrustPublicSummary({ summary }: TrustPublicSummaryProps) {
  return (
    <CanonicalSection title="Trust">
      <CanonicalCard variant="list">
        <CanonicalMenuRow
          title="Trust Score"
          description={summary.tier}
          value={String(summary.score)}
          showChevron={false}
          icon={
            <span className="ac-canonical__menu-icon" aria-hidden>
              <AccountIcon name="verification" />
            </span>
          }
        />
        <CanonicalMenuRow
          title="Completed sales"
          value={String(summary.completedSales)}
          showChevron={false}
        />
        <CanonicalMenuRow
          title="Completed purchases"
          value={String(summary.completedPurchases)}
          showChevron={false}
        />
        {summary.responseRate != null ? (
          <CanonicalMenuRow
            title="Response rate"
            value={`${summary.responseRate}%`}
            showChevron={false}
          />
        ) : null}
      </CanonicalCard>
    </CanonicalSection>
  );
}
