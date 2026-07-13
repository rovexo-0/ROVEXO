"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SVGProps } from "react";
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

type IconProps = SVGProps<SVGSVGElement>;

function EmptyTxnIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden {...props}>
      <rect x="14" y="10" width="36" height="44" rx="6" stroke="currentColor" strokeWidth="3" />
      <path d="M22 22h20M22 30h20M22 38h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="46" r="10" fill="#f4f4f5" stroke="currentColor" strokeWidth="3" />
      <path d="M44 42v5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="50.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function matchesTab(transaction: WalletTransaction, tab: TabId): boolean {
  if (tab === "all") return true;
  if (tab === "sale") return transaction.type === "sale";
  if (tab === "withdrawal") return transaction.type === "withdrawal";
  if (tab === "refund") return transaction.type === "refund";
  return transaction.type === "fee" || transaction.type === "promotion";
}

export function WalletRecentTransactions({ transactions }: WalletRecentTransactionsProps) {
  const [tab, setTab] = useState<TabId>("all");
  const [visibleByTab, setVisibleByTab] = useState<Record<TabId, number>>({
    all: PAGE_SIZE,
    sale: PAGE_SIZE,
    withdrawal: PAGE_SIZE,
    refund: PAGE_SIZE,
    other: PAGE_SIZE,
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasAnyTransactions = transactions.length > 0;

  const filtered = useMemo(
    () => transactions.filter((transaction) => matchesTab(transaction, tab)),
    [tab, transactions],
  );

  const visibleCount = visibleByTab[tab];
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleByTab((current) => ({
            ...current,
            [tab]: current[tab] + PAGE_SIZE,
          }));
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, tab, visible.length]);

  const selectTab = (next: TabId) => {
    setTab(next);
  };

  return (
    <section className="wallet-v2__section" aria-labelledby="wallet-txn-title">
      <div className="wallet-v2__section-head">
        <h2 id="wallet-txn-title" className="wallet-v2__section-title">
          Transactions
        </h2>
        <Link href={WALLET_ROUTES.transactions} className="wallet-v2__section-link">
          View all
        </Link>
      </div>

      {hasAnyTransactions ? (
        <div className="wallet-v2__tabs" role="tablist" aria-label="Transaction filters">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              className={cn("wallet-v2__tab", tab === entry.id && "is-active")}
              onClick={() => selectTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="wallet-v2__txn-card" role={hasAnyTransactions ? "tabpanel" : undefined}>
        {visible.length === 0 ? (
          <div className="wallet-v2__txn-empty">
            <span className="wallet-v2__txn-empty-icon" aria-hidden>
              <EmptyTxnIcon />
            </span>
            <p className="wallet-v2__txn-empty-title">No transactions yet</p>
            <p className="wallet-v2__txn-empty-copy">Your payments and withdrawals will appear here.</p>
          </div>
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
