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

/** Safe failure: never debit when amount is non-positive or exceeds available. */
export function canDebitAvailable(available: number, amount: number): boolean {
  const a = roundWalletMoney(available);
  const d = roundWalletMoney(amount);
  return d > 0 && a >= d;
}
