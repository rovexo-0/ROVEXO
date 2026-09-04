/**
 * ROVEXO Withdraw lifecycle v1 — Phase 1D (Express + Transfer rail).
 *
 * Canonical accounting (P2 — no Reserved/Locked rewrite):
 *   Available debit
 *   → pending withdrawal (ledger)
 *   → Stripe Transfer (platform → Connect) OR virtual
 *   → awaiting bank payout (pending + stripe_transfer_id)
 *   → completed only when bank payout is confirmed (or virtual completes)
 *
 * Transfer success ≠ bank settlement.
 * stripe_transfer_id = tr_… · stripe_payout_id = po_…
 */

import { isStripePayoutId, isStripeTransferId } from "@/lib/stripe/stripe-object-ids-v1";
import type { WalletTransaction } from "@/lib/wallet/types";

export const WITHDRAW_LIFECYCLE_VERSION = "v1-phase-1d" as const;

export const WITHDRAW_DESC = {
  withdrawing: (idempotencyKey: string) => `withdrawing:${idempotencyKey}`,
  awaitingPayout: (transferId: string) => `awaiting_payout:${transferId}`,
  completedVirtual: (transactionId: string) => `completed_virtual:${transactionId}`,
  completedBank: (payoutId: string) => `completed_bank:${payoutId}`,
  payoutFailed: (payoutId: string, code: string) =>
    `payout_failed:${payoutId}:${code}`,
  rolledBack: (reason: string) => `rolled_back:${reason}`,
} as const;

/** Transfer settled to Connect; bank payout not yet confirmed. */
export function isWithdrawalAwaitingBankPayout(tx: {
  type: string;
  status: string;
  stripeTransferId?: string | null;
  stripePayoutId?: string | null;
  description?: string | null;
}): boolean {
  if (tx.type !== "withdrawal" || tx.status !== "pending") return false;
  if (tx.stripePayoutId && isStripePayoutId(tx.stripePayoutId)) return false;
  if (tx.stripeTransferId && isStripeTransferId(tx.stripeTransferId)) return true;
  return Boolean(tx.description?.startsWith("awaiting_payout:"));
}

/** Bank (or virtual) settlement represented as completed. */
export function isWithdrawalBankSettled(tx: WalletTransaction): boolean {
  return tx.type === "withdrawal" && tx.status === "completed";
}

export const WITHDRAW_ACCOUNTING_SSOT = {
  availableDebit: true,
  reservedLockedRewrite: false,
  transferMeansBankPaid: false,
  bankPaidRequiresPayoutOrVirtual: true,
} as const;
