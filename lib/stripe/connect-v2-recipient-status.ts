/**
 * ROVEXO Connect Accounts V2 — recipient status mapping (pure).
 *
 * Maps Stripe V2 Core Account → ROVEXO Connect booleans.
 * Recipient-only architecture: platform is Merchant of Record.
 * chargesEnabled is always false unless a merchant configuration is explicitly applied
 * (ROVEXO does not use seller MoR).
 *
 * No Stripe network I/O. Unit-testable.
 */

import type Stripe from "stripe";

export type RovexoConnectStatus = {
  /** Recipient onboarding/configuration complete enough for Connect use. */
  connected: boolean;
  /** stripe_balance.payouts capability is active. */
  payoutsEnabled: boolean;
  /**
   * Seller MoR card charges. Always false for recipient-only accounts.
   * Never inferred from payouts/transfers.
   */
  chargesEnabled: boolean;
};

/** Includes required for deterministic Connect status from V2 retrieve. */
export const V2_CONNECT_STATUS_INCLUDES = [
  "configuration.recipient",
  "requirements",
] as const satisfies ReadonlyArray<
  Stripe.V2.Core.AccountRetrieveParams.Include
>;

type V2Account = Stripe.V2.Core.Account;
type RequirementEntry = NonNullable<
  NonNullable<V2Account["requirements"]>["entries"]
>[number];

function isBlockingRecipientRequirement(entry: RequirementEntry): boolean {
  if (entry.awaiting_action_from !== "user") {
    return false;
  }
  const deadline = entry.minimum_deadline?.status;
  if (deadline !== "currently_due" && deadline !== "past_due") {
    return false;
  }
  const restricts = entry.impact?.restricts_capabilities ?? [];
  if (restricts.length === 0) {
    // Conservative: any user currently_due / past_due requirement blocks connected.
    return true;
  }
  return restricts.some((cap) => cap.configuration === "recipient");
}

function hasBlockingRecipientRequirements(account: V2Account): boolean {
  const entries = account.requirements?.entries ?? [];
  return entries.some(isBlockingRecipientRequirement);
}

/**
 * Deterministic V2 → ROVEXO Connect status mapping.
 *
 * - connected: recipient configuration applied AND no blocking user requirements
 * - payoutsEnabled: recipient stripe_balance.payouts status === active
 * - chargesEnabled: false for recipient-only (merchant MoR not used)
 */
export function mapV2RecipientStatus(account: V2Account): RovexoConnectStatus {
  const recipient = account.configuration?.recipient;
  const recipientApplied = recipient?.applied === true;
  const inAppliedList = (account.applied_configurations ?? []).includes("recipient");
  const recipientConfigured = recipientApplied && (inAppliedList || recipient != null);

  const payoutStatus =
    recipient?.capabilities?.stripe_balance?.payouts?.status ?? null;
  const payoutsEnabled = payoutStatus === "active";

  // Recipient-only: never report seller charges as enabled.
  // Merchant configuration is out of scope for ROVEXO Connect V2 recipient accounts.
  const chargesEnabled = false;

  const connected =
    recipientConfigured && !hasBlockingRecipientRequirements(account);

  return {
    connected,
    payoutsEnabled,
    chargesEnabled,
  };
}
