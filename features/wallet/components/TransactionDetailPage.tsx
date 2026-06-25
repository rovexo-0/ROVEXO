import Image from "next/image";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { TransactionStatusBadge } from "@/features/wallet/components/TransactionStatusBadge";
import { WalletHeader } from "@/features/wallet/components/WalletHeader";
import {
  formatWalletDateTime,
  getDaysUntilAvailable,
} from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";
import type { UserProfile } from "@/lib/profile/types";

type TransactionDetailPageProps = {
  profile: UserProfile;
  transaction: WalletTransaction;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-ds-3 py-ds-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="max-w-[60%] truncate text-right text-sm font-medium text-text-primary">
        {value}
      </span>
    </div>
  );
}

export function TransactionDetailPage({ profile, transaction }: TransactionDetailPageProps) {
  const amount = Math.abs(transaction.amount);
  const pendingDays =
    transaction.payoutAvailableAt != null
      ? getDaysUntilAvailable(transaction.payoutAvailableAt)
      : null;

  return (
    <BetaAppShell showBottomNav={false}>
      <WalletHeader
        title="Transaction Details"
        backHref="/seller/wallet"
        unreadNotifications={profile.unreadNotifications}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <Card padding="md" className="">
          <div className="flex items-start gap-ds-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-ds-lg bg-surface-muted">
              <Image
                src={transaction.productImageUrl}
                alt={transaction.productTitle}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-text-primary">
                {transaction.productTitle}
              </h2>
              <p className="mt-ds-1 text-sm text-text-secondary">
                Order {transaction.orderNumber}
              </p>
              <div className="mt-ds-2 flex flex-wrap items-center gap-ds-2">
                <Price amount={amount} size="md" />
                <TransactionStatusBadge status={transaction.status} />
              </div>
            </div>
          </div>
        </Card>

        <Card padding="md" className="">
          <DetailRow label="Date" value={formatWalletDateTime(transaction.createdAt)} />
          <div className="border-t border-border">
            <DetailRow label="Type" value={transaction.type} />
          </div>
          {transaction.withdrawMethodLabel && (
            <div className="border-t border-border">
              <DetailRow label="Payout Method" value={transaction.withdrawMethodLabel} />
            </div>
          )}
          {transaction.feeAmount != null && (
            <div className="border-t border-border">
              <DetailRow label="Fee" value={`€${transaction.feeAmount.toFixed(2)}`} />
            </div>
          )}
          {transaction.description && (
            <div className="border-t border-border">
              <DetailRow label="Reference" value={transaction.description} />
            </div>
          )}
          {transaction.type === "promotion" && transaction.description?.includes("pi:") && (
            <div className="border-t border-border">
              <DetailRow
                label="Stripe Payment"
                value={transaction.description.match(/pi:([^|]+)/)?.[1] ?? "—"}
              />
            </div>
          )}
          {transaction.stripeTransferId && (
            <div className="border-t border-border">
              <DetailRow label="Stripe transfer" value={transaction.stripeTransferId} />
            </div>
          )}
          {pendingDays != null && transaction.status === "pending" && (
            <div className="border-t border-border">
              <DetailRow
                label="Payout"
                value={`Transfers after hold (${pendingDays} ${pendingDays === 1 ? "day" : "days"})`}
              />
            </div>
          )}
        </Card>
      </main>
    </BetaAppShell>
  );
}
