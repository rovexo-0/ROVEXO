"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons/icons";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { Button } from "@/components/ui/Button";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";
import { Card } from "@/components/ui/Card";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import { BankAccountForm } from "@/features/wallet/components/BankAccountForm";
import { TransactionStatusBadge } from "@/features/wallet/components/TransactionStatusBadge";
import { ChevronRightIcon } from "@/features/dashboard/icons";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletData, WalletTransaction } from "@/lib/wallet/types";

type WalletOverviewProps = {
  data: WalletData;
  backHref?: string;
  connectMessage?: string;
};

const RECENT_LIMIT = 5;

export function WalletOverview({
  data,
  backHref = "/seller/dashboard",
  connectMessage,
}: WalletOverviewProps) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [bankFormOpen, setBankFormOpen] = useState(false);

  const bankMethod = useMemo(
    () =>
      data.withdrawMethods.find((method) => method.connected && method.provider === "bank_account") ??
      data.withdrawMethods.find((method) => method.connected),
    [data.withdrawMethods],
  );
  const bankConnected = data.connectStatus.connected || Boolean(bankMethod);
  const bankLastDigits = bankMethod?.lastDigits?.trim() || "";

  const visibleTransactions = showAll
    ? data.transactions
    : data.transactions.slice(0, RECENT_LIMIT);
  const hasMore = data.transactions.length > RECENT_LIMIT;

  return (
    <>
      <BetaPageHeader title="Wallet" backHref={backHref} />

      <main className="wallet-overview">
        {connectMessage ? (
          <p
            role="status"
            className="wallet-overview__card rounded-ds-lg border border-primary/20 bg-primary/5 px-ds-4 py-ds-3 text-sm text-text-primary"
          >
            {connectMessage}
          </p>
        ) : null}

        {/* Card 1 — Available Balance */}
        <Card padding="lg" className="wallet-overview__card">
          <div className="flex flex-col gap-ds-4">
            <div className="flex flex-col gap-ds-1">
              <p className="wallet-overview__label">Available Balance</p>
              <p className="wallet-overview__balance">
                <AnimatedCounter
                  value={Math.round(data.availableBalance * 100)}
                  format={(value) => formatCurrency(value / 100)}
                />
              </p>
            </div>

            <Link
              href="/seller/wallet/withdraw"
              className={cn(buttonVariants.primary, buttonSizes.lg, "w-full")}
            >
              Withdraw
            </Link>

            <p className="wallet-overview__desc">
              Withdraw your available balance directly to your linked bank account.
            </p>
          </div>
        </Card>

        {/* Card 2 — Pending Balance */}
        <Card padding="lg" className="wallet-overview__card">
          <div className="flex flex-col gap-ds-3">
            <p className="wallet-overview__label">Pending Balance</p>
            <p className="wallet-overview__balance wallet-overview__balance--pending">
              <AnimatedCounter
                value={Math.round(data.pendingBalance * 100)}
                format={(value) => formatCurrency(value / 100)}
              />
            </p>
            <p className="wallet-overview__desc">
              Funds are held in escrow and released to your bank automatically 24
              hours after delivery — unless a claim is opened.
            </p>
          </div>
        </Card>

        {/* Card 3 — Bank Account */}
        <Card padding="lg" className="wallet-overview__card">
          <div className="flex flex-wrap items-center justify-between gap-ds-3">
            <div className="flex min-w-0 items-center gap-ds-3">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-lg bg-surface-muted"
              >
                <RovexoIcon icon={RovexoIcons.payments.payment} variant="category" />
              </span>
              <div className="min-w-0">
                <p className="wallet-overview__label">Bank Account</p>
                <p className="mt-0.5 truncate text-base font-semibold text-text-primary">
                  {bankConnected
                    ? bankLastDigits
                      ? `•••• ${bankLastDigits}`
                      : "Bank account connected"
                    : "No bank account connected"}
                </p>
              </div>
            </div>

            <Button
              variant={bankConnected ? "secondary" : "primary"}
              size="md"
              onClick={() => setBankFormOpen(true)}
            >
              {bankConnected ? "Manage" : "Add Bank Account"}
            </Button>
          </div>
        </Card>

        {/* Card 4 — Recent Transactions */}
        <Card padding="none" className="wallet-overview__card overflow-hidden">
          <div className="flex items-center justify-between gap-ds-3 px-ds-5 pb-ds-2 pt-ds-5">
            <h2 className="text-base font-semibold text-text-primary">Recent Transactions</h2>
            {hasMore ? (
              <button
                type="button"
                onClick={() => setShowAll((value) => !value)}
                className="rounded-ds-md px-ds-1 text-sm font-semibold text-primary hover:underline"
              >
                {showAll ? "Show less" : "View All"}
              </button>
            ) : null}
          </div>

          {visibleTransactions.length === 0 ? (
            <p className="px-ds-5 py-ds-6 text-center text-sm text-text-secondary">
              No transactions yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {visibleTransactions.map((transaction, index) => (
                <li
                  key={transaction.id}
                  className={index > 0 ? "border-t border-border" : undefined}
                >
                  <TransactionRow transaction={transaction} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Bottom — help */}
        <div className="flex items-center justify-center gap-ds-2 pt-ds-2 text-sm">
          <span className="text-text-secondary">Need help?</span>
          <Link href="/help" className="font-semibold text-primary hover:underline">
            Help Center
          </Link>
        </div>
      </main>

      <BankAccountForm
        open={bankFormOpen}
        connected={bankConnected}
        onClose={() => setBankFormOpen(false)}
        onSaved={() => {
          setBankFormOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const amountClassName = transaction.amount < 0 ? "text-text-primary" : "text-success";

  return (
    <Link
      href={`/seller/wallet/transactions/${transaction.id}`}
      className="flex min-h-[64px] items-center gap-ds-3 px-ds-5 py-ds-3 transition-colors hover:bg-surface-muted/60"
    >
      <ProductRowImage
        src={transaction.productImageUrl}
        alt={transaction.productTitle}
        containerClassName="h-12 w-12 shrink-0 rounded-ds-md"
        sizes="48px"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">
          {transaction.productTitle}
        </p>
        <time dateTime={transaction.createdAt} className="mt-0.5 block text-xs text-text-muted">
          {formatWalletDate(transaction.createdAt)}
        </time>
      </div>

      <div className="flex flex-col items-end gap-ds-1">
        <span className={amountClassName}>
          <Price amount={Math.abs(transaction.amount)} size="sm" currency="GBP" locale="en-GB" />
        </span>
        <TransactionStatusBadge status={transaction.status} />
      </div>

      <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted" />
    </Link>
  );
}
