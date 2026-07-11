import { notFound, redirect } from "next/navigation";
import { TransactionDetailPage } from "@/features/wallet/components/TransactionDetailPage";
import { fetchWalletTransaction } from "@/lib/wallet/queries";
import { getWalletEngineTransactionContext } from "@/lib/wallet-engine/reader";
import { fetchProfile } from "@/lib/profile/queries";

type TransactionDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function WalletTransactionDetailRoute({ params }: TransactionDetailRouteProps) {
  const profile = await fetchProfile();
  if (!profile) {
    redirect("/login?next=/wallet");
  }

  const { id } = await params;
  const [transaction, transactionContext] = await Promise.all([
    fetchWalletTransaction(id),
    getWalletEngineTransactionContext(profile.id, id),
  ]);

  if (!transaction) {
    notFound();
  }

  return (
    <TransactionDetailPage
      profile={profile}
      transaction={transaction}
      transactionContext={transactionContext ?? undefined}
      backHref="/wallet/transactions"
    />
  );
}
