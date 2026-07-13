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
  ChevronRightLineIcon,
  CreditCardLineIcon,
  DocumentLineIcon,
  InfoLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import "@/styles/rovexo/wallet-hub-v1.css";

type WalletHubV1Props = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
};

type IconProps = SVGProps<SVGSVGElement>;

function HelpCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1.4.9-1.4 1.7" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M21 12a9 9 0 0 0-15.5-6.4" strokeLinecap="round" />
      <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12a9 9 0 0 0 15.5 6.4" strokeLinecap="round" />
      <path d="M21 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WithdrawUpIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M12 16V5" strokeLinecap="round" />
      <path d="M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" strokeLinecap="round" />
    </svg>
  );
}

function AddBankIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M3 10h18" strokeLinecap="round" />
      <path d="M5 10v8M9 10v8M15 10v8M19 10v8" strokeLinecap="round" />
      <path d="M3 18h18" strokeLinecap="round" />
      <path d="M12 3l9 5H3l9-5Z" strokeLinejoin="round" />
      <circle cx="18" cy="6" r="4" fill="currentColor" stroke="none" />
      <path d="M18 4.5v3M16.5 6h3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
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
  tone,
}: {
  href: string;
  title: string;
  amount: number;
  hint: string;
  icon: ReactNode;
  tone: "pending" | "available" | "processing" | "paid";
}) {
  return (
    <Link
      href={href}
      className={cn("wallet-v2__metric", `wallet-v2__metric--${tone}`)}
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
        <Link href="/help" aria-label="Help" className="wallet-v2__help">
          <HelpCircleIcon />
        </Link>
      }
    >
      <div
        className="wallet-v2"
        data-wallet-hub-version="v1.0-canonical"
        data-wallet-canonical={WALLET_CANONICAL_VERSION}
        data-wallet-ui="v1.0-canonical-mockup"
        data-wallet-visual="canonical-light"
        data-wallet-ssot="docs/modules/wallet/wallet-v1-canonical-mockup.png"
      >
        {connectMessage ? <p className="wallet-v2__notice">{connectMessage}</p> : null}

        <section className="wallet-v2__hero" aria-labelledby="wallet-available-label">
          <div className="wallet-v2__hero-top">
            <p id="wallet-available-label" className="wallet-v2__hero-label">
              Available Balance
            </p>
            <span className="wallet-v2__status-pill" aria-label="Wallet status Available">
              <span className="wallet-v2__status-dot" aria-hidden />
              Available
            </span>
          </div>

          <p className="wallet-v2__hero-balance">{formatCurrency(withdrawable)}</p>

          <p className="wallet-v2__hero-sub">
            Available to withdraw
            <span className="wallet-v2__hero-info" aria-hidden>
              <InfoLineIcon />
            </span>
          </p>

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
              <WithdrawUpIcon />
              Withdraw
            </Link>
            <Link href={WALLET_ROUTES.bankAccount} className="wallet-v2__hero-btn wallet-v2__hero-btn--secondary">
              <BankLineIcon />
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
            tone="pending"
            icon={<ClockLineIcon />}
          />
          <BalanceMetricCard
            href={WALLET_ROUTES.withdraw}
            title="Available"
            amount={withdrawable}
            hint="Ready to withdraw"
            tone="available"
            icon={<WalletLineIcon />}
          />
          <BalanceMetricCard
            href={WALLET_ROUTES.payouts}
            title="Processing"
            amount={withdrawalSummary.processingTotal}
            hint="Being processed"
            tone="processing"
            icon={<RefreshLineIcon />}
          />
          <BalanceMetricCard
            href={WALLET_ROUTES.payouts}
            title="Paid Out"
            amount={withdrawalSummary.completedTotal}
            hint="Total withdrawn"
            tone="paid"
            icon={<CheckCircleLineIcon />}
          />
        </section>

        <section className="wallet-v2__section" aria-labelledby="wallet-quick-title">
          <div className="wallet-v2__section-head">
            <h2 id="wallet-quick-title" className="wallet-v2__section-title">
              Quick Actions
            </h2>
          </div>
          <div className="wallet-v2__quick-grid">
            <QuickActionCard href={WALLET_ROUTES.bankAccount} label="Add Bank" icon={<AddBankIcon />} />
            <QuickActionCard href={WALLET_ROUTES.withdraw} label="Withdraw" icon={<WithdrawUpIcon />} />
            <QuickActionCard href={WALLET_ROUTES.transactions} label="Transactions" icon={<DocumentLineIcon />} />
            <QuickActionCard
              href={WALLET_ROUTES.paymentMethods}
              label="Payment Methods"
              icon={<CreditCardLineIcon />}
            />
          </div>
        </section>

        <WalletInsights
          sales={data.monthSummary.revenue.value}
          withdrawn={data.monthSummary.withdrawn.value}
          pending={data.pendingBalance}
          pendingAvailableAt={data.pendingAvailableAt}
        />

        <WalletConnectedBank bank={connectedBank} verified={walletVerified} />

        <WalletRecentTransactions transactions={data.transactions} />
      </div>
    </AccountCanonicalShell>
  );
}
