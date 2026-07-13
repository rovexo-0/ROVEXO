"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import Link from "next/link";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import { resolveManualWithdrawableBalance } from "@/lib/transaction-hub/seller-wallet";
import { WALLET_CANONICAL_VERSION, WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency } from "@/lib/wallet/utils";
import type { WalletData } from "@/lib/wallet/types";
import {
  BagLineIcon,
  BankLineIcon,
  CheckLineIcon,
  CreditCardLineIcon,
  DocumentLineIcon,
  EditLineIcon,
  TruckLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import "@/styles/rovexo/wallet-hub-v1.css";

type WalletHubV1Props = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
  showStatements?: boolean;
};

const WalletInsights = dynamic(
  () => import("@/features/wallet/components/WalletInsights").then((mod) => mod.WalletInsights),
  { ssr: true, loading: () => <WalletSectionSkeleton label="Insights" /> },
);

const WalletRecentTransactions = dynamic(
  () =>
    import("@/features/wallet/components/WalletRecentTransactions").then(
      (mod) => mod.WalletRecentTransactions,
    ),
  { ssr: true, loading: () => <WalletSectionSkeleton label="Transactions" /> },
);

function WalletSectionSkeleton({ label }: { label: string }) {
  return (
    <section className="wallet-v2__skeleton" aria-busy="true" aria-label={`Loading ${label}`}>
      <div className="wallet-v2__skeleton-bar" />
      <div className="wallet-v2__skeleton-card" />
    </section>
  );
}

function BalanceMetricCard({
  href,
  title,
  amount,
  hint,
  icon,
}: {
  href: string;
  title: string;
  amount: number;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="wallet-v2__metric"
      aria-label={`${title}: ${formatCurrency(amount)}. ${hint}`}
    >
      <span className="wallet-v2__metric-icon" aria-hidden>
        {icon}
      </span>
      <p className="wallet-v2__metric-title">{title}</p>
      <p className="wallet-v2__metric-amount">{formatCurrency(amount)}</p>
      <p className="wallet-v2__metric-hint">{hint}</p>
    </Link>
  );
}

function QuickActionButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="wallet-v2__quick" aria-label={label}>
      <span className="wallet-v2__quick-icon" aria-hidden>
        {icon}
      </span>
      <span className="wallet-v2__quick-label">{label}</span>
    </Link>
  );
}

export function WalletHubV1({
  data,
  backHref = "/account",
  connectMessage,
  showStatements = false,
}: WalletHubV1Props) {
  const withdrawable = resolveManualWithdrawableBalance(data);
  const { withdrawalSummary } = data;
  const connectedBank = data.withdrawMethods.find((method) => method.connected) ?? null;
  const availableStatus = withdrawable > 0 ? "Available" : "Ready";

  return (
    <AccountCanonicalShell title="Wallet" backHref={backHref} backLabel="My Account" showHeaderTitle>
      <div
        className="wallet-v2"
        data-wallet-hub-version="v1.0-production"
        data-wallet-canonical={WALLET_CANONICAL_VERSION}
        data-wallet-ui="v1.0-redesign"
      >
        {connectMessage ? <p className="wallet-v2__notice">{connectMessage}</p> : null}

        <section className="wallet-v2__hero" aria-labelledby="wallet-available-label">
          <div className="wallet-v2__hero-top">
            <div>
              <p id="wallet-available-label" className="wallet-v2__hero-label">
                Available Balance
              </p>
              <p className="wallet-v2__hero-balance">{formatCurrency(withdrawable)}</p>
              <p className="wallet-v2__hero-sub">Available to withdraw</p>
            </div>
            <span className="wallet-v2__status" aria-label={`Status: ${availableStatus}`}>
              <span className="wallet-v2__status-dot" aria-hidden />
              {availableStatus}
            </span>
          </div>

          <div className="wallet-v2__hero-actions">
            <Link
              href={WALLET_ROUTES.withdraw}
              className={cn(
                "wallet-v2__hero-btn",
                "wallet-v2__hero-btn--primary",
                withdrawable <= 0 && "is-disabled",
              )}
              aria-disabled={withdrawable <= 0}
              onClick={(event) => {
                if (withdrawable <= 0) event.preventDefault();
              }}
            >
              Withdraw
            </Link>
            <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__hero-btn wallet-v2__hero-btn--secondary">
              Bank Account
            </Link>
          </div>
        </section>

        <section className="wallet-v2__metrics" aria-label="Wallet balances">
          <BalanceMetricCard
            href={WALLET_ROUTES.transactions}
            title="Pending"
            amount={data.pendingBalance}
            hint="Waiting for delivery"
            icon={<TruckLineIcon />}
          />
          <BalanceMetricCard
            href={WALLET_ROUTES.withdraw}
            title="Available"
            amount={withdrawable}
            hint="Ready to withdraw"
            icon={<CheckLineIcon />}
          />
          <BalanceMetricCard
            href={WALLET_ROUTES.payouts}
            title="Processing"
            amount={withdrawalSummary.processingTotal}
            hint="Being processed"
            icon={<WalletLineIcon />}
          />
          <BalanceMetricCard
            href={WALLET_ROUTES.payouts}
            title="Paid Out"
            amount={withdrawalSummary.completedTotal}
            hint="Total withdrawn"
            icon={<BagLineIcon />}
          />
        </section>

        <section className="wallet-v2__quick-grid" aria-label="Quick actions">
          <QuickActionButton href={WALLET_ROUTES.bankAccount} label="Add Bank" icon={<BankLineIcon />} />
          <QuickActionButton href={WALLET_ROUTES.withdraw} label="Withdraw" icon={<WalletLineIcon />} />
          <QuickActionButton
            href={WALLET_ROUTES.transactions}
            label="Transactions"
            icon={<DocumentLineIcon />}
          />
          <QuickActionButton
            href={WALLET_ROUTES.paymentMethods}
            label="Payment Methods"
            icon={<CreditCardLineIcon />}
          />
        </section>

        <WalletInsights
          sales={data.monthSummary.revenue.value}
          withdrawn={data.monthSummary.withdrawn.value}
          pending={data.pendingBalance}
          pendingAvailableAt={data.pendingAvailableAt}
        />

        <section className="wallet-v2__section" aria-labelledby="wallet-bank-title">
          <div className="wallet-v2__section-head">
            <h2 id="wallet-bank-title" className="wallet-v2__section-title">
              Connected Bank
            </h2>
          </div>

          <div className="wallet-v2__bank-card">
            {connectedBank ? (
              <>
                <div className="wallet-v2__bank-row">
                  <span className="wallet-v2__bank-logo" aria-hidden>
                    <BankLineIcon />
                  </span>
                  <div className="wallet-v2__bank-copy">
                    <p className="wallet-v2__bank-name">{connectedBank.label}</p>
                    <p className="wallet-v2__bank-meta">
                      Account ending ****{connectedBank.lastDigits}
                    </p>
                    <span className="wallet-v2__bank-default">Default</span>
                  </div>
                </div>
                <div className="wallet-v2__bank-actions">
                  <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__bank-action">
                    <EditLineIcon />
                    Edit
                  </Link>
                  <Link
                    href={WALLET_ROUTES.bankAccount}
                    className="wallet-v2__bank-action wallet-v2__bank-action--danger"
                  >
                    Remove
                  </Link>
                </div>
              </>
            ) : (
              <div className="wallet-v2__bank-empty">
                <p className="wallet-v2__empty">No bank account connected</p>
                <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__cta">
                  Connect Bank Account
                </Link>
              </div>
            )}
          </div>
        </section>

        <WalletRecentTransactions transactions={data.transactions} />

        {showStatements ? (
          <section className="wallet-v2__section" aria-labelledby="wallet-statements-title">
            <div className="wallet-v2__section-head">
              <h2 id="wallet-statements-title" className="wallet-v2__section-title">
                Statements
              </h2>
              <Link href="/wallet/statements" className="wallet-v2__section-link">
                Monthly
              </Link>
            </div>
            <div className="wallet-v2__bank-card wallet-v2__bank-card--padded">
              <p className="wallet-v2__insight-copy">
                Monthly and annual seller statements with sales, refunds, withdrawals, and PDF export.
              </p>
              <Link href="/wallet/statements/annual" className="wallet-v2__section-link">
                Annual Statements
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </AccountCanonicalShell>
  );
}
