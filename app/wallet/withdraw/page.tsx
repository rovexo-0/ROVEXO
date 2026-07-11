import { redirect } from "next/navigation";
import { WithdrawPage } from "@/features/wallet/components/withdraw/WithdrawPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { resolveProfileCompletionRedirect } from "@/lib/account/profile-completion";

export default async function WalletWithdrawRoute() {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/wallet/withdraw");
  }

  const completionRedirect = await resolveProfileCompletionRedirect(
    profile.id,
    "withdraw",
    "/wallet/withdraw",
  );
  if (completionRedirect) {
    redirect(completionRedirect);
  }

  const data = await fetchWalletData();
  return <WithdrawPage data={data} />;
}

export async function generateMetadata() {
  return {
    title: "Withdraw | ROVEXO Wallet",
    robots: { index: false, follow: false },
  };
}
