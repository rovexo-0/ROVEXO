"use client";

import { AccountIcon } from "@/components/account/AccountIcons";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { AccountSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";

type AccountSellerPerformanceCardProps = {
  performance: AccountSellerPerformanceSummary;
};

/** Absolute Final: Performance as Master Menu rows — no score ring / hero meter. */
export function AccountSellerPerformanceCard({ performance }: AccountSellerPerformanceCardProps) {
  return (
    <CanonicalSection title="Performance" titleId="seller-performance-heading">
      <CanonicalCard variant="list">
        <CanonicalMenuRow
          title="Score"
          value={String(performance.score)}
          href="/seller/performance"
          icon={
            <span className="ac-canonical__menu-icon" aria-hidden>
              <AccountIcon name="reviews" />
            </span>
          }
        />
        <CanonicalMenuRow
          title="Level"
          value={performance.level}
          showChevron={false}
          icon={
            <span className="ac-canonical__menu-icon" aria-hidden>
              <AccountIcon name="verification" />
            </span>
          }
        />
        <CanonicalMenuRow
          title="Completed sales"
          value={performance.totalSales.toLocaleString()}
          showChevron={false}
          icon={
            <span className="ac-canonical__menu-icon" aria-hidden>
              <AccountIcon name="orders" />
            </span>
          }
        />
        <CanonicalMenuRow
          title="Rating"
          value={performance.ratingDisplay}
          showChevron={false}
          icon={
            <span className="ac-canonical__menu-icon" aria-hidden>
              <AccountIcon name="reviews" />
            </span>
          }
        />
      </CanonicalCard>
    </CanonicalSection>
  );
}
