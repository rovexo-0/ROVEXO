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
    fetchWalletTransaction(id, "individual"),
    getWalletEngineTransactionContext(profile.id, id),
  ]);

  if (!transaction) {
    notFound();
  }

  const showHostedPayoutAccess =
    Boolean(transaction.stripeTransferId?.trim() || transaction.stripePayoutId?.trim()) ||
    transaction.type === "withdrawal" ||
    transaction.type === "sale";

  return (
    <TransactionDetailPage
      profile={profile}
      transaction={transaction}
      transactionContext={transactionContext ?? undefined}
      backHref="/wallet/transactions"
      sellerContext="individual"
      showHostedPayoutAccess={showHostedPayoutAccess}
    />
  );
}
