"use client";

import Link from "next/link";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import { WALLET_CANONICAL_VERSION, WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";

type WalletPayoutsPageProps = {
  transactions: WalletTransaction[];
};

export function WalletPayoutsPage({ transactions }: WalletPayoutsPageProps) {
  const payouts = transactions.filter((transaction) => transaction.type === "withdrawal");

  return (
    <AccountCanonicalShell title="Payouts" backHref={WALLET_ROUTES.hub} backLabel="Wallet">
      <div className="wallet-hub" data-wallet-payouts={WALLET_CANONICAL_VERSION}>
        <section className="wallet-hub__balance-card" aria-labelledby="wallet-payouts-intro">
          <p id="wallet-payouts-intro" className="wallet-hub__label">
            Withdrawal & payout history
          </p>
          <p className="wallet-hub__hint">
            Track withdrawals sent to your connected bank account.
          </p>
        </section>

        <section className="ac-canonical__section" aria-labelledby="wallet-payouts-list">
          <div className="wallet-hub__section-head">
            <h2 id="wallet-payouts-list" className="ac-canonical__section-title">
              Recent payouts
            </h2>
            <Link href={WALLET_ROUTES.transactions} className="wallet-hub__section-link">
              All transactions
            </Link>
          </div>

          <div className="wallet-hub__txn-card">
            {payouts.length === 0 ? (
              <p className="wallet-hub__empty">No payouts yet.</p>
            ) : (
              payouts.map((transaction) => (
                <Link
                  key={transaction.id}
                  href={`${WALLET_ROUTES.transactions}/${transaction.id}`}
                  className="wallet-hub__txn"
                >
                  <div className="wallet-hub__txn-icon" aria-hidden>
                    ↗
                  </div>
                  <div className="wallet-hub__txn-copy">
                    <p className="wallet-hub__txn-title">
                      {transaction.withdrawMethodLabel ?? "Bank withdrawal"}
                    </p>
                    <p className="wallet-hub__txn-sub">
                      {transaction.status} · {formatWalletDate(transaction.createdAt)}
                    </p>
                  </div>
                  <p className={cn("wallet-hub__txn-amount", "wallet-hub__amount--out")}>
                    − {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>

        <Link href={WALLET_ROUTES.withdraw} className="wallet-hub__withdraw wallet-hub__withdraw--primary">
          Withdraw to Bank
        </Link>
      </div>
    </AccountCanonicalShell>
  );
}
