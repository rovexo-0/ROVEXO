"use client";

import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { CanonicalCard, CanonicalMenuRow, PrimaryButton } from "@/src/components/canonical";
import { ADDRESSES_ROUTE } from "@/lib/addresses/freeze";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

/**
 * Payment Methods route crash recovery — Fail Closed v2.0.
 * Never Retry / Home / technical copy. Soft-render Empty State and stay navigable.
 */
export default function WalletPaymentMethodsError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  void reset;
  return (
    <AccountCanonicalShell
      title="Payment Methods"
      backHref={WALLET_ROUTES.hub}
      backLabel="Balance"
      showHeaderTitle
    >
      <AccountPageStack aria-label="Payment methods">
        <section className="pm-profile__empty" data-pm-empty="true" data-pm-recovery="true">
          <p className="pm-profile__empty-title">No payment methods added yet.</p>
          <p className="pm-profile__empty-copy">Your payment methods are secured by Stripe.</p>
          <PrimaryButton
            onClick={() => {
              window.location.assign(WALLET_ROUTES.paymentMethods);
            }}
            data-pm-cta="add-card"
          >
            Add Card
          </PrimaryButton>
        </section>
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            href={ADDRESSES_ROUTE}
            title="Billing Address"
            description="Manage your billing details."
          />
          <CanonicalMenuRow
            title="Default Payment Method"
            description="Not configured yet."
            showChevron
          />
        </CanonicalCard>
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}
