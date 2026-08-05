import { AccountCenterPage } from "@/features/account-center/components/AccountCenterPage";
import { fetchAccountHubSnapshot } from "@/lib/account-center/snapshot";
import { getSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";
import { fetchProfile } from "@/lib/profile/queries";
import { getAppSettings } from "@/lib/settings/store";
import { fetchWalletData } from "@/lib/wallet/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function AccountPage() {
  // Overlap wallet (session-auth only) with profile so Account is not a pure waterfall.
  const profilePromise = fetchProfile();
  const walletPromise = fetchWalletData().catch(() => null);
  const profile = await profilePromise;
  const [wallet, snapshot, sellerPerformance, settings] = await Promise.all([
    walletPromise,
    fetchAccountHubSnapshot(profile),
    getSellerPerformanceSummary(profile.id),
    getAppSettings(profile.id).catch(() => null),
  ]);

  return (
    <AccountCenterPage
      profile={profile}
      snapshot={snapshot}
      wallet={wallet}
      sellerPerformance={sellerPerformance}
      holidayModeEnabled={Boolean(settings?.vacationMode)}
    />
  );
}
