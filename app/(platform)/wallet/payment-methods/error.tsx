"use client";

import { AccountCanonicalShell, AccountPageStack } from "@/features/account-canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { CanonicalCard, CanonicalMenuRow, PrimaryButton } from "@/src/components/canonical";
import { ADDRESSES_ROUTE } from "@/lib/addresses/freeze";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import "@/styles/rovexo/payment-methods-v4.css";

/**
 * Payment Methods route crash recovery — Empty State Freeze.
 * Soft-render compact empty state. Never permanent paused banner / Retry panel.
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
      <div className="pm-profile" data-pm-recovery="true">
        <AccountPageStack className="pm-profile__stack" aria-label="Payment methods">
          <section className="pm-profile__empty" data-pm-empty="true">
            <span className="pm-profile__empty-icon" aria-hidden>
              <AccountIcon name="payment" className="pm-profile__empty-icon-svg" />
            </span>
            <p className="pm-profile__empty-title">No cards added yet</p>
            <p className="pm-profile__empty-copy">Add a card for faster checkout.</p>
            <PrimaryButton
              onClick={() => {
                window.location.assign(WALLET_ROUTES.paymentMethods);
              }}
              data-pm-cta="add-new-card"
            >
              Add New Card
            </PrimaryButton>
          </section>
          <CanonicalCard variant="list" className="pm-profile__list">
            <CanonicalMenuRow
              title="Default Payment Method"
              description="Not configured yet."
              showChevron={false}
            />
            <CanonicalMenuRow
              href={ADDRESSES_ROUTE}
              title="Billing Address"
              description="Manage your billing details."
            />
          </CanonicalCard>
          <p className="pm-profile__stripe-footer">🛡 Secured by Stripe</p>
        </AccountPageStack>
      </div>
    </AccountCanonicalShell>
  );
}
