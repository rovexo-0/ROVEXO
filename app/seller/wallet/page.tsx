import { WalletPage } from "@/features/wallet/components/WalletPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";

export default async function SellerWalletRoute() {
  const profile = await fetchProfile();

  if (!profile.isSeller) {
    redirect("/account");
  }

  const data = await fetchWalletData();

  return <WalletPage profile={profile} data={data} />;
}
