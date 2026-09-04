import { notFound, redirect } from "next/navigation";
import { TransactionDetailPage } from "@/features/wallet/components/TransactionDetailPage";
import { fetchWalletTransaction } from "@/lib/wallet/queries";
import { getWalletEngineTransactionContext } from "@/lib/wallet-engine/reader";
import { getBusinessProfile } from "@/lib/profile/data";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

type TransactionDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function BusinessWalletTransactionDetailRoute({
  params,
}: TransactionDetailRouteProps) {
  const profile = await getBusinessProfile();
  if (!profile) {
    redirect(`/login?next=${WALLET_ROUTES.businessHub}`);
  }

  const { id } = await params;
  const [transaction, transactionContext] = await Promise.all([
    fetchWalletTransaction(id, "business"),
    getWalletEngineTransactionContext(profile.id, id, "business"),
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
      backHref={WALLET_ROUTES.businessTransactions}
      sellerContext="business"
      showHostedPayoutAccess={showHostedPayoutAccess}
    />
  );
}
