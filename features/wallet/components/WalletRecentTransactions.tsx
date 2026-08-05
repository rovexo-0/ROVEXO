"use client";

import { memo, useState } from "react";
import Link from "next/link";
import type { SVGProps } from "react";
import { cn } from "@/lib/cn";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";

const PAGE_SIZE = 6;

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

function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Balance hub recent transactions — visual density aligned to Inbox/Orders list.
 * Presentation only: thumb 56×56 · title · date · amount · chevron. Engine untouched.
 */
export const WalletRecentTransactions = memo(function WalletRecentTransactions({
  transactions,
}: WalletRecentTransactionsProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = transactions.slice(0, visibleCount);
  const hasMore = visibleCount < transactions.length;

  return (
    <section className="wallet-v2__section" aria-labelledby="wallet-txn-title">
      <div className="wallet-v2__section-head">
        <h2 id="wallet-txn-title" className="wallet-v2__section-title">
          Transactions
        </h2>
        <Link
          href={WALLET_ROUTES.transactions}
          className="wallet-v2__section-link wallet-v2__section-link--latest"
        >
          Latest transactions
          <ChevronDownIcon />
        </Link>
      </div>

      <div className="wallet-v2__txn-list">
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
              const title = transaction.productTitle || "Transaction";
              return (
                <Link
                  key={transaction.id}
                  href={`${WALLET_ROUTES.transactions}/${transaction.id}`}
                  className="wallet-v2__txn"
                  aria-label={`${title}: ${formatCurrency(Math.abs(transaction.amount))}`}
                >
                  <span className="wallet-v2__txn-thumb" aria-hidden>
                    <ProductRowImage
                      src={transaction.productImageUrl}
                      alt=""
                      containerClassName="wallet-v2__txn-thumb-media"
                      sizes="56px"
                    />
                  </span>
                  <span className="wallet-v2__txn-copy">
                    <span className="wallet-v2__txn-title">{title}</span>
                    <span className="wallet-v2__txn-date">{formatWalletDate(transaction.createdAt)}</span>
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
            {hasMore ? (
              <button
                type="button"
                className="wallet-v2__load-more"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Load more
                <ChevronDownIcon />
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
});
