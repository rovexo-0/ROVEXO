"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { walletTransactionCategory } from "@/lib/transaction-hub/seller-wallet";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";

const PAGE_SIZE = 6;

const TABS = [
  { id: "all", label: "All" },
  { id: "sale", label: "Sales" },
  { id: "withdrawal", label: "Withdrawals" },
  { id: "refund", label: "Refunds" },
  { id: "other", label: "Other" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type WalletRecentTransactionsProps = {
  transactions: WalletTransaction[];
};

function matchesTab(transaction: WalletTransaction, tab: TabId): boolean {
  if (tab === "all") return true;
  if (tab === "sale") return transaction.type === "sale";
  if (tab === "withdrawal") return transaction.type === "withdrawal";
  if (tab === "refund") return transaction.type === "refund";
  return transaction.type === "fee" || transaction.type === "promotion";
}

export function WalletRecentTransactions({ transactions }: WalletRecentTransactionsProps) {
  const [tab, setTab] = useState<TabId>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(
    () => transactions.filter((transaction) => matchesTab(transaction, tab)),
    [tab, transactions],
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [tab]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, tab, visible.length]);

  return (
    <section className="wallet-v2__section" aria-labelledby="wallet-txn-title">
      <div className="wallet-v2__section-head">
        <h2 id="wallet-txn-title" className="wallet-v2__section-title">
          Transactions
        </h2>
        <Link href={WALLET_ROUTES.transactions} className="wallet-v2__section-link">
          View All
        </Link>
      </div>

      <div className="wallet-v2__tabs" role="tablist" aria-label="Transaction filters">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={cn("wallet-v2__tab", tab === entry.id && "is-active")}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="wallet-v2__txn-card" role="tabpanel">
        {visible.length === 0 ? (
          <p className="wallet-v2__empty">No transactions yet.</p>
        ) : (
          <>
            {visible.map((transaction) => {
              const positive = transaction.amount >= 0;
              const category = walletTransactionCategory(transaction);
              const title = transaction.orderNumber
                ? `Order #${transaction.orderNumber}`
                : transaction.productTitle;
              return (
                <Link
                  key={transaction.id}
                  href={`${WALLET_ROUTES.transactions}/${transaction.id}`}
                  className="wallet-v2__txn"
                  aria-label={`${category}: ${formatCurrency(Math.abs(transaction.amount))}`}
                >
                  <span className="wallet-v2__txn-icon" aria-hidden>
                    {transaction.type === "withdrawal"
                      ? "↗"
                      : transaction.type === "refund"
                        ? "↺"
                        : "£"}
                  </span>
                  <span className="wallet-v2__txn-copy">
                    <span className="wallet-v2__txn-title">{title}</span>
                    <span className="wallet-v2__txn-sub">{category}</span>
                    <span className="wallet-v2__txn-meta">
                      <span className={cn("wallet-v2__txn-status", `is-${transaction.status}`)}>
                        {transaction.status}
                      </span>
                      <span>·</span>
                      <span>{formatWalletDate(transaction.createdAt)}</span>
                    </span>
                  </span>
                  <span className={cn("wallet-v2__txn-amount", positive ? "is-in" : "is-out")}>
                    {positive ? "+" : "−"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                  <span className="wallet-v2__txn-chevron" aria-hidden>
                    <ChevronRightLineIcon />
                  </span>
                </Link>
              );
            })}
            {hasMore ? <div ref={sentinelRef} className="wallet-v2__infinite-sentinel" aria-hidden /> : null}
          </>
        )}
      </div>
    </section>
  );
}
