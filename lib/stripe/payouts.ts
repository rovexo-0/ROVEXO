import { mustUseVirtualWallet } from "@/lib/full-demo/security";

/**
 * Stripe E2E Canonical — sale Connect Transfer path is PERMANENTLY DISABLED.
 *
 * Canonical money path:
 *   Release → Available (ledger) → Seller Withdraw → Stripe Transfer/Payout → Bank
 *
 * Historical stripe_transfer_id values on wallet_transactions are preserved.
 * Manual Withdraw uses `lib/stripe/withdraw-payout.ts` only.
 *
 * `mustUseVirtualWallet` remains referenced so Full Demo never routes sale
 * funds through live Connect Transfers if this module is inspected or called.
 */

export type TransferSalePayoutResult =
  | { success: true; transferId: string }
  | { success: false; error: string; retryable: boolean };

/** Permanent disable marker — regression tests assert this string. */
export const LEGACY_SALE_CONNECT_TRANSFER_DISABLED =
  "legacy_sale_connect_transfer_disabled" as const;

/**
 * @deprecated Automatic / release-time sale Connect transfers are forbidden.
 * Always fails closed. Do not call from Release or cron.
 */
export async function transferSalePayoutToConnect(_input: {
  saleTransactionId: string;
  userId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  connectAccountId: string;
}): Promise<TransferSalePayoutResult> {
  // Keep Full Demo virtual-wallet contract visible on this module.
  void mustUseVirtualWallet();
  return {
    success: false,
    error: LEGACY_SALE_CONNECT_TRANSFER_DISABLED,
    retryable: false,
  };
}

/**
 * @deprecated Automatic sale payouts are forbidden under Stripe E2E Canonical.
 * Always returns 0 and never creates a Connect Transfer.
 * Cron must use CommerceEngine.releaseEligiblePendingBalances → Release to Available.
 */
export async function processAutomaticSellerPayouts(): Promise<number> {
  void mustUseVirtualWallet();
  return 0;
}
