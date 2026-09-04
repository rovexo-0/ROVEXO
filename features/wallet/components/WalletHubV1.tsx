"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { memo, type ReactNode } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import { resolveManualWithdrawableBalance } from "@/lib/transaction-hub/seller-wallet";
import { BALANCE_PAGE_NAME } from "@/lib/wallet/balance-hub-v1";
import {
  WALLET_CANONICAL_VERSION,
  WALLET_ROUTES,
  walletBankAccountsRouteForSellerContext,
  walletTransactionsRouteForSellerContext,
  withdrawRouteForSellerContext,
} from "@/lib/wallet/canonical-routes";
import { SUPREME_BLOOD_CODE_XIII_V1 } from "@/lib/supreme-blood-code-xiii-v1";
import { SUPREME_BLOOD_CODE_XIV_V1 } from "@/lib/supreme-blood-code-xiv-v1";
import { SUPREME_BLOOD_CODE_XIX_V1 } from "@/lib/supreme-blood-code-xix-v1";
import { formatCurrency } from "@/lib/wallet/utils";
import type { WalletData } from "@/lib/wallet/types";
import { useWalletLive } from "@/features/wallet/hooks/use-wallet-live";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import "@/styles/rovexo/wallet-hub-v1.css";

type WalletHubV1Props = {
  data: WalletData;
  userId: string;
  backHref?: string;
  connectMessage?: string;
  /** Presentation only — same Wallet Production UI. */
  variant?: "personal" | "business";
  isBusinessVerified?: boolean;
};

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

function WalletSectionSkeleton({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <section className="wallet-v2__skeleton" aria-busy="true" aria-label={`Loading ${label}`}>
      <div className="wallet-v2__skeleton-bar" />
      <div className={cn("wallet-v2__skeleton-card", tall && "wallet-v2__skeleton-card--tall")} />
    </section>
  );
}

const BalanceMetricCard = memo(function BalanceMetricCard({
  href,
  title,
  amount,
  icon,
  tone,
}: {
  href: string;
  title: string;
  amount: number;
  icon: ReactNode;
  tone: "pending" | "available" | "processing" | "paid";
}) {
  return (
    <Link
      href={href}
      className={cn("wallet-v2__metric", `wallet-v2__metric--${tone}`)}
      aria-label={`${title}: ${formatCurrency(amount)}`}
    >
      <span className="wallet-v2__metric-top">
        <span className="wallet-v2__metric-icon" aria-hidden>
          {icon}
        </span>
        <span className="wallet-v2__metric-chevron" aria-hidden>
          {PLATFORM_EMOJI.chevron}
        </span>
      </span>
      <p className="wallet-v2__metric-title">{title}</p>
      <p className="wallet-v2__metric-amount">{formatCurrency(amount)}</p>
    </Link>
  );
});

/**
 * Live wallet body — owns useWalletLive so AccountCanonicalShell does not wake on RT ticks (P8).
 */
function WalletHubLiveBody({
  initialData,
  userId,
  connectMessage,
  withdrawHref,
  sellerContext,
}: {
  initialData: WalletData;
  userId: string;
  connectMessage?: string;
  withdrawHref: string;
  sellerContext: "individual" | "business";
}) {
  const { data, rtTick } = useWalletLive(userId, initialData, sellerContext);
  const withdrawable = resolveManualWithdrawableBalance(data);
  const { withdrawalSummary } = data;

  return (
    <div
      className="wallet-v2"
      data-wallet-hub-version="v1.0-canonical"
      data-wallet-canonical={WALLET_CANONICAL_VERSION}
      data-wallet-ui="v1.0-canonical-mockup"
      data-wallet-visual="canonical-light"
      data-wallet-final-spec="v1.0-canonical-lock"
      data-balance-visual="final-polish-v1.0"
      data-blood-code-xiii={SUPREME_BLOOD_CODE_XIII_V1.version}
      data-blood-code-xiv={SUPREME_BLOOD_CODE_XIV_V1.version}
      data-blood-code-xix={SUPREME_BLOOD_CODE_XIX_V1.version}
      data-wallet-sprint="IV"
      data-wallet-freeze="LOCKED"
      data-wallet-rt-tick={rtTick}
      data-wallet-available={data.availableBalance}
      data-wallet-seller-context={sellerContext}
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

        <div className="wallet-v2__hero-footer">
          <p className="wallet-v2__hero-sub">
            Available to withdraw
            <span className="wallet-v2__hero-info" aria-hidden>
              {PLATFORM_EMOJI.info}
            </span>
          </p>

          <div className="wallet-v2__hero-actions">
            <Link
              href={withdrawHref}
              className={cn(
                "wallet-v2__hero-btn",
                "wallet-v2__hero-btn--primary",
                withdrawable <= 0 && "is-disabled",
              )}
              aria-disabled={withdrawable <= 0}
              tabIndex={withdrawable <= 0 ? -1 : undefined}
              onClick={(event) => {
                if (withdrawable <= 0) event.preventDefault();
              }}
            >
              Withdraw
            </Link>
            <Link
              href={walletBankAccountsRouteForSellerContext(sellerContext)}
              className="wallet-v2__hero-btn wallet-v2__hero-btn--secondary"
            >
              Bank Account
            </Link>
          </div>
        </div>
      </section>

      <section className="wallet-v2__metrics" aria-label="Wallet balances">
        <BalanceMetricCard
          href={walletTransactionsRouteForSellerContext(sellerContext)}
          title="Pending"
          amount={data.pendingBalance}
          tone="pending"
          icon={PLATFORM_EMOJI.pending}
        />
        <BalanceMetricCard
          href={withdrawHref}
          title="Available"
          amount={withdrawable}
          tone="available"
          icon={PLATFORM_EMOJI.wallet}
        />
        <BalanceMetricCard
          href={
            sellerContext === "business"
              ? walletTransactionsRouteForSellerContext("business")
              : WALLET_ROUTES.payouts
          }
          title="Processing"
          amount={withdrawalSummary.processingTotal}
          tone="processing"
          icon={PLATFORM_EMOJI.processing}
        />
        <BalanceMetricCard
          href={
            sellerContext === "business"
              ? walletTransactionsRouteForSellerContext("business")
              : WALLET_ROUTES.payouts
          }
          title="Paid Out"
          amount={withdrawalSummary.completedTotal}
          tone="paid"
          icon={PLATFORM_EMOJI.paid}
        />
      </section>

      <WalletInsights
        sales={data.monthSummary.revenue.value}
        withdrawn={data.monthSummary.withdrawn.value}
        pending={data.pendingBalance}
        pendingAvailableAt={data.pendingAvailableAt}
        headingEmoji={PLATFORM_EMOJI.date}
      />

      <WalletRecentTransactions
        transactions={data.transactions}
        listHref={walletTransactionsRouteForSellerContext(sellerContext)}
      />
    </div>
  );
}

export function WalletHubV1({
  data: initialData,
  userId,
  backHref = "/account",
  connectMessage,
  variant = "personal",
  isBusinessVerified = false,
}: WalletHubV1Props) {
  void isBusinessVerified;
  const isBusiness = variant === "business";
  const sellerContext = isBusiness ? "business" : "individual";
  const withdrawHref = withdrawRouteForSellerContext(sellerContext);

  return (
    <AccountCanonicalShell
      title={isBusiness ? "Business Balance" : BALANCE_PAGE_NAME}
      backHref={isBusiness ? "/business/dashboard" : backHref}
      backLabel={isBusiness ? "Business" : "My Account"}
      showHeaderTitle
      showBottomNav
    >
      <WalletHubLiveBody
        initialData={initialData}
        userId={userId}
        connectMessage={connectMessage}
        withdrawHref={withdrawHref}
        sellerContext={sellerContext}
      />
    </AccountCanonicalShell>
  );
}
