"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import {
  resolveManualWithdrawableBalance,
  SELLER_WALLET_COPY,
  walletTransactionCategory,
} from "@/lib/transaction-hub/seller-wallet";
import { WALLET_CANONICAL_VERSION, WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletData, WalletTransaction } from "@/lib/wallet/types";
import {
  BankLineIcon,
  CreditCardLineIcon,
  ChevronRightLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";

type WalletHubV1Props = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
  showStatements?: boolean;
};

const RECENT_LIMIT = 8;

function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const positive = transaction.amount >= 0;
  const amountClass = positive ? "wallet-hub__amount--in" : "wallet-hub__amount--out";
  const prefix = positive ? "+" : "−";
  const category = walletTransactionCategory(transaction);

  return (
    <Link href={`${WALLET_ROUTES.transactions}/${transaction.id}`} className="wallet-hub__txn">
      <div className="wallet-hub__txn-icon" aria-hidden>
        {transaction.type === "withdrawal" ? "↗" : "£"}
      </div>
      <div className="wallet-hub__txn-copy">
        <p className="wallet-hub__txn-title">
          {transaction.orderNumber ? `Order #${transaction.orderNumber}` : transaction.productTitle}
        </p>
        <p className="wallet-hub__txn-sub">
          {category} · {formatWalletDate(transaction.createdAt)}
        </p>
      </div>
      <p className={cn("wallet-hub__txn-amount", amountClass)}>
        {prefix} {formatCurrency(Math.abs(transaction.amount))}
      </p>
    </Link>
  );
}

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="wallet-hub__quick-action">
      <span className="wallet-hub__quick-action-icon" aria-hidden>
        {icon}
      </span>
      <span className="wallet-hub__quick-action-label">{label}</span>
      <ChevronRightLineIcon />
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
  const withdrawable = resolveManualWithdrawableBalance(data);
  const { withdrawalSummary } = data;
  const connectedBank = data.withdrawMethods.find((method) => method.connected) ?? null;
  const walletVerified = data.connectStatus.connected && data.connectStatus.payoutsEnabled;

  return (
    <AccountCanonicalShell title="Wallet" backHref={backHref} backLabel="My Account">
      <div className="wallet-hub" data-wallet-hub-version="v1.0-production" data-wallet-canonical={WALLET_CANONICAL_VERSION}>
        {connectMessage ? <p className="wallet-hub__notice">{connectMessage}</p> : null}

        <section className="wallet-hub__balance-card" aria-labelledby="wallet-available-label">
          <div className="wallet-hub__balance-top">
            <div>
              <p id="wallet-available-label" className="wallet-hub__label">
                {SELLER_WALLET_COPY.availableBalance}
              </p>
              <p className="wallet-hub__balance">{formatCurrency(withdrawable)}</p>
              {walletVerified ? (
                <span className="wallet-hub__verified-pill">Verified Wallet</span>
              ) : null}
            </div>
            <div className="wallet-hub__balance-actions">
              <Link
                href={WALLET_ROUTES.withdraw}
                className={cn(
                  "wallet-hub__withdraw",
                  withdrawable <= 0 && "wallet-hub__withdraw--disabled",
                )}
                aria-disabled={withdrawable <= 0}
                onClick={(event) => {
                  if (withdrawable <= 0) event.preventDefault();
                }}
              >
                {SELLER_WALLET_COPY.withdrawFunds}
              </Link>
              <Link href={WALLET_ROUTES.bankAccount} className="wallet-hub__withdraw wallet-hub__withdraw--secondary">
                Bank Account
              </Link>
            </div>
          </div>
          <p className="wallet-hub__hint">{SELLER_WALLET_COPY.keepInWallet}</p>
        </section>

        <section className="wallet-hub__stats-grid" aria-label="Wallet statistics">
          <div className="wallet-hub__stat">
            <p className="wallet-hub__label">{SELLER_WALLET_COPY.pendingBalance}</p>
            <p className="wallet-hub__mini-balance">{formatCurrency(data.pendingBalance)}</p>
          </div>
          <div className="wallet-hub__stat">
            <p className="wallet-hub__label">Available</p>
            <p className="wallet-hub__mini-balance">{formatCurrency(withdrawable)}</p>
          </div>
          <div className="wallet-hub__stat">
            <p className="wallet-hub__label">Processing</p>
            <p className="wallet-hub__mini-balance">{formatCurrency(withdrawalSummary.processingTotal)}</p>
          </div>
          <div className="wallet-hub__stat">
            <p className="wallet-hub__label">Lifetime Withdrawn</p>
            <p className="wallet-hub__mini-balance">{formatCurrency(withdrawalSummary.completedTotal)}</p>
          </div>
        </section>

        <section className="wallet-hub__quick-actions" aria-label="Quick actions">
          <QuickAction href={WALLET_ROUTES.bankAccount} label="Bank Account" icon={<BankLineIcon />} />
          <QuickAction href={WALLET_ROUTES.withdraw} label="Withdraw" icon={<WalletLineIcon />} />
          <QuickAction href={WALLET_ROUTES.transactions} label="Transactions" icon={<WalletLineIcon />} />
          <QuickAction href={WALLET_ROUTES.paymentMethods} label="Payment Methods" icon={<CreditCardLineIcon />} />
        </section>

        <section className="wallet-hub__insights" aria-labelledby="wallet-insights-title">
          <h2 id="wallet-insights-title" className="ac-canonical__section-title">
            This Month
          </h2>
          <div className="wallet-hub__insights-grid">
            <div>
              <p className="wallet-hub__label">Sales</p>
              <p className="wallet-hub__mini-balance">{formatCurrency(data.monthSummary.revenue.value)}</p>
            </div>
            <div>
              <p className="wallet-hub__label">Withdrawn</p>
              <p className="wallet-hub__mini-balance">{formatCurrency(data.monthSummary.withdrawn.value)}</p>
            </div>
            <div>
              <p className="wallet-hub__label">Pending</p>
              <p className="wallet-hub__mini-balance">{formatCurrency(data.pendingBalance)}</p>
            </div>
          </div>
        </section>

        <section className="wallet-hub__bank-card" aria-labelledby="wallet-next-payout-title">
          <div className="wallet-hub__section-head">
            <h2 id="wallet-next-payout-title" className="wallet-hub__section-title">
              Next Payout
            </h2>
            <Link href={WALLET_ROUTES.payouts} className="wallet-hub__section-link">
              Payouts
            </Link>
          </div>
          <div className="wallet-hub__txn-card px-ds-4 py-ds-4">
            <p className="wallet-hub__label">Estimated payout</p>
            <p className="wallet-hub__mini-balance">{formatCurrency(data.pendingBalance)}</p>
            <p className="wallet-hub__hint">
              {data.pendingAvailableAt
                ? `Expected after ${formatWalletDate(data.pendingAvailableAt)}`
                : "Released after successful delivery hold."}
            </p>
            <p className="wallet-hub__hint mt-ds-2">
              Status: {withdrawalSummary.processingCount > 0 ? "Processing withdrawals" : "Ready when funds release"}
            </p>
          </div>
        </section>

        <section className="wallet-hub__bank-card" aria-labelledby="wallet-connected-bank-title">
          <div className="wallet-hub__section-head">
            <h2 id="wallet-connected-bank-title" className="wallet-hub__section-title">
              Connected Bank
            </h2>
            <Link href={WALLET_ROUTES.bankAccount} className="wallet-hub__section-link">
              {connectedBank ? "Change Bank" : "Add Bank"}
            </Link>
          </div>
          <div className="wallet-hub__txn-card">
            {connectedBank ? (
              <div className="wallet-hub__bank-row">
                <div>
                  <p className="wallet-hub__bank-label">{connectedBank.label}</p>
                  <p className="wallet-hub__bank-digits">•••• {connectedBank.lastDigits}</p>
                </div>
                {walletVerified ? <span className="wallet-hub__verified-pill">Verified</span> : null}
              </div>
            ) : (
              <p className="wallet-hub__empty">Connect a bank account to withdraw funds.</p>
            )}
          </div>
        </section>

        <section className="ac-canonical__section" aria-labelledby="wallet-txn-title">
          <div className="wallet-hub__section-head">
            <h2 id="wallet-txn-title" className="ac-canonical__section-title">
              Transactions
            </h2>
            {data.transactions.length > RECENT_LIMIT ? (
              <Link href={WALLET_ROUTES.transactions} className="wallet-hub__section-link">
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
          <section className="ac-canonical__section" aria-labelledby="wallet-statements-title">
            <div className="wallet-hub__section-head">
              <h2 id="wallet-statements-title" className="ac-canonical__section-title">
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

        <p className="wallet-hub__fee-note">{SELLER_WALLET_COPY.platformFeeBuyerOnly}</p>
      </div>
    </AccountCanonicalShell>
  );
}
