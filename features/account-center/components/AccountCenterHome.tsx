"use client";

import { AccountCanonicalProfile } from "@/features/account-center/components/AccountCanonicalProfile";
import { AccountMenuSections } from "@/features/account-center/components/AccountMenuSections";
import { AccountSellerPerformanceCard } from "@/features/account-center/components/AccountSellerPerformanceCard";
import { AccountStatsStrip } from "@/features/account-center/components/AccountStatsStrip";
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
  const { snapshot: liveSnapshot, wallet: liveWallet } = useAccountHubLive({
    userId: profile.id,
    snapshot,
    wallet,
  });

  return (
    <div
      className="ac-canonical"
      data-ac-hub-version="v1.0-production"
      data-account-freeze="FROZEN"
      data-account-version="v1.0"
    >
      <AccountCanonicalProfile profile={profile} snapshot={liveSnapshot} />
      <AccountStatsStrip snapshot={liveSnapshot} wallet={liveWallet} />
      <AccountSellerPerformanceCard performance={sellerPerformance} />
      <AccountMenuSections profile={profile} />
    </div>
  );
}
