import { WalletPage } from "@/features/wallet/components/WalletPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { getBusinessProfile } from "@/lib/profile/data";
import { isBusinessVerifiedAccount } from "@/lib/verified/evaluate";

/** Business Wallet — never redirects to My Account or Personal Wallet. */
export default async function BusinessWalletPage() {
  const profile = await getBusinessProfile();
  const [data, isBusinessVerified] = await Promise.all([
    fetchWalletData(),
    isBusinessVerifiedAccount(profile.id).catch(() => false),
  ]);
  return (
    <WalletPage
      data={data}
      userId={profile.id}
      variant="business"
      backHref="/business/dashboard"
      isBusinessVerified={isBusinessVerified}
    />
  );
}

export async function generateMetadata() {
  return {
    title: "Business Balance | ROVEXO",
    robots: { index: false, follow: false },
  };
}
