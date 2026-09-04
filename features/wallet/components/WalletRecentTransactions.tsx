"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

const PAGE_SIZE = 6;

type WalletRecentTransactionsProps = {
  transactions: WalletTransaction[];
  useEmojiIcons?: boolean;
  listHref?: string;
};

/**
 * Balance hub recent transactions — visual density aligned to Inbox/Orders list.
 * Presentation only: thumb 56×56 · title · date · amount · chevron. Engine untouched.
 */
export const WalletRecentTransactions = memo(function WalletRecentTransactions({
  transactions,
  listHref = WALLET_ROUTES.transactions,
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
          href={listHref}
          className="wallet-v2__section-link wallet-v2__section-link--latest"
        >
          Latest transactions
          <span aria-hidden>{PLATFORM_EMOJI.dropdown}</span>
        </Link>
      </div>

      <div className="wallet-v2__txn-list">
        {visible.length === 0 ? (
          <div className="wallet-v2__txn-empty">
            <span className="wallet-v2__txn-empty-icon" aria-hidden>
              {PLATFORM_EMOJI.copy}
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
                  href={`${listHref}/${transaction.id}`}
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
                    {PLATFORM_EMOJI.chevron}
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
                <span aria-hidden>{PLATFORM_EMOJI.dropdown}</span>
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
});
