import { redirect } from "next/navigation";
import { AccountCenterPage } from "@/features/account-center/components/AccountCenterPage";
import { fetchAccountHubSnapshot } from "@/lib/account-center/snapshot";
import { getSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";
import { BUSINESS_DASHBOARD_ROUTE } from "@/lib/business/access";
import { loadBusinessStatus } from "@/lib/business/business-onboarding-v1";
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
  const [wallet, snapshot, sellerPerformance, settings, businessStatus] = await Promise.all([
    walletPromise,
    fetchAccountHubSnapshot(profile),
    getSellerPerformanceSummary(profile.id),
    getAppSettings(profile.id).catch(() => null),
    loadBusinessStatus(profile.id, { lite: true }).catch(() => null),
  ]);

  if (businessStatus?.activeSellerContext === "business") {
    redirect(BUSINESS_DASHBOARD_ROUTE);
  }

  return (
    <AccountCenterPage
      profile={profile}
      snapshot={snapshot}
      wallet={wallet}
      sellerPerformance={sellerPerformance}
      holidayModeEnabled={Boolean(settings?.vacationMode)}
      businessStatus={businessStatus}
    />
  );
}
