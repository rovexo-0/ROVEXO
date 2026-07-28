/**
 * ROVEXO Wallet Financial Engine — canonical routes
 * Blood XIII Sprint IV: user hub = `/wallet` (title remains Balance).
 * Child engine routes remain under `/wallet/*`.
 */

export const WALLET_CANONICAL_VERSION = "v2.2-wallet-hub-blood-xiii" as const;

export const WALLET_ROUTES = {
  /** Canonical user-facing Wallet hub (Blood XIII). Visible title = Balance. */
  hub: "/wallet",
  paymentMethods: "/wallet/payment-methods",
  /** Bank Accounts hub — Personal + Business (SSOT). */
  bankAccounts: "/wallet/bank-accounts",
  /**
   * Legacy singular path — permanently redirects to bankAccounts.
   * Prefer WALLET_ROUTES.bankAccounts for new links.
   */
  bankAccount: "/wallet/bank-account",
  pending: "/wallet/pending",
  processing: "/wallet/processing",
  locked: "/wallet/locked",
  withdraw: "/wallet/withdraw",
  transactions: "/wallet/transactions",
  payouts: "/wallet/payouts",
  statements: "/wallet/statements",
} as const;


export function walletRouteWithReturn(path: string, returnTo: string | null): string {
  return returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path;
}
