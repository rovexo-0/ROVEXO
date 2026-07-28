import { AccountCenterPage } from "@/features/account-center/components/AccountCenterPage";
import { fetchAccountHubSnapshot } from "@/lib/account-center/snapshot";
import { getSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";
import { fetchProfile } from "@/lib/profile/queries";
import { getAppSettings } from "@/lib/settings/store";
import { fetchWalletData } from "@/lib/wallet/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function AccountPage() {
  const profile = await fetchProfile();
  const [wallet, snapshot, sellerPerformance, settings] = await Promise.all([
    fetchWalletData().catch(() => null),
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
