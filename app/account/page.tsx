import { AccountCenterPage } from "@/features/account-center/components/AccountCenterPage";
import { fetchProfile } from "@/lib/profile/queries";
import { fetchWalletData } from "@/lib/wallet/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function AccountPage() {
  const [profile, wallet] = await Promise.all([
    fetchProfile(),
    fetchWalletData().catch(() => null),
  ]);

  return (
    <AccountCenterPage profile={profile} walletBalance={wallet?.availableBalance ?? null} />
  );
}
