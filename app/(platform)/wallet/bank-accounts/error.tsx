"use client";

import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { CanonicalCard, CanonicalMenuRow, PrimaryButton } from "@/src/components/canonical";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

/**
 * Bank Accounts route crash recovery — Fail Closed v2 empty-only.
 * Never Retry panel / technical copy. Soft Empty State; stay navigable.
 */
export default function WalletBankAccountsError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  void reset;
  return (
    <AccountCanonicalShell
      title="Bank Accounts"
      backHref={WALLET_ROUTES.hub}
      backLabel="Balance"
      showHeaderTitle
    >
      <AccountPageStack aria-label="Bank accounts">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Personal Account"
            description="Receive money from your sales"
            value="Not added"
            onClick={() => {
              window.location.assign(WALLET_ROUTES.bankAccounts);
            }}
          />
        </CanonicalCard>
        <div className="ba-profile__list" style={{ marginTop: 12 }}>
          <PrimaryButton
            onClick={() => {
              window.location.assign(WALLET_ROUTES.bankAccounts);
            }}
          >
            Add Bank Account
          </PrimaryButton>
        </div>
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}
