"use client";

import { AccountCanonicalProfile } from "@/features/account-center/components/AccountCanonicalProfile";
import { AccountMenuSections } from "@/features/account-center/components/AccountMenuSections";
import { AccountSellerPerformanceCard } from "@/features/account-center/components/AccountSellerPerformanceCard";
import { useAccountHubLive } from "@/features/account-center/hooks/useAccountHubLive";
import type { AccountSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { UserProfile } from "@/lib/profile/types";
import type { WalletData } from "@/lib/wallet/types";

type AccountCenterHomeProps = {
  profile: UserProfile;
  snapshot: AccountHubSnapshot;
  wallet?: WalletData | null;
  sellerPerformance: AccountSellerPerformanceSummary;
};

export function AccountCenterHome({
  profile,
  snapshot,
  wallet = null,
  sellerPerformance,
}: AccountCenterHomeProps) {
  const { snapshot: liveSnapshot } = useAccountHubLive({
    userId: profile.id,
    snapshot,
    wallet,
  });

  return (
    <div
      className="ac-v1"
      data-account-version="v1.0"
      data-account-sprint="1-foundation"
      data-account-ui="visual-qa-wallet-match"
      data-ac-hub-version="v1.0-sprint1"
    >
      <AccountCanonicalProfile
        profile={profile}
        snapshot={liveSnapshot}
        sellerPerformance={sellerPerformance}
      />

      <AccountSellerPerformanceCard performance={sellerPerformance} />

      {liveSnapshot.listings === 0 ? (
        <p className="ac-v1__info-card" role="status">
          No listings yet — sell something when you are ready.
        </p>
      ) : null}

      {liveSnapshot.reviewCount === 0 ? (
        <p className="ac-v1__info-card" role="status">
          No reviews yet. Ratings appear after completed orders.
        </p>
      ) : null}

      <AccountMenuSections profile={profile} />
    </div>
  );
}
