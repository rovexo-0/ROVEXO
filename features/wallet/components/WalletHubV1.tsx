"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode, SVGProps } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import { resolveManualWithdrawableBalance } from "@/lib/transaction-hub/seller-wallet";
import { WALLET_CANONICAL_VERSION, WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency } from "@/lib/wallet/utils";
import type { WalletData } from "@/lib/wallet/types";
import {
  BankLineIcon,
  CheckLineIcon,
  ChevronRightLineIcon,
  CreditCardLineIcon,
  DocumentLineIcon,
  HeadsetLineIcon,
  ShieldLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import "@/styles/rovexo/wallet-hub-v1.css";

type WalletHubV1Props = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
  showStatements?: boolean;
};

type IconProps = SVGProps<SVGSVGElement>;

function ClockLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProcessingLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" />
      <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const WalletInsights = dynamic(
  () => import("@/features/wallet/components/WalletInsights").then((mod) => mod.WalletInsights),
  { ssr: true, loading: () => <WalletSectionSkeleton label="Insights" tall /> },
);

const WalletRecentTransactions = dynamic(
  () =>
    import("@/features/wallet/components/WalletRecentTransactions").then(
      (mod) => mod.WalletRecentTransactions,
    ),
  { ssr: true, loading: () => <WalletSectionSkeleton label="Transactions" tall /> },
);

const WalletConnectedBank = dynamic(
  () =>
    import("@/features/wallet/components/WalletConnectedBank").then((mod) => mod.WalletConnectedBank),
  { ssr: true, loading: () => <WalletSectionSkeleton label="Connected Bank" /> },
);

function WalletSectionSkeleton({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <section className="wallet-v2__skeleton" aria-busy="true" aria-label={`Loading ${label}`}>
      <div className="wallet-v2__skeleton-bar" />
      <div className={cn("wallet-v2__skeleton-card", tall && "wallet-v2__skeleton-card--tall")} />
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
      <span className="wallet-v2__metric-top">
        <span className="wallet-v2__metric-icon" aria-hidden>
          {icon}
        </span>
        <span className="wallet-v2__metric-chevron" aria-hidden>
          <ChevronRightLineIcon />
        </span>
      </span>
      <p className="wallet-v2__metric-title">{title}</p>
      <p className="wallet-v2__metric-amount">{formatCurrency(amount)}</p>
      <p className="wallet-v2__metric-hint">{hint}</p>
    </Link>
  );
}

function QuickActionCard({
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
  const walletVerified = data.connectStatus.connected && data.connectStatus.payoutsEnabled;

  return (
    <AccountCanonicalShell
      title="Wallet"
      backHref={backHref}
      backLabel="My Account"
      showHeaderTitle
      rightAction={
        <Link href="/help" aria-label="Help Centre" className="wallet-v2__help">
          <HeadsetLineIcon />
        </Link>
      }
    >
      <div
        className="wallet-v2"
        data-wallet-hub-version="v1.0-production"
        data-wallet-canonical={WALLET_CANONICAL_VERSION}
        data-wallet-ui="v1.0-final"
        data-wallet-visual="canonical-light"
      >
        {connectMessage ? <p className="wallet-v2__notice">{connectMessage}</p> : null}

        <section className="wallet-v2__hero" aria-labelledby="wallet-available-label">
          <div className="wallet-v2__hero-glow" aria-hidden />
          <div className="wallet-v2__hero-top">
            <div className="wallet-v2__hero-copy">
              <p id="wallet-available-label" className="wallet-v2__hero-label">
                Available Balance
              </p>
              <p className="wallet-v2__hero-balance">{formatCurrency(withdrawable)}</p>
              <p className="wallet-v2__hero-sub">Available to withdraw</p>
            </div>
            <span className="wallet-v2__verified" aria-label="Verified Wallet">
              <ShieldLineIcon />
              Verified Wallet
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
            icon={<ClockLineIcon />}
          />
          <BalanceMetricCard
            href={WALLET_ROUTES.withdraw}
            title="Available"
            amount={withdrawable}
            hint="Ready to withdraw"
            icon={<WalletLineIcon />}
          />
          <BalanceMetricCard
            href={WALLET_ROUTES.payouts}
            title="Processing"
            amount={withdrawalSummary.processingTotal}
            hint="Being processed"
            icon={<ProcessingLineIcon />}
          />
          <BalanceMetricCard
            href={WALLET_ROUTES.payouts}
            title="Lifetime Withdrawn"
            amount={withdrawalSummary.completedTotal}
            hint="Total withdrawn"
            icon={<CheckLineIcon />}
          />
        </section>

        <section className="wallet-v2__quick-grid" aria-label="Quick actions">
          <QuickActionCard href={WALLET_ROUTES.bankAccount} label="Bank Account" icon={<BankLineIcon />} />
          <QuickActionCard href={WALLET_ROUTES.withdraw} label="Withdraw" icon={<WalletLineIcon />} />
          <QuickActionCard href={WALLET_ROUTES.transactions} label="Transactions" icon={<DocumentLineIcon />} />
          <QuickActionCard
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

        <WalletConnectedBank bank={connectedBank} verified={walletVerified} />

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
            <div className="wallet-v2__panel wallet-v2__panel--padded">
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
