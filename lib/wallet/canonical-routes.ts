/**
 * ROVEXO Wallet Financial Engine — canonical routes
 * Blood XIII Sprint IV: user hub = `/wallet` (title remains Balance).
 * Child engine routes remain under `/wallet/*`.
 * Business Balance hub = `/business/wallet` (separate financial context).
 */

import type { SellerContext } from "@/lib/seller-context/seller-context-v1";

export const WALLET_CANONICAL_VERSION = "v2.2-wallet-hub-blood-xiii" as const;

export const WALLET_ROUTES = {
  /** Canonical user-facing Wallet hub (Blood XIII). Visible title = Balance. */
  hub: "/wallet",
  /** Business Balance hub — wallet_context=business. */
  businessHub: "/business/wallet",
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
  /** Individual withdraw — sellerContext=individual. */
  withdraw: "/wallet/withdraw",
  /** Business withdraw — same engine, sellerContext=business. */
  businessWithdraw: "/business/wallet/withdraw",
  transactions: "/wallet/transactions",
  businessTransactions: "/business/wallet/transactions",
  payouts: "/wallet/payouts",
  statements: "/wallet/statements",
} as const;

/** Withdraw entry for the active wallet context — never silent default across contexts. */
export function withdrawRouteForSellerContext(context: SellerContext): string {
  return context === "business" ? WALLET_ROUTES.businessWithdraw : WALLET_ROUTES.withdraw;
}

export function walletHubRouteForSellerContext(context: SellerContext): string {
  return context === "business" ? WALLET_ROUTES.businessHub : WALLET_ROUTES.hub;
}

export function walletTransactionsRouteForSellerContext(context: SellerContext): string {
  return context === "business" ? WALLET_ROUTES.businessTransactions : WALLET_ROUTES.transactions;
}

export function walletBankAccountsRouteForSellerContext(context: SellerContext): string {
  return context === "business"
    ? `${WALLET_ROUTES.bankAccounts}?sellerContext=business`
    : WALLET_ROUTES.bankAccounts;
}

export function walletRouteWithReturn(path: string, returnTo: string | null): string {
  return returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path;
}
