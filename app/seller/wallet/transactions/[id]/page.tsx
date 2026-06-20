import { notFound } from "next/navigation";
import { TransactionDetailPage } from "@/features/wallet/components/TransactionDetailPage";
import { fetchWalletTransaction } from "@/lib/wallet/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";

type TransactionDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function WalletTransactionDetailRoute({
  params,
}: TransactionDetailRouteProps) {
  const profile = await fetchProfile();

  if (!profile.isSeller) {
    redirect("/account");
  }

  const { id } = await params;
  const transaction = await fetchWalletTransaction(id);

  if (!transaction) {
    notFound();
  }

  return <TransactionDetailPage profile={profile} transaction={transaction} />;
}
