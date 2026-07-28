import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import {
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { processingWithdrawalTransactions } from "@/lib/wallet/balance-buckets";
import { resolveWalletBalanceView } from "@/lib/wallet/money-states";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import { fetchWalletData } from "@/lib/wallet/queries";
import { listWalletTransactions } from "@/lib/wallet/store";
import { fetchProfile } from "@/lib/profile/queries";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { redirect } from "next/navigation";

export default async function WalletProcessingPage() {
  const profile = await fetchProfile();
  if (!profile) redirect(`/login?next=${WALLET_ROUTES.processing}`);

  const [data, transactions] = await Promise.all([
    fetchWalletData(),
    listWalletTransactions(profile.id),
  ]);
  const balances = resolveWalletBalanceView(data);
  const processingRows = processingWithdrawalTransactions(transactions);

  return (
    <AccountCanonicalShell
      title="Processing"
      backHref={WALLET_ROUTES.hub}
      backLabel="Balance"
      showHeaderTitle
    >
      <AccountPageStack aria-label="Processing withdrawals">
        <CanonicalInfoBlock variant="description">
          Withdrawals that have been submitted and are waiting for bank confirmation. Funds stay
          locked until the payout completes or rolls back.
        </CanonicalInfoBlock>

        <CanonicalSection title="Amount">
          <div className="fw-engine__group">
            <CanonicalMenuRow
              title="Processing"
              value={formatCurrency(balances.processing)}
              showChevron={false}
            />
            <CanonicalMenuRow
              title="In progress"
              value={String(data.withdrawalSummary.processingCount)}
              showChevron={false}
            />
          </div>
        </CanonicalSection>

        <CanonicalSection title="Orders">
          <div className="fw-engine__group">
            {processingRows.length === 0 ? (
              <CanonicalMenuRow title="No withdrawals processing." showChevron={false} />
            ) : (
              processingRows.map((tx) => (
                <CanonicalMenuRow
                  key={tx.id}
                  href={`/wallet/transactions/${tx.id}`}
                  title={tx.productTitle || "Withdrawal"}
                  description={
                    tx.withdrawMethodLabel
                      ? `${tx.withdrawMethodLabel} · ${formatWalletDate(tx.createdAt)}`
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
    title: "Processing | Wallet | ROVEXO",
    robots: { index: false, follow: false },
  };
}
