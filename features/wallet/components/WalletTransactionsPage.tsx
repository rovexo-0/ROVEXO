"use client";

import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { cn } from "@/lib/cn";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";

type WalletTransactionsPageProps = {
  transactions: WalletTransaction[];
};

export function WalletTransactionsPage({ transactions }: WalletTransactionsPageProps) {
  return (
    <BetaAppShell bottomNavTab="account">
      <CanonicalPageHeader title="Transactions" backHref="/wallet" backLabel="Wallet" />

      <ScrollContainer withBottomNav className="wallet-hub" data-wallet-transactions-version="v2.0-02b">
        <div className="wallet-hub__txn-card">
          {transactions.length === 0 ? (
            <p className="wallet-hub__empty">No transactions yet.</p>
          ) : (
            transactions.map((transaction) => {
              const positive = transaction.amount >= 0;
              return (
                <Link key={transaction.id} href={`/wallet/transactions/${transaction.id}`} className="wallet-hub__txn">
                  <div className="wallet-hub__txn-copy">
                    <p className="wallet-hub__txn-title">{transaction.productTitle}</p>
                    <p className="wallet-hub__txn-sub">
                      {transaction.orderNumber ? `#${transaction.orderNumber} · ` : ""}
                      {formatWalletDate(transaction.createdAt)}
                    </p>
                  </div>
                  <p className={cn("wallet-hub__txn-amount", positive ? "wallet-hub__amount--in" : "wallet-hub__amount--out")}>
                    {positive ? "+" : "−"} {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </ScrollContainer>
    </BetaAppShell>
  );
}
