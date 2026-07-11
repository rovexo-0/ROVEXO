import { WalletTransactionsList } from "@/features/wallet/components/WalletTransactionsList";
import { listWalletTransactions } from "@/lib/wallet/store";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";

export default async function WalletTransactionsRoute() {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/wallet/transactions");
  }

  const transactions = await listWalletTransactions(profile.id);
  return <WalletTransactionsList transactions={transactions} />;
}
