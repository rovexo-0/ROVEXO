import "@/styles/rovexo/account-canonical-v2.css";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountCenterHome } from "@/features/account-center/components/AccountCenterHome";
import type { AccountSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { UserProfile } from "@/lib/profile/types";
import type { WalletData } from "@/lib/wallet/types";

type AccountCenterPageProps = {
  profile: UserProfile;
  snapshot: AccountHubSnapshot;
  wallet?: WalletData | null;
  sellerPerformance: AccountSellerPerformanceSummary;
  holidayModeEnabled?: boolean;
};

export function AccountCenterPage({
  profile,
  snapshot,
  wallet = null,
  sellerPerformance,
  holidayModeEnabled = false,
}: AccountCenterPageProps) {
  return (
    <AccountCanonicalShell
      title="PROFILE"
      showHeaderTitle
      backHref="/"
      backLabel="Back"
    >
      <AccountCenterHome
        profile={profile}
        snapshot={snapshot}
        wallet={wallet}
        sellerPerformance={sellerPerformance}
        holidayModeEnabled={holidayModeEnabled}
      />
    </AccountCanonicalShell>
  );
}
