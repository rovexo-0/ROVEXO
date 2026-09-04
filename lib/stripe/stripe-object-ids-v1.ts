/**
 * Stripe object ID helpers — Transfer (tr_) vs Payout (po_) separation.
 * Never write a payout id into stripe_transfer_id.
 * Legacy mis-writes are reported, never silently rewritten.
 */

export function isStripeTransferId(id: string | null | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  const v = id.trim();
  return (
    v.startsWith("tr_") ||
    v.startsWith("demo_withdraw_") ||
    v.startsWith("dev_withdraw_")
  );
}

export function isStripePayoutId(id: string | null | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  return id.trim().startsWith("po_");
}

/**
 * Detect legacy rows where a payout id was stored in the transfer column.
 * Callers must report for reconciliation — do not rewrite historical data here.
 */
export function isLegacyPayoutIdInTransferColumn(
  stripeTransferId: string | null | undefined,
): boolean {
  return isStripePayoutId(stripeTransferId);
}

export type LegacyTransferColumnReport = {
  transactionId: string;
  stripeTransferId: string;
  issue: "payout_id_in_transfer_column";
};

export function reportLegacyPayoutIdInTransferColumn(input: {
  transactionId: string;
  stripeTransferId: string | null | undefined;
}): LegacyTransferColumnReport | null {
  if (!isLegacyPayoutIdInTransferColumn(input.stripeTransferId)) {
    return null;
  }
  return {
    transactionId: input.transactionId,
    stripeTransferId: input.stripeTransferId!.trim(),
    issue: "payout_id_in_transfer_column",
  };
}
