"use client";

import { AccountCanonicalProfile } from "@/features/account-center/components/AccountCanonicalProfile";
import { AccountMenuSections } from "@/features/account-center/components/AccountMenuSections";
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

/**
 * My Account hub — Compact Premium (PO): profile + Master Menu only.
 * No stats strip, no duplicate wallet/orders cards, no dead space.
 */
export function AccountCenterHome({
  profile,
  snapshot,
  wallet = null,
  sellerPerformance,
}: AccountCenterHomeProps) {
  void sellerPerformance;
  const { snapshot: liveSnapshot } = useAccountHubLive({
    userId: profile.id,
    snapshot,
    wallet,
  });

  return (
    <div
      className="ac-canonical"
      data-ac-hub-version="v2.0-master"
      data-account-menu="master-v2"
      data-account-version="v1.0"
    >
      <AccountCanonicalProfile profile={profile} snapshot={liveSnapshot} />
      <AccountMenuSections profile={profile} />
    </div>
  );
}
