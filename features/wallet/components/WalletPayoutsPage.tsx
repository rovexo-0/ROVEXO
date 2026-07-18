"use client";

import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import {
  CanonicalButtonLink,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { WALLET_CANONICAL_VERSION, WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { formatCurrency, formatWalletDate } from "@/lib/wallet/utils";
import type { WalletTransaction } from "@/lib/wallet/types";

type WalletPayoutsPageProps = {
  transactions: WalletTransaction[];
};

export function WalletPayoutsPage({ transactions }: WalletPayoutsPageProps) {
  const payouts = transactions.filter((transaction) => transaction.type === "withdrawal");

  return (
    <AccountCanonicalShell title="Payouts" backHref={WALLET_ROUTES.hub} backLabel="Wallet" showHeaderTitle>
      <div data-wallet-payouts={WALLET_CANONICAL_VERSION}>
        <AccountPageStack aria-label="Payouts">
          <CanonicalInfoBlock variant="description">
            Withdrawals sent to your connected bank account.
          </CanonicalInfoBlock>

          <CanonicalSection title="Recent payouts">
            <CanonicalCard variant="list">
              {payouts.length === 0 ? (
                <p className="account-settings-empty">No payouts yet.</p>
              ) : (
                payouts.map((transaction) => (
                  <CanonicalMenuRow
                    key={transaction.id}
                    title={transaction.withdrawMethodLabel ?? "Bank withdrawal"}
                    description={`${transaction.status} · ${formatWalletDate(transaction.createdAt)}`}
                    value={`− ${formatCurrency(Math.abs(transaction.amount))}`}
                    href={`${WALLET_ROUTES.transactions}/${transaction.id}`}
                  />
                ))
              )}
            </CanonicalCard>
          </CanonicalSection>

          <CanonicalSection title="More">
            <CanonicalCard variant="list">
              <CanonicalMenuRow title="All transactions" href={WALLET_ROUTES.transactions} />
            </CanonicalCard>
          </CanonicalSection>

          <CanonicalButtonLink href={WALLET_ROUTES.withdraw} fullWidth>
            Withdraw to bank
          </CanonicalButtonLink>
        </AccountPageStack>
      </div>
    </AccountCanonicalShell>
  );
}
