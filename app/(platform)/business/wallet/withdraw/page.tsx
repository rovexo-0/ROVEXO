import { redirect } from "next/navigation";
import { WithdrawPage } from "@/features/wallet/components/withdraw/WithdrawPage";
import { fetchWalletData } from "@/lib/wallet/queries";
import { getBusinessProfile } from "@/lib/profile/data";
import { resolveProfileCompletionRedirect } from "@/lib/account/profile-completion.server";
import {
  createEmptyWalletData,
  type WithdrawSoftFail,
} from "@/lib/wallet/withdraw-page-v7";
import type { WalletData } from "@/lib/wallet/types";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

/**
 * Business Withdraw — same WithdrawPage + recordWithdrawal engine as Individual.
 * Immutable sellerContext=business → Business wallet + Business Connect only.
 */
export default async function BusinessWalletWithdrawRoute() {
  const profile = await getBusinessProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(WALLET_ROUTES.businessWithdraw)}`);
  }

  const completionRedirect = await resolveProfileCompletionRedirect(
    profile.id,
    "withdraw",
    WALLET_ROUTES.businessWithdraw,
  );
  if (completionRedirect) {
    redirect(completionRedirect);
  }

  let data: WalletData = createEmptyWalletData();
  let softFail: WithdrawSoftFail = null;

  try {
    data = await fetchWalletData("business");
  } catch {
    data = createEmptyWalletData();
    softFail = "supabase";
  }

  return <WithdrawPage data={data} softFail={softFail} sellerContext="business" />;
}

export async function generateMetadata() {
  return {
    title: "Business Withdraw | ROVEXO",
    robots: { index: false, follow: false },
  };
}
