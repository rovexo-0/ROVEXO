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
  CreditCardLineIcon,
  DocumentLineIcon,
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
      <path d="M18 5v4M16 7h4" strokeLinecap="round" />
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
  { ssr: true, loading: () => <WalletSectionSkeleton label="Connected Bank" hideTitle /> },
);

function WalletSectionSkeleton({
  label,
  tall = false,
  hideTitle = false,
}: {
  label: string;
  tall?: boolean;
  hideTitle?: boolean;
}) {
  return (
    <section className="wallet-v2__skeleton" aria-busy="true" aria-label={`Loading ${label}`}>
      {hideTitle ? null : <div className="wallet-v2__skeleton-bar" />}
      <div className={cn("wallet-v2__skeleton-card", tall && "wallet-v2__skeleton-card--tall")} />
    </section>
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
        data-wallet-hub-version="v1.2-ui"
        data-wallet-canonical={WALLET_CANONICAL_VERSION}
        data-wallet-ui="v1.2-simplified"
        data-wallet-visual="canonical-light"
        data-wallet-freeze="pending-visual-qa"
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

        <section className="wallet-v2__section wallet-v2__section--quick" aria-label="Quick actions">
          <div className="wallet-v2__quick-card">
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
