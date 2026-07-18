import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { Price } from "@/components/ui/Price";
import { WalletEngineTransactionPanel } from "@/features/wallet-engine/WalletEngineTransactionPanel";
import { TransactionStatusBadge } from "@/features/wallet/components/TransactionStatusBadge";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
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
      title="Transaction"
      backHref={backHref}
      backLabel="Wallet"
      showHeaderTitle
      showBottomNav={false}
    >
      <AccountPageStack aria-label="Transaction details">
        {transactionContext ? <WalletEngineTransactionPanel context={transactionContext} /> : null}

        <CanonicalSection title="Order">
          <CanonicalCard variant="medium" className="flex items-start gap-ds-3 p-ds-4">
            <ProductRowImage
              src={transaction.productImageUrl}
              alt={transaction.productTitle}
              containerClassName="h-16 w-16 shrink-0 rounded-ds-lg"
              sizes="64px"
            />
            <div className="min-w-0 flex-1">
              <p className="cds-menu-row__title truncate">{transaction.productTitle}</p>
              <p className="cds-menu-row__subtitle mt-ds-1">Order {transaction.orderNumber}</p>
              <div className="mt-ds-2 flex flex-wrap items-center gap-ds-2">
                <Price amount={amount} size="md" currency="GBP" locale="en-GB" />
                <TransactionStatusBadge status={transaction.status} />
              </div>
            </div>
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Details">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Date" value={formatWalletDateTime(transaction.createdAt)} showChevron={false} />
            <CanonicalMenuRow title="Type" value={transaction.type} showChevron={false} />
            {transaction.withdrawMethodLabel ? (
              <CanonicalMenuRow title="Payout method" value={transaction.withdrawMethodLabel} showChevron={false} />
            ) : null}
            {transaction.feeAmount != null ? (
              <CanonicalMenuRow title="Fee" value={`£${transaction.feeAmount.toFixed(2)}`} showChevron={false} />
            ) : null}
            {transaction.description && !transaction.description.includes("pi:") ? (
              <CanonicalMenuRow title="Reference" value={transaction.description} showChevron={false} />
            ) : null}
            {pendingDays != null && transaction.status === "pending" ? (
              <CanonicalMenuRow
                title="Payout"
                value={`After hold (${pendingDays} ${pendingDays === 1 ? "day" : "days"})`}
                showChevron={false}
              />
            ) : null}
          </CanonicalCard>
        </CanonicalSection>
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}
