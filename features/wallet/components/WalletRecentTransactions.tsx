"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { walletTransactionCategory } from "@/lib/transaction-hub/seller-wallet";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";

const RECENT_LIMIT = 6;

type WalletRecentTransactionsProps = {
  transactions: WalletTransaction[];
};

export function WalletRecentTransactions({ transactions }: WalletRecentTransactionsProps) {
  const visible = transactions.slice(0, RECENT_LIMIT);

  return (
    <section className="wallet-v2__section" aria-labelledby="wallet-txn-title">
      <div className="wallet-v2__section-head">
        <h2 id="wallet-txn-title" className="wallet-v2__section-title">
          Transactions
        </h2>
        {transactions.length > 0 ? (
          <Link href={WALLET_ROUTES.transactions} className="wallet-v2__section-link">
            View all
          </Link>
        ) : null}
      </div>

      <div className="wallet-v2__txn-card">
        {visible.length === 0 ? (
          <p className="wallet-v2__empty">No transactions yet.</p>
        ) : (
          visible.map((transaction) => {
            const positive = transaction.amount >= 0;
            const category = walletTransactionCategory(transaction);
            return (
              <Link
                key={transaction.id}
                href={`${WALLET_ROUTES.transactions}/${transaction.id}`}
                className="wallet-v2__txn"
                aria-label={`${category}: ${formatCurrency(Math.abs(transaction.amount))}`}
              >
                <span className="wallet-v2__txn-icon" aria-hidden>
                  {transaction.type === "withdrawal" ? "↗" : "£"}
                </span>
                <span className="wallet-v2__txn-copy">
                  <span className="wallet-v2__txn-title">
                    {transaction.orderNumber
                      ? `Order #${transaction.orderNumber}`
                      : transaction.productTitle}
                  </span>
                  <span className="wallet-v2__txn-meta">
                    {transaction.status} · {formatWalletDate(transaction.createdAt)}
                  </span>
                </span>
                <span className={cn("wallet-v2__txn-amount", positive ? "is-in" : "is-out")}>
                  {positive ? "+" : "−"}
                  {formatCurrency(Math.abs(transaction.amount))}
                </span>
                <span className="wallet-v2__txn-chevron" aria-hidden>
                  <ChevronRightLineIcon />
                </span>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
