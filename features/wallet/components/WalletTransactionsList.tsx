"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { PageBack } from "@/components/navigation/PageBack";
import { cn } from "@/lib/cn";
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
    <BetaAppShell bottomNavTab="account">
      <header className="wallet-hub__header">
        <PageBack backHref="/wallet" backLabel="Wallet" preferHistory className="wallet-hub__back" />
        <h1 className="wallet-hub__title">Transactions</h1>
        <span className="wallet-hub__header-spacer" aria-hidden />
      </header>

      <ScrollContainer withBottomNav className="wallet-hub" data-wallet-transactions-version="v1.0-legal-lock">
        <div className="wallet-hub__filters px-ds-4">
          <label className="sr-only" htmlFor="wallet-txn-search">
            Search transactions
          </label>
          <input
            id="wallet-txn-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or order #"
            className="wallet-hub__amount-input"
          />
          <div className="mt-ds-3 grid grid-cols-2 gap-ds-3">
            <select
              value={type}
              onChange={(event) => setType(event.target.value as (typeof TYPE_OPTIONS)[number]["value"])}
              className="wallet-hub__amount-input"
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
              className="wallet-hub__amount-input"
              aria-label="Filter by year"
            >
              {years.map((entry) => (
                <option key={entry} value={entry}>
                  {entry === "all" ? "All years" : entry}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="wallet-hub__txn-card">
          {filtered.length === 0 ? (
            <p className="wallet-hub__empty">No transactions match your filters.</p>
          ) : (
            filtered.map((transaction) => {
              const positive = transaction.amount >= 0;
              return (
                <Link key={transaction.id} href={`/wallet/transactions/${transaction.id}`} className="wallet-hub__txn">
                  <div className="wallet-hub__txn-copy">
                    <p className="wallet-hub__txn-title">{transaction.productTitle}</p>
                    <p className="wallet-hub__txn-sub">
                      {transaction.orderNumber ? `#${transaction.orderNumber} · ` : ""}
                      {formatWalletDate(transaction.createdAt)}
                    </p>
                  </div>
                  <p className={cn("wallet-hub__txn-amount", positive ? "wallet-hub__amount--in" : "wallet-hub__amount--out")}>
                    {positive ? "+" : "−"} {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </ScrollContainer>
    </BetaAppShell>
  );
}
