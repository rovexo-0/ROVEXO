/**
 * ROVEXO Canonical Money States v1.0
 * AVAILABLE | PENDING | PROCESSING | LOCKED | (+ FAILED / ROLLED BACK on ledger)
 * Unknown states forbidden. Only Available may be withdrawn / shown as Available.
 */

import type { WalletData, WalletTransaction } from "@/lib/wallet/types";
import { roundWalletMoney } from "@/lib/wallet/security";
import { isWithdrawalAwaitingBankPayout } from "@/lib/wallet/withdraw-lifecycle-v1";

export const CANONICAL_MONEY_STATES = [
  "PENDING",
  "LOCKED",
  "VALIDATING",
  "PROCESSING",
  "AVAILABLE",
  "WITHDRAWING",
  "REFUNDING",
  "COMPLETED",
  "FAILED",
  "ROLLED_BACK",
] as const;

export type CanonicalMoneyState = (typeof CANONICAL_MONEY_STATES)[number];

export type WalletBalanceView = {
  /** Money that can be withdrawn now. Never includes pending/processing/locked. */
  available: number;
  /** Money waiting (e.g. sale hold). */
  pending: number;
  /** Money currently moving (e.g. withdrawal in flight). */
  processing: number;
  /** Money blocked (claims / locks). */
  locked: number;
};

/** Derive display balances — Available is withdrawable only. */
export function resolveWalletBalanceView(data: WalletData): WalletBalanceView {
  const processing = roundWalletMoney(data.withdrawalSummary.processingTotal);
  return {
    available: roundWalletMoney(Math.max(0, data.availableBalance)),
    pending: roundWalletMoney(Math.max(0, data.pendingBalance)),
    processing: Math.max(0, processing),
    locked: roundWalletMoney(Math.max(0, data.lockedBalance ?? 0)),
  };
}

/** Map ledger row to canonical state label (audit / UI badges). */
export function resolveTransactionMoneyState(tx: WalletTransaction): CanonicalMoneyState {
  if (tx.type === "withdrawal") {
    if (tx.status === "pending") {
      // Transfer to Connect done, bank payout not confirmed — still withdrawing.
      if (isWithdrawalAwaitingBankPayout(tx)) return "WITHDRAWING";
      return "WITHDRAWING";
    }
    if (tx.status === "failed") return "ROLLED_BACK";
    if (tx.status === "completed") return "COMPLETED";
  }
  if (tx.type === "refund") {
    if (tx.status === "pending") return "REFUNDING";
    if (tx.status === "failed") return "FAILED";
    if (tx.status === "completed") return "COMPLETED";
  }
  if (tx.type === "sale") {
    if (tx.status === "pending") return "PENDING";
    if (tx.status === "refunded") return "ROLLED_BACK";
    if (tx.status === "completed") return "COMPLETED";
    if (tx.status === "failed") return "FAILED";
  }
  if (tx.status === "pending") return "PROCESSING";
  if (tx.status === "failed") return "FAILED";
  if (tx.status === "refunded") return "ROLLED_BACK";
  return "COMPLETED";
}

/** Profile row copy — Available only. */
export function formatAvailableBalanceLabel(available: number): string {
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(available);
  return `${formatted} Available`;
}
