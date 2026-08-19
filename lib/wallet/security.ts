/**
 * ROVEXO Wallet Security Certification v1.0 — money-safety primitives.
 * Zero money loss · atomic-friendly helpers · idempotency keys.
 */

export function roundWalletMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Canonical withdraw idempotency key (user + method + amount + client key). */
export function buildWithdrawIdempotencyKey(input: {
  userId: string;
  methodId: string;
  amount: number;
  clientKey?: string | null;
}): string {
  const amount = roundWalletMoney(input.amount).toFixed(2);
  const client = (input.clientKey ?? "").trim() || "default";
  return `withdraw:${input.userId}:${input.methodId}:${amount}:${client}`;
}

export function buildSaleIdempotencyKey(orderNumber: string, sellerId: string): string {
  return `sale:${sellerId}:${orderNumber}`;
}

export function buildRefundIdempotencyKey(orderId: string, sellerId: string): string {
  return `refund:${sellerId}:${orderId}`;
}

export function buildRefundDescription(orderId: string): string {
  return `order:${orderId}`;
}

/** Buyer wallet-credit destination — never pair with a Stripe card refund (`re_`). */
export const ROVEXO_WALLET_REFUND_METHOD = "ROVEXO Wallet";

export function buildBuyerRefundIdempotencyKey(refundId: string): string {
  return `buyer-refund:${refundId}`;
}

export function buildBuyerRefundDescription(orderId: string, refundId: string): string {
  return `buyer-refund:order:${orderId}|refund:${refundId}`;
}

export function isStripeCardRefundReference(refundId: string): boolean {
  return refundId.startsWith("re_");
}

/** True only for the ROVEXO wallet-credit path. Stripe card refunds are excluded. */
export function isRovexoWalletRefundCreditEligible(input: {
  refundId: string;
  paymentMethod?: string | null;
}): boolean {
  if (!input.refundId || isStripeCardRefundReference(input.refundId)) {
    return false;
  }
  if (input.paymentMethod === "Original payment method") {
    return false;
  }
  return (
    input.paymentMethod === ROVEXO_WALLET_REFUND_METHOD ||
    input.refundId.startsWith("wallet-refund-") ||
    input.refundId.startsWith("virtual-refund-")
  );
}

/** Safe failure: never debit when amount is non-positive or exceeds available. */
export function canDebitAvailable(available: number, amount: number): boolean {
  const a = roundWalletMoney(available);
  const d = roundWalletMoney(amount);
  return d > 0 && a >= d;
}

/** One debit per Checkout Session — Confirm & Pay retries must not charge twice. */
export function buildBuyerCheckoutDebitIdempotencyKey(
  checkoutSessionPublicId: string,
): string {
  return `buyer-checkout:${checkoutSessionPublicId.trim()}`;
}

/**
 * Capture-proof prefix required by `lib/stripe/refunds.ts` (commit 522847aa).
 * Do not change without updating that capture verifier.
 */
export const WALLET_CHECKOUT_DEBIT_DESCRIPTION_PREFIX = "Virtual payment for order ";

export function buildBuyerCheckoutDebitDescription(input: {
  orderNumber: string;
  sessionId: string;
}): string {
  return `${WALLET_CHECKOUT_DEBIT_DESCRIPTION_PREFIX}${input.orderNumber} (${input.sessionId})`;
}

/** Wallet checkout eligibility: available must cover the locked payable total. */
export function isWalletCheckoutEligible(
  available: number,
  lockedPayableTotal: number,
): boolean {
  return canDebitAvailable(available, lockedPayableTotal);
}

/** Remaining available after debiting the locked payable total. Null if ineligible. */
export function remainingAfterWalletCheckoutDebit(
  available: number,
  lockedPayableTotal: number,
): number | null {
  if (!isWalletCheckoutEligible(available, lockedPayableTotal)) return null;
  return roundWalletMoney(roundWalletMoney(available) - roundWalletMoney(lockedPayableTotal));
}
