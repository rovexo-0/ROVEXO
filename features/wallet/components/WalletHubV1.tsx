"use client";

import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { PageBack } from "@/components/navigation/PageBack";
import { cn } from "@/lib/cn";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletData, WalletTransaction } from "@/lib/wallet/types";

type WalletHubV1Props = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
  showStatements?: boolean;
};

const RECENT_LIMIT = 8;

function transactionLabel(transaction: WalletTransaction): string {
  if (transaction.type === "withdrawal") return "Withdrawal";
  if (transaction.type === "sale") return "Sale";
  if (transaction.type === "refund") return "Refund";
  if (transaction.type === "fee") return "Platform Fee";
  return transaction.type;
}

function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const positive = transaction.amount >= 0;
  const amountClass = positive ? "wallet-hub__amount--in" : "wallet-hub__amount--out";
  const prefix = positive ? "+" : "−";

  return (
    <Link href={`/wallet/transactions/${transaction.id}`} className="wallet-hub__txn">
      <div className="wallet-hub__txn-icon" aria-hidden>
        {transaction.type === "withdrawal" ? "↗" : "£"}
      </div>
      <div className="wallet-hub__txn-copy">
        <p className="wallet-hub__txn-title">
          {transaction.orderNumber ? `Order #${transaction.orderNumber}` : transaction.productTitle}
        </p>
        <p className="wallet-hub__txn-sub">
          {transactionLabel(transaction)} · {formatWalletDate(transaction.createdAt)}
        </p>
      </div>
      <p className={cn("wallet-hub__txn-amount", amountClass)}>
        {prefix} {formatCurrency(Math.abs(transaction.amount))}
      </p>
    </Link>
  );
}

export function WalletHubV1({
  data,
  backHref = "/account",
  connectMessage,
  showStatements = false,
}: WalletHubV1Props) {
  const visible = data.transactions.slice(0, RECENT_LIMIT);

  return (
    <BetaAppShell bottomNavTab="account">
      <header className="wallet-hub__header">
        <PageBack backHref={backHref} backLabel="My Account" preferHistory className="wallet-hub__back" />
        <h1 className="wallet-hub__title">Wallet</h1>
        <span className="wallet-hub__header-spacer" aria-hidden />
      </header>

      <ScrollContainer withBottomNav className="wallet-hub" data-wallet-hub-version="v1.0-production">
        {connectMessage ? <p className="wallet-hub__notice">{connectMessage}</p> : null}

        <section className="wallet-hub__balance-card" aria-labelledby="wallet-available-label">
          <p id="wallet-available-label" className="wallet-hub__label">
            Available Balance
          </p>
          <p className="wallet-hub__balance">{formatCurrency(data.availableBalance)}</p>

          <div className="wallet-hub__earnings-grid">
            <div>
              <p className="wallet-hub__label">Pending</p>
              <p className="wallet-hub__mini-balance">{formatCurrency(data.pendingBalance)}</p>
            </div>
            <div>
              <p className="wallet-hub__label">Withdrawable</p>
              <p className="wallet-hub__mini-balance">{formatCurrency(data.availableBalance)}</p>
            </div>
            <div>
              <p className="wallet-hub__label">Monthly Earnings</p>
              <p className="wallet-hub__mini-balance">{formatCurrency(data.monthSummary.revenue.value)}</p>
            </div>
            <div>
              <p className="wallet-hub__label">Lifetime Earnings</p>
              <p className="wallet-hub__mini-balance">
                {formatCurrency(data.paidOutBalance + data.availableBalance + data.pendingBalance)}
              </p>
            </div>
          </div>

          <Link
            href="/wallet/withdraw"
            className={cn(
              "wallet-hub__withdraw wallet-hub__withdraw--primary",
              data.availableBalance <= 0 && "wallet-hub__withdraw--disabled",
            )}
            aria-disabled={data.availableBalance <= 0}
            onClick={(event) => {
              if (data.availableBalance <= 0) event.preventDefault();
            }}
          >
            Withdraw
          </Link>
        </section>

        <section aria-labelledby="wallet-txn-title">
          <div className="wallet-hub__section-head">
            <h2 id="wallet-txn-title" className="wallet-hub__section-title">
              Transactions
            </h2>
            {data.transactions.length > RECENT_LIMIT ? (
              <Link href="/wallet/transactions" className="wallet-hub__section-link">
                View all
              </Link>
            ) : null}
          </div>

          <div className="wallet-hub__txn-card">
            {visible.length === 0 ? (
              <p className="wallet-hub__empty">No transactions yet.</p>
            ) : (
              visible.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)
            )}
          </div>
        </section>

        {showStatements ? (
          <section aria-labelledby="wallet-statements-title">
            <div className="wallet-hub__section-head">
              <h2 id="wallet-statements-title" className="wallet-hub__section-title">
                Statements
              </h2>
              <Link href="/wallet/statements" className="wallet-hub__section-link">
                Monthly
              </Link>
            </div>
            <div className="wallet-hub__txn-card px-ds-4 py-ds-4">
              <p className="text-sm text-text-secondary">
                Monthly and annual seller statements with sales, fees, refunds, withdrawals, and PDF export.
              </p>
              <Link href="/wallet/statements/annual" className="mt-ds-3 inline-flex text-sm font-medium text-primary">
                Annual Statements
              </Link>
            </div>
          </section>
        ) : null}
      </ScrollContainer>
    </BetaAppShell>
  );
}
