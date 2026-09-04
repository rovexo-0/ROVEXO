import { WalletTransactionsList } from "@/features/wallet/components/WalletTransactionsList";
import { listWalletTransactions } from "@/lib/wallet/store";
import { getBusinessProfile } from "@/lib/profile/data";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export default async function BusinessWalletTransactionsRoute() {
  const profile = await getBusinessProfile();
  const transactions = await listWalletTransactions(profile.id, "business");
  return (
    <WalletTransactionsList
      transactions={transactions}
      backHref={WALLET_ROUTES.businessHub}
      detailBaseHref={WALLET_ROUTES.businessTransactions}
    />
  );
}

export async function generateMetadata() {
  return {
    title: "Business Transactions | ROVEXO",
    robots: { index: false, follow: false },
  };
}
