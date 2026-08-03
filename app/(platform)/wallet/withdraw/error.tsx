"use client";

import { WithdrawPage } from "@/features/wallet/components/withdraw/WithdrawPage";
import { createEmptyWalletData } from "@/lib/wallet/withdraw-page-v7";

/** Soft empty recovery only — never technical surfaces. */
export default function WalletWithdrawError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  void reset;
  return <WithdrawPage data={createEmptyWalletData()} softFail="supabase" />;
}
