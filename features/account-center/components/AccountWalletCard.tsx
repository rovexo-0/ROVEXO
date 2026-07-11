"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/wallet/utils";
import type { WalletData } from "@/lib/wallet/types";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

type AccountWalletCardProps = {
  wallet: WalletData;
};

export function AccountWalletCard({ wallet }: AccountWalletCardProps) {
  const lifetimeEarnings =
    wallet.paidOutBalance + wallet.availableBalance + wallet.pendingBalance;

  return (
    <Link
      href="/wallet"
      className={cn("ac-canonical__wallet-card", focusRing)}
      aria-label="Open wallet"
    >
      <div className="ac-canonical__wallet-head">
        <h2 className="ac-canonical__wallet-title">Wallet</h2>
        <span className="ac-canonical__wallet-link">View all</span>
      </div>
      <div className="ac-canonical__wallet-grid">
        <div>
          <p className="ac-canonical__wallet-label">Available</p>
          <p className="ac-canonical__wallet-value">{formatCurrency(wallet.availableBalance)}</p>
        </div>
        <div>
          <p className="ac-canonical__wallet-label">Pending</p>
          <p className="ac-canonical__wallet-value">{formatCurrency(wallet.pendingBalance)}</p>
        </div>
        <div>
          <p className="ac-canonical__wallet-label">Monthly</p>
          <p className="ac-canonical__wallet-value">{formatCurrency(wallet.monthSummary.revenue.value)}</p>
        </div>
        <div>
          <p className="ac-canonical__wallet-label">Lifetime</p>
          <p className="ac-canonical__wallet-value">{formatCurrency(lifetimeEarnings)}</p>
        </div>
      </div>
    </Link>
  );
}
