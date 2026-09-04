"use client";

import { AccountCanonicalShell } from "@/features/account-canonical";
import { CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

type WalletTransactionsListProps = {
  transactions: WalletTransaction[];
  backHref?: string;
  detailBaseHref?: string;
};

/**
 * Transactions — Profile Absolute Master inheritance (Contract v7).
 * Flat full-width rows. No decorative cards / giant containers.
 * UI Simplification v1.0 — search/type/year/export/payouts chrome removed (engines/APIs unchanged).
 */
export function WalletTransactionsList({
  transactions,
  backHref = WALLET_ROUTES.hub,
  detailBaseHref = WALLET_ROUTES.transactions,
}: WalletTransactionsListProps) {
  return (
    <AccountCanonicalShell
      title="Transactions"
      backHref={backHref}
      backLabel="Balance"
      showHeaderTitle
    >
      <div
        className="ac-canonical fw-engine__stack"
        data-wallet-transactions-version="v3.0-profile-master"
        data-full-width-surface="transactions"
        data-transactions-ui="simplified-v1.0"
      >
        <CanonicalSection title="Transactions">
          <div className="fw-engine__group">
            {transactions.length === 0 ? (
              <CanonicalMenuRow title="No transactions yet." showChevron={false} />
            ) : (
              transactions.map((transaction) => {
                const positive = transaction.amount >= 0;
                return (
                  <CanonicalMenuRow
                    key={transaction.id}
                    href={`${detailBaseHref}/${transaction.id}`}
                    title={transaction.productTitle}
                    description={
                      transaction.orderNumber
                        ? `#${transaction.orderNumber} · ${formatWalletDate(transaction.createdAt)}`
                        : formatWalletDate(transaction.createdAt)
                    }
                    value={`${positive ? "+" : "−"} ${formatCurrency(Math.abs(transaction.amount))}`}
                  />
                );
              })
            )}
          </div>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
