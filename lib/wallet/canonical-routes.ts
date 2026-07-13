/**
 * ROVEXO Wallet — canonical routes v1.0
 * Single source of truth for payment methods, bank account, and payouts.
 */

export const WALLET_CANONICAL_VERSION = "v1.0-canonical" as const;

export const WALLET_ROUTES = {
  hub: "/wallet",
  paymentMethods: "/wallet/payment-methods",
  bankAccount: "/wallet/bank-account",
  withdraw: "/wallet/withdraw",
  transactions: "/wallet/transactions",
  payouts: "/wallet/payouts",
} as const;

export function walletRouteWithReturn(path: string, returnTo: string | null): string {
  return returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path;
}
