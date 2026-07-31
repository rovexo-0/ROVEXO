"use client";

import { ProfileFooterBanner } from "@/components/profile/ProfileFooterBanner";
import { AccountCanonicalProfile } from "@/features/account-center/components/AccountCanonicalProfile";
import { AccountMenuSections } from "@/features/account-center/components/AccountMenuSections";
import { useAccountHubLive } from "@/features/account-center/hooks/useAccountHubLive";
import type { AccountSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { UserProfile } from "@/lib/profile/types";
import {
  formatAvailableBalanceLabel,
  resolveWalletBalanceView,
} from "@/lib/wallet/money-states";
import type { WalletData } from "@/lib/wallet/types";

type AccountCenterHomeProps = {
  profile: UserProfile;
  snapshot: AccountHubSnapshot;
  wallet?: WalletData | null;
  sellerPerformance: AccountSellerPerformanceSummary;
  holidayModeEnabled?: boolean;
};

/**
 * My Account hub — Compact Premium (PO): profile + Master Menu only.
 * Balance row shows Available only.
 * Holiday Mode is an inline Profile toggle (no subpage).
 */
export function AccountCenterHome({
  profile,
  snapshot,
  wallet = null,
  sellerPerformance,
  holidayModeEnabled = false,
}: AccountCenterHomeProps) {
  void sellerPerformance;
  const { snapshot: liveSnapshot, wallet: liveWallet } = useAccountHubLive({
    userId: profile.id,
    snapshot,
    wallet,
  });

  const availableLabel = liveWallet
    ? formatAvailableBalanceLabel(resolveWalletBalanceView(liveWallet).available)
    : undefined;

  return (
    <div
      className="ac-canonical"
      data-ac-hub-version="profile-v1"
      data-account-menu="profile-v1"
      data-account-version="v1.0"
      data-profile-scope="main-only"
    >
      <AccountCanonicalProfile profile={profile} snapshot={liveSnapshot} />
      <AccountMenuSections
        profile={profile}
        availableBalanceLabel={availableLabel}
        holidayModeEnabled={holidayModeEnabled}
        activeListingCount={liveSnapshot.listings}
      />
      {/* Sign Out → 24px → Profile Footer Banner → 32px safe (CSS) */}
      <ProfileFooterBanner />
    </div>
  );
}
