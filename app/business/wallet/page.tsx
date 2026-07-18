import { WalletPage } from "@/features/wallet/components/WalletPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { getBusinessProfile } from "@/lib/profile/data";

/** Business Wallet — never redirects to My Account or Personal Wallet. */
export default async function BusinessWalletPage() {
  await getBusinessProfile();
  const data = await fetchWalletData();
  return <WalletPage data={data} variant="business" backHref="/business/dashboard" />;
}

export async function generateMetadata() {
  return {
    title: "Business Wallet | ROVEXO",
    robots: { index: false, follow: false },
  };
}
