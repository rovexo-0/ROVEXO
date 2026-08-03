import { WalletPayoutsPage } from "@/features/wallet/components/WalletPayoutsPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export async function generateMetadata() {
  return {
    title: "Payouts | Wallet | ROVEXO",
    robots: { index: false, follow: false },
  };
}

export default async function WalletPayoutsRoute() {
  const profile = await fetchProfile();
  if (!profile) {
    redirect(`/login?next=${WALLET_ROUTES.payouts}`);
  }

  const data = await fetchWalletData();
  return <WalletPayoutsPage transactions={data.transactions} />;
}
