/**
 * TRANSACTION_HUB_MASTER_SPEC v1.0 — Document 3 SSOT
 * Seller Wallet • Payment Hold • Payout Engine
 */

import { DELIVERED_RELEASE_HOURS } from "@/lib/commerce-engine/escrow-constants";
import { PLATFORM_FEE_RATE } from "@/lib/orders/pricing";
import type { WalletData, WalletTransaction } from "@/lib/wallet/types";

export const SELLER_WALLET_VERSION = "v1.0" as const;

/** Buyer protection hold after delivery before auto-release. */
export const BUYER_PROTECTION_HOURS = DELIVERED_RELEASE_HOURS;

export const SELLER_WALLET_SECTIONS = [
  "available_balance",
  "pending_balance",
  "processing_withdrawals",
  "completed_withdrawals",
  "transaction_history",
] as const;

export const SELLER_WALLET_COPY = {
  availableBalance: "Available Balance",
  pendingBalance: "Pending",
  pendingReason: "Waiting for successful delivery.",
  processingWithdrawals: "Processing Withdrawals",
  completedWithdrawals: "Completed Withdrawals",
  transactionHistory: "Transaction History",
  fundsPendingTitle: "Funds pending",
  fundsReleasedTitle: "Funds are now available",
  withdrawFunds: "Withdraw Funds",
  keepInWallet: "Funds may stay in your Wallet until you choose to withdraw.",
  platformFeeBuyerOnly:
    "Platform Fee is paid by the buyer only and never enters your Seller Wallet.",
} as const;

export const WALLET_TRANSACTION_CATEGORIES = {
  incoming: "Incoming Funds",
  released: "Released Funds",
  withdrawal: "Withdrawals",
  refund: "Refunds",
  adjustment: "Adjustments",
  promotion: "Promotion Payments",
} as const;

export type SellerWalletSection = (typeof SELLER_WALLET_SECTIONS)[number];

/** Platform fee never enters seller wallet — buyer-paid only. */
export function sellerReceivesFullListingPrice(itemPrice: number): number {
  return Math.round(itemPrice * 100) / 100;
}

export function platformFeeFromBuyer(itemPrice: number): number {
  return Math.round(itemPrice * PLATFORM_FEE_RATE * 100) / 100;
}

export type SellerWalletWithdrawalSummary = {
  processingTotal: number;
  processingCount: number;
  completedTotal: number;
  completedCount: number;
};

export function summarizeWalletWithdrawals(
  transactions: WalletTransaction[],
): SellerWalletWithdrawalSummary {
  let processingTotal = 0;
  let processingCount = 0;
  let completedTotal = 0;
  let completedCount = 0;

  for (const tx of transactions) {
    if (tx.type !== "withdrawal") continue;
    const amount = Math.abs(tx.amount);
    if (tx.status === "pending" || tx.status === "failed") {
      processingTotal += amount;
      processingCount += 1;
      continue;
    }
    if (tx.status === "completed") {
      completedTotal += amount;
      completedCount += 1;
    }
  }

  return {
    processingTotal: Math.round(processingTotal * 100) / 100,
    processingCount,
    completedTotal: Math.round(completedTotal * 100) / 100,
    completedCount,
  };
}

/** Released to bank via Stripe Connect (not manual withdraw ledger). */
export function resolveReleasedToBankBalance(data: WalletData): number {
  return data.paidOutBalance;
}

/** Manual withdraw balance — seller is never forced to withdraw. */
export function resolveManualWithdrawableBalance(data: WalletData): number {
  return data.availableBalance;
}

export function walletTransactionCategory(
  transaction: WalletTransaction,
): string {
  if (transaction.type === "sale") {
    return transaction.status === "pending"
      ? WALLET_TRANSACTION_CATEGORIES.incoming
      : WALLET_TRANSACTION_CATEGORIES.released;
  }
  if (transaction.type === "withdrawal") return WALLET_TRANSACTION_CATEGORIES.withdrawal;
  if (transaction.type === "refund") return WALLET_TRANSACTION_CATEGORIES.refund;
  if (transaction.type === "promotion") return WALLET_TRANSACTION_CATEGORIES.promotion;
  return WALLET_TRANSACTION_CATEGORIES.adjustment;
}
