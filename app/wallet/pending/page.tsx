import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import {
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { pendingOrderTransactions } from "@/lib/wallet/balance-buckets";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import { fetchWalletData } from "@/lib/wallet/queries";
import { listWalletTransactions } from "@/lib/wallet/store";
import { fetchProfile } from "@/lib/profile/queries";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { redirect } from "next/navigation";

export default async function WalletPendingPage() {
  const profile = await fetchProfile();
  if (!profile) redirect(`/login?next=${WALLET_ROUTES.pending}`);

  const [data, transactions] = await Promise.all([
    fetchWalletData(),
    listWalletTransactions(profile.id),
  ]);
  const pendingOrders = pendingOrderTransactions(transactions);

  return (
    <AccountCanonicalShell
      title="Pending Balance"
      backHref={WALLET_ROUTES.hub}
      backLabel="Balance"
      showHeaderTitle
    >
      <AccountPageStack aria-label="Pending funds">
        <CanonicalInfoBlock variant="description">
          Funds held during the buyer protection period before they become available.
        </CanonicalInfoBlock>

        <CanonicalSection title="Amount">
          <div className="fw-engine__group">
            <CanonicalMenuRow
              title="Pending Balance"
              value={formatCurrency(data.pendingBalance)}
              showChevron={false}
            />
            {data.pendingAvailableAt ? (
              <CanonicalMenuRow
                title="Next release from"
                value={new Date(data.pendingAvailableAt).toLocaleDateString("en-GB")}
                showChevron={false}
              />
            ) : null}
          </div>
        </CanonicalSection>

        <CanonicalSection title="Orders">
          <div className="fw-engine__group">
            {pendingOrders.length === 0 ? (
              <CanonicalMenuRow title="No pending order holds." showChevron={false} />
            ) : (
              pendingOrders.map((tx) => (
                <CanonicalMenuRow
                  key={tx.id}
                  href={`/wallet/transactions/${tx.id}`}
                  title={tx.productTitle}
                  description={
                    tx.orderNumber
                      ? `#${tx.orderNumber} · ${formatWalletDate(tx.createdAt)}`
                      : formatWalletDate(tx.createdAt)
                  }
                  value={formatCurrency(Math.abs(tx.amount))}
                />
              ))
            )}
          </div>
        </CanonicalSection>
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}

export async function generateMetadata() {
  return {
    title: "Pending Balance | ROVEXO",
    robots: { index: false, follow: false },
  };
}
