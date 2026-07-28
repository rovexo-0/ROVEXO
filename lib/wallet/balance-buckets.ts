/**
 * Wallet v2 — derive real ledger rows for Pending / Processing buckets.
 * No invented orders. Empty list when nothing matches.
 */

import type { WalletTransaction } from "@/lib/wallet/types";

/** Pending sales still in hold (not yet available). */
export function pendingOrderTransactions(
  transactions: WalletTransaction[],
): WalletTransaction[] {
  return transactions.filter((tx) => tx.type === "sale" && tx.status === "pending");
}

/** Withdrawals in flight (processing / withdrawing). */
export function processingWithdrawalTransactions(
  transactions: WalletTransaction[],
): WalletTransaction[] {
  return transactions.filter((tx) => tx.type === "withdrawal" && tx.status === "pending");
}

/** Refunds in flight or completed — for Transactions filter honesty. */
export function refundTransactions(transactions: WalletTransaction[]): WalletTransaction[] {
  return transactions.filter((tx) => tx.type === "refund");
}
