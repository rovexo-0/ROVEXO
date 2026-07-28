/**
 * Balance page v1.0 — Owner Canonical Implementation Contract.
 * Profile = master design system. Only financial content/components differ.
 */

import type { WalletData } from "@/lib/wallet/types";
import { resolveWalletBalanceView } from "@/lib/wallet/money-states";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export const BALANCE_PAGE_NAME = "Balance" as const;
export const BALANCE_UI_VERSION = "v1.0" as const;
export const BALANCE_UI_DOM = "v1.0-balance-lock" as const;

/** Owner-locked Available card states. */
export type BalanceAvailableState = "available" | "zero" | "processing" | "locked";

export type BalanceHubView = {
  available: number;
  pending: number;
  processing: number;
  locked: number;
  pendingOrderCount: number;
  processingWithdrawalCount: number;
  availableState: BalanceAvailableState;
  canWithdraw: boolean;
  availableHint: string;
  withdrawDisabledReason: string | null;
  pendingHref: string;
  processingHref: string;
  lockedHref: string;
  withdrawHref: string;
};

/**
 * Withdraw Button v3.0 (Absolute Authority):
 * Hub Withdraw is ALWAYS open (never disabled).
 * canWithdraw = has live funds for the functional withdraw form (page state only).
 * ZERO / PROCESSING / LOCKED → page empty or processing — button still opens.
 */
export function resolveBalanceAvailableState(data: WalletData): {
  state: BalanceAvailableState;
  canWithdraw: boolean;
  hint: string;
  reason: string | null;
} {
  const balances = resolveWalletBalanceView(data);

  if (balances.available <= 0) {
    return {
      state: "zero",
      canWithdraw: false,
      hint: "Available to withdraw",
      reason: null,
    };
  }

  if (data.withdrawalSummary.processingCount > 0) {
    return {
      state: "processing",
      canWithdraw: false,
      hint: "Bank Processing",
      reason: null,
    };
  }

  if (balances.locked > 0) {
    return {
      state: "locked",
      canWithdraw: false,
      hint: "Security Lock",
      reason: null,
    };
  }

  return {
    state: "available",
    canWithdraw: true,
    hint: "Available to withdraw",
    reason: null,
  };
}

/** @deprecated Use resolveBalanceAvailableState — kept for callers expecting canWithdraw only. */
export function resolveBalanceWithdrawState(data: WalletData): {
  canWithdraw: boolean;
  reason: string | null;
} {
  const resolved = resolveBalanceAvailableState(data);
  return { canWithdraw: resolved.canWithdraw, reason: resolved.reason };
}

export function buildBalanceHubView(
  data: WalletData,
  options?: { pendingOrderCount?: number },
): BalanceHubView {
  const balances = resolveWalletBalanceView(data);
  const available = resolveBalanceAvailableState(data);
  const pendingOrderCount =
    options?.pendingOrderCount ??
    data.pendingOrderCount ??
    data.transactions.filter((tx) => tx.type === "sale" && tx.status === "pending").length;

  return {
    available: balances.available,
    pending: balances.pending,
    processing: balances.processing,
    locked: balances.locked,
    pendingOrderCount,
    processingWithdrawalCount: data.withdrawalSummary.processingCount,
    availableState: available.state,
    canWithdraw: available.canWithdraw,
    availableHint: available.hint,
    withdrawDisabledReason: available.reason,
    pendingHref: WALLET_ROUTES.pending,
    processingHref: WALLET_ROUTES.processing,
    lockedHref: WALLET_ROUTES.locked,
    withdrawHref: WALLET_ROUTES.withdraw,
  };
}

export function formatOrderCountLabel(count: number): string {
  if (count <= 0) return "No orders";
  return count === 1 ? "1 Order" : `${count} Orders`;
}

export function formatWithdrawalCountLabel(count: number): string {
  if (count <= 0) return "No withdrawals";
  return count === 1 ? "1 Withdrawal" : `${count} Withdrawals`;
}
