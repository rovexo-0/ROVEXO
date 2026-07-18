import { AccountCanonicalShell } from "@/features/account-canonical";
import { Card } from "@/components/ui/Card";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { Price } from "@/components/ui/Price";
import { WalletEngineTransactionPanel } from "@/features/wallet-engine/WalletEngineTransactionPanel";
import { TransactionStatusBadge } from "@/features/wallet/components/TransactionStatusBadge";
import {
  formatWalletDateTime,
  getDaysUntilAvailable,
} from "@/lib/wallet/utils";
import type { WalletEngineTransactionContext } from "@/lib/wallet-engine/types";
import type { WalletTransaction } from "@/lib/wallet/types";
import type { UserProfile } from "@/lib/profile/types";

type TransactionDetailPageProps = {
  profile: UserProfile;
  transaction: WalletTransaction;
  transactionContext?: WalletEngineTransactionContext;
  backHref?: string;
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

export function TransactionDetailPage({
  profile: _profile,
  transaction,
  transactionContext,
  backHref = "/wallet",
}: TransactionDetailPageProps) {
  const amount = Math.abs(transaction.amount);
  const pendingDays =
    transaction.payoutAvailableAt != null
      ? getDaysUntilAvailable(transaction.payoutAvailableAt)
      : null;

  return (
    <AccountCanonicalShell
      title="Transaction Details"
      backHref={backHref}
      backLabel="Wallet"
      showHeaderTitle
      showBottomNav={false}
    >
      <div className="flex w-full flex-col gap-ds-4 px-ds-4 pb-ds-5">
        {transactionContext ? <WalletEngineTransactionPanel context={transactionContext} /> : null}
        <Card padding="md" className="">
          <div className="flex items-start gap-ds-3">
            <ProductRowImage
              src={transaction.productImageUrl}
              alt={transaction.productTitle}
              containerClassName="h-16 w-16 shrink-0 rounded-ds-lg"
              sizes="64px"
            />

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-text-primary">
                {transaction.productTitle}
              </h2>
              <p className="mt-ds-1 text-sm text-text-secondary">
                Order {transaction.orderNumber}
              </p>
              <div className="mt-ds-2 flex flex-wrap items-center gap-ds-2">
                <Price amount={amount} size="md" currency="GBP" locale="en-GB" />
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
              <DetailRow label="Fee" value={`£${transaction.feeAmount.toFixed(2)}`} />
            </div>
          )}
          {transaction.description && !transaction.description.includes("pi:") && (
            <div className="border-t border-border">
              <DetailRow label="Reference" value={transaction.description} />
            </div>
          )}
          {pendingDays != null && transaction.status === "pending" && (
            <div className="border-t border-border">
              <DetailRow
                label="Payout"
                value={`Available after hold (${pendingDays} ${pendingDays === 1 ? "day" : "days"})`}
              />
            </div>
          )}
        </Card>
      </div>
    </AccountCanonicalShell>
  );
}
