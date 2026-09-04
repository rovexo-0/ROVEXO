import { redirect } from "next/navigation";
import { WithdrawPage } from "@/features/wallet/components/withdraw/WithdrawPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { resolveProfileCompletionRedirect } from "@/lib/account/profile-completion.server";
import {
  createEmptyWalletData,
  type WithdrawSoftFail,
} from "@/lib/wallet/withdraw-page-v7";
import type { WalletData } from "@/lib/wallet/types";

/** Withdraw MUST open 100% of the time. Soft fail → empty state only. */
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

  let data: WalletData = createEmptyWalletData();
  let softFail: WithdrawSoftFail = null;

  try {
    data = await fetchWalletData();
  } catch {
    data = createEmptyWalletData();
    softFail = "supabase";
  }

  return <WithdrawPage data={data} softFail={softFail} sellerContext="individual" />;
}

export async function generateMetadata() {
  return {
    title: "Withdraw | ROVEXO",
    robots: { index: false, follow: false },
  };
}
