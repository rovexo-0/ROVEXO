import { WithdrawPage } from "@/features/wallet/components/withdraw/WithdrawPage";
import { createEmptyWalletData } from "@/lib/wallet/withdraw-page-v7";

export default function WalletWithdrawLoading() {
  return <WithdrawPage data={createEmptyWalletData()} initialLoading />;
}
