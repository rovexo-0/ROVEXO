"use client";

import { useMemo, useState } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";

type WalletTransactionsListProps = {
  transactions: WalletTransaction[];
};

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "sale", label: "Sales" },
  { value: "fee", label: "Fees" },
  { value: "refund", label: "Refunds" },
  { value: "withdrawal", label: "Withdrawals" },
] as const;

export function WalletTransactionsList({ transactions }: WalletTransactionsListProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]["value"]>("all");

  const years = useMemo(() => {
    const set = new Set(transactions.map((txn) => new Date(txn.createdAt).getFullYear().toString()));
    return ["all", ...[...set].sort().reverse()];
  }, [transactions]);

  const [year, setYear] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      if (type !== "all" && transaction.type !== type) return false;
      if (year !== "all" && new Date(transaction.createdAt).getFullYear().toString() !== year) {
        return false;
      }
      if (!needle) return true;
      const haystack = [
        transaction.productTitle,
        transaction.orderNumber ?? "",
        transaction.type,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, transactions, type, year]);

  return (
    <AccountCanonicalShell
      title="Transactions"
      backHref="/wallet"
      backLabel="Wallet"
      showHeaderTitle
    >
      <div className="ac-canonical" data-wallet-transactions-version="v2.0-one-product">
        <CanonicalSection title="Filters">
          <CanonicalCard variant="medium" className="flex flex-col gap-ds-3 p-ds-4">
            <label className="sr-only" htmlFor="wallet-txn-search">
              Search transactions
            </label>
            <input
              id="wallet-txn-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or order #"
              className="min-h-11 w-full rounded-[20px] border border-[rgb(15_23_42/0.08)] px-ds-4 text-sm"
            />
            <div className="grid grid-cols-2 gap-ds-3">
              <select
                value={type}
                onChange={(event) => setType(event.target.value as (typeof TYPE_OPTIONS)[number]["value"])}
                className="min-h-11 w-full rounded-[20px] border border-[rgb(15_23_42/0.08)] px-ds-3 text-sm"
                aria-label="Filter by type"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="min-h-11 w-full rounded-[20px] border border-[rgb(15_23_42/0.08)] px-ds-3 text-sm"
                aria-label="Filter by year"
              >
                {years.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry === "all" ? "All years" : entry}
                  </option>
                ))}
              </select>
            </div>
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Transactions">
          <CanonicalCard variant="list">
            {filtered.length === 0 ? (
              <CanonicalMenuRow title="No transactions match your filters." showChevron={false} />
            ) : (
              filtered.map((transaction) => {
                const positive = transaction.amount >= 0;
                return (
                  <CanonicalMenuRow
                    key={transaction.id}
                    href={`/wallet/transactions/${transaction.id}`}
                    title={transaction.productTitle}
                    description={
                      transaction.orderNumber
                        ? `#${transaction.orderNumber} · ${formatWalletDate(transaction.createdAt)}`
                        : formatWalletDate(transaction.createdAt)
                    }
                    value={`${positive ? "+" : "−"} ${formatCurrency(Math.abs(transaction.amount))}`}
                  />
                );
              })
            )}
          </CanonicalCard>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
