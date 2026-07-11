import { AccountCenterPage } from "@/features/account-center/components/AccountCenterPage";
import { fetchAccountHubSnapshot } from "@/lib/account-center/snapshot";
import { fetchProfile } from "@/lib/profile/queries";
import { fetchWalletData } from "@/lib/wallet/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function AccountPage() {
  const profile = await fetchProfile();
  const [wallet, snapshot] = await Promise.all([
    fetchWalletData().catch(() => null),
    fetchAccountHubSnapshot(profile),
  ]);

  return (
    <AccountCenterPage profile={profile} snapshot={snapshot} wallet={wallet} />
  );
}
