"use client";

import Link from "next/link";
import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  BusinessWalletMenuSections,
  PersonalWalletMenuSections,
} from "@/features/wallet/components/WalletMenuSections";
import { cn } from "@/lib/cn";
import { resolveManualWithdrawableBalance } from "@/lib/transaction-hub/seller-wallet";
import { WALLET_CANONICAL_VERSION, WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency } from "@/lib/wallet/utils";
import type { WalletData } from "@/lib/wallet/types";
import "@/styles/rovexo/wallet-hub-v1.css";

type WalletHubV1Props = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
  variant?: "personal" | "business";
};

export function WalletHubV1({
  data,
  backHref = "/account",
  connectMessage,
  variant = "personal",
}: WalletHubV1Props) {
  const withdrawable = resolveManualWithdrawableBalance(data);
  const isBusiness = variant === "business";
  const title = isBusiness ? "Business Wallet" : "Personal Wallet";

  return (
    <AccountCanonicalShell
      title={title}
      backHref={isBusiness ? "/business/dashboard" : backHref}
      backLabel={isBusiness ? "Business" : "My Account"}
      showHeaderTitle
    >
      <div
        className="wallet-v2"
        data-wallet-hub-version="v2.0-master"
        data-wallet-canonical={WALLET_CANONICAL_VERSION}
        data-wallet-variant={variant}
        data-wallet-ui="compact-premium"
      >
        {connectMessage ? <p className="wallet-v2__notice">{connectMessage}</p> : null}

        <section className="wallet-v2__hero wallet-v2__hero--compact" aria-labelledby="wallet-available-label">
          <div className="wallet-v2__hero-top">
            <p id="wallet-available-label" className="wallet-v2__hero-label">
              Available
            </p>
            <span className="wallet-v2__status-pill" aria-label="Wallet status Available">
              <span className="wallet-v2__status-dot" aria-hidden />
              Available
            </span>
          </div>
          <p className="wallet-v2__hero-balance">{formatCurrency(withdrawable)}</p>
          {data.pendingBalance > 0 ? (
            <p className="wallet-v2__hero-pending">
              Pending {formatCurrency(data.pendingBalance)}
              {data.pendingAvailableAt
                ? ` · available ${new Date(data.pendingAvailableAt).toLocaleDateString("en-GB")}`
                : null}
            </p>
          ) : null}
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
              Bank
            </Link>
          </div>
        </section>

        {isBusiness ? <BusinessWalletMenuSections /> : <PersonalWalletMenuSections />}
      </div>
    </AccountCanonicalShell>
  );
}
