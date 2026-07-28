/**
 * ROVEXO Withdraw Page v7.0 FINAL — Absolute Authority · FROZEN
 * Allowed states ONLY: loading · empty · functional · success
 * Soft fails → empty (“No funds available.”). Never alternate soft-fail copy.
 * Never Retry · Home · icons · technical / API messages.
 */

import type { WalletData } from "@/lib/wallet/types";
import { resolveWalletBalanceView } from "@/lib/wallet/money-states";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export const WITHDRAW_PAGE_VERSION = "v7.1" as const;
export const WITHDRAW_PAGE_DOM = "v7.1-final-frozen" as const;
export const WITHDRAW_PAGE_FREEZE = "FROZEN" as const;
export const WITHDRAW_HUB_BUTTON_RULE = "ALWAYS_OPEN" as const;

export type WithdrawPageState = "loading" | "empty" | "functional" | "success";

export type WithdrawSoftFail = "stripe" | "supabase" | "api" | "network" | "bank" | null;

export type WithdrawPageView = {
  state: WithdrawPageState;
  available: number;
  hasBankAccount: boolean;
  bankHref: string;
  walletHref: string;
  estimatedArrival: string;
  withdrawEnabled: boolean;
  softMessage: string | null;
};

export const WITHDRAW_SOFT_COPY = {
  noFunds: "No funds available.",
  overMax: "Maximum available amount exceeded.",
  bankTitle: "No bank account added.",
  bankBody: "Please add a bank account to continue.",
  successTitle: "Withdrawal Successful",
  amountLabel: "Amount:",
  estimatedArrivalLabel: "Estimated arrival",
  estimatedArrivalValue: "1-3 business days",
} as const;

export function createEmptyWalletData(): WalletData {
  return {
    availableBalance: 0,
    pendingBalance: 0,
    pendingAvailableAt: new Date(0).toISOString(),
    lockedBalance: 0,
    paidOutBalance: 0,
    pendingOrderCount: 0,
    withdrawalSummary: {
      processingTotal: 0,
      processingCount: 0,
      completedTotal: 0,
      completedCount: 0,
    },
    monthSummary: {
      revenue: { value: 0, changePercent: 0 },
      withdrawn: { value: 0, changePercent: 0 },
      fees: { value: 0, changePercent: 0 },
    },
    transactions: [],
    withdrawMethods: [],
    connectStatus: { connected: false, payoutsEnabled: false },
  };
}

export function resolveWithdrawPageState(
  data: WalletData,
  options?: {
    success?: boolean;
    loading?: boolean;
    softFail?: WithdrawSoftFail;
  },
): WithdrawPageState {
  if (options?.loading) return "loading";
  if (options?.success) return "success";
  // Stripe / API / DB / network / bank soft fails → empty only (Owner v7)
  if (options?.softFail) return "empty";

  const balances = resolveWalletBalanceView(data);
  if (balances.available <= 0) return "empty";
  return "functional";
}

export function buildWithdrawPageView(
  data: WalletData,
  options?: {
    success?: boolean;
    loading?: boolean;
    softFail?: WithdrawSoftFail;
  },
): WithdrawPageView {
  const balances = resolveWalletBalanceView(data);
  const available = options?.softFail ? 0 : Math.max(0, balances.available);
  const connected = data.withdrawMethods.find((method) => method.connected) ?? null;
  const state = resolveWithdrawPageState(data, options);

  return {
    state,
    available,
    hasBankAccount: Boolean(connected),
    bankHref: `${WALLET_ROUTES.bankAccounts}?returnTo=${encodeURIComponent(WALLET_ROUTES.withdraw)}`,
    walletHref: WALLET_ROUTES.hub,
    estimatedArrival: WITHDRAW_SOFT_COPY.estimatedArrivalValue,
    withdrawEnabled: available > 0 && state === "functional",
    softMessage: state === "empty" ? WITHDRAW_SOFT_COPY.noFunds : null,
  };
}

/** True when raw input exceeds available (before clamp). */
export function isWithdrawAmountOverMax(raw: string, maxAmount: number): boolean {
  const normalized = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return false;
  return parsed > maxAmount;
}
