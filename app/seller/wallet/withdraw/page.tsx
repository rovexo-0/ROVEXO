import { WithdrawPage } from "@/features/wallet/components/withdraw/WithdrawPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";

export default async function SellerWalletWithdrawRoute() {
  const profile = await fetchProfile();

  if (!profile.isSeller) {
    redirect("/account");
  }

  const data = await fetchWalletData();

  return <WithdrawPage profile={profile} data={data} />;
}
