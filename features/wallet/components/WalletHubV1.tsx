"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BackIcon, ChevronRightIcon } from "@/features/product-detail/icons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { SellerCommerceSummary } from "@/lib/commerce-engine/read-model";
import type { WalletData, WalletTransaction } from "@/lib/wallet/types";

type WalletHubV1Props = {
  data: WalletData;
  commerceSummary?: SellerCommerceSummary;
  backHref?: string;
  connectMessage?: string;
};

const RECENT_LIMIT = 5;

function transactionLabel(transaction: WalletTransaction): string {
  if (transaction.type === "withdrawal") return "Withdrawal";
  if (transaction.type === "sale") return "Sale";
  if (transaction.type === "refund") return "Refund";
  if (transaction.type === "fee") return "Fee";
  return transaction.type;
}

function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const positive = transaction.amount >= 0;
  const amountClass = positive ? "wallet-hub__amount--in" : "wallet-hub__amount--out";
  const prefix = positive ? "+" : "−";

  return (
    <Link
      href={`/seller/wallet/transactions/${transaction.id}`}
      className="wallet-hub__txn"
    >
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
      <ChevronRightIcon className="wallet-hub__txn-chevron" aria-hidden />
    </Link>
  );
}

export function WalletHubV1({ data, commerceSummary, backHref = "/account", connectMessage }: WalletHubV1Props) {
  const router = useRouter();
  const [withdrawing, setWithdrawing] = useState(false);
  const visible = data.transactions.slice(0, RECENT_LIMIT);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const response = await fetch("/api/wallet/connect", { method: "POST" });
      const payload = (await response.json()) as { success?: boolean; url?: string; error?: string };
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }
      router.refresh();
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <BetaAppShell bottomNavTab="account">
      <header className="wallet-hub__header">
        <Link href={backHref} className={cn("wallet-hub__back", focusRing)} aria-label="Back to My Account">
          <BackIcon className="h-5 w-5" />
        </Link>
        <h1 className="wallet-hub__title">My Account</h1>
        <span className="wallet-hub__header-spacer" aria-hidden />
      </header>

      <main className="wallet-hub" data-wallet-hub-version="v1.0">
        {connectMessage ? <p className="wallet-hub__notice">{connectMessage}</p> : null}

        <section className="wallet-hub__balance-card" aria-labelledby="wallet-available-label">
          <div className="wallet-hub__balance-top">
            <div>
              <p id="wallet-available-label" className="wallet-hub__label">
                Available Balance
              </p>
              <p className="wallet-hub__balance">{formatCurrency(data.availableBalance)}</p>
            </div>
            <button
              type="button"
              className="wallet-hub__withdraw"
              disabled={withdrawing || data.availableBalance <= 0}
              onClick={() => void handleWithdraw()}
            >
              Withdraw
            </button>
          </div>

          <p className="wallet-hub__escrow-note">
            Pending funds are held in escrow until delivery + 24 hours. Only available funds can be withdrawn.
          </p>

          <div className="wallet-hub__stats">
            <div className="wallet-hub__stat">
              <span className="wallet-hub__stat-label">Pending</span>
              <span className="wallet-hub__stat-value">{formatCurrency(data.pendingBalance)}</span>
            </div>
            <div className="wallet-hub__stat">
              <span className="wallet-hub__stat-label">Available</span>
              <span className="wallet-hub__stat-value">{formatCurrency(data.availableBalance)}</span>
            </div>
            <div className="wallet-hub__stat">
              <span className="wallet-hub__stat-label">Paid out</span>
              <span className="wallet-hub__stat-value">
                {formatCurrency(commerceSummary?.paid ?? data.paidOutBalance)}
              </span>
            </div>
            {commerceSummary && commerceSummary.onHold > 0 ? (
              <div className="wallet-hub__stat">
                <span className="wallet-hub__stat-label">On hold</span>
                <span className="wallet-hub__stat-value">{formatCurrency(commerceSummary.onHold)}</span>
              </div>
            ) : null}
            {commerceSummary && commerceSummary.shippingReserved > 0 ? (
              <div className="wallet-hub__stat">
                <span className="wallet-hub__stat-label">Shipping reserved</span>
                <span className="wallet-hub__stat-value">{formatCurrency(commerceSummary.shippingReserved)}</span>
              </div>
            ) : null}
            <div className="wallet-hub__stat">
              <span className="wallet-hub__stat-label">Total earnings</span>
              <span className="wallet-hub__stat-value">{formatCurrency(data.monthSummary.revenue.value)}</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="wallet-txn-title">
          <div className="wallet-hub__section-head">
            <h2 id="wallet-txn-title" className="wallet-hub__section-title">
              Recent Transactions
            </h2>
            {data.transactions.length > RECENT_LIMIT ? (
              <Link href="/wallet" className="wallet-hub__section-link">
                See all
              </Link>
            ) : null}
          </div>

          <div className="wallet-hub__txn-card">
            {visible.length === 0 ? (
              <p className="wallet-hub__empty">No transactions yet.</p>
            ) : (
              visible.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))
            )}
          </div>
        </section>
      </main>
    </BetaAppShell>
  );
}
