import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { TransactionStatusBadge } from "@/features/wallet/components/TransactionStatusBadge";
import { ChevronRightIcon } from "@/features/dashboard/icons";
import { formatWalletDate } from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";

type RecentTransactionsSectionProps = {
  transactions: WalletTransaction[];
};

function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const amountClassName =
    transaction.amount < 0 ? "text-text-primary" : "text-success";

  return (
    <Link href={`/seller/wallet/transactions/${transaction.id}`} className="block">
      <div className="flex min-h-[72px] items-center gap-ds-3 px-ds-4 py-ds-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
          <Image
            src={transaction.productImageUrl}
            alt={transaction.productTitle}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {transaction.productTitle}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            Order {transaction.orderNumber}
          </p>
          <div className="mt-ds-1 flex flex-wrap items-center gap-ds-2">
            <span className={amountClassName}>
              <Price amount={Math.abs(transaction.amount)} size="sm" />
            </span>
            <TransactionStatusBadge status={transaction.status} />
          </div>
          <time dateTime={transaction.createdAt} className="mt-ds-1 block text-xs text-text-muted">
            {formatWalletDate(transaction.createdAt)}
          </time>
        </div>

        <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted" />
      </div>
    </Link>
  );
}

export function RecentTransactionsSection({ transactions }: RecentTransactionsSectionProps) {
  const items = transactions.slice(0, 10);

  return (
    <section aria-labelledby="wallet-transactions-heading" className="flex flex-col gap-ds-3">
      <h2 id="wallet-transactions-heading" className="text-base font-semibold text-text-primary">
        Recent Transactions
      </h2>

      <Card padding="none" className="overflow-hidden shadow-ds-soft">
        {items.length === 0 ? (
          <p className="px-ds-4 py-ds-6 text-center text-sm text-text-secondary">
            No transactions yet.
          </p>
        ) : (
          items.map((transaction, index) => (
            <div
              key={transaction.id}
              className={index > 0 ? "border-t border-border" : undefined}
            >
              <TransactionRow transaction={transaction} />
            </div>
          ))
        )}
      </Card>
    </section>
  );
}
