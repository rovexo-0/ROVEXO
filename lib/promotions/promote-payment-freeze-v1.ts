/**
 * ROVEXO Promote Payment System v1.0 — PERMANENT FREEZE (SSOT).
 *
 * Canonical payment rules for Bump · Store Showcase · Boost.
 * Optimize existing implementation only — no redesign · no parallel systems.
 */

export const PROMOTE_PAYMENT_FREEZE_VERSION = "v1.0" as const;
export const PROMOTE_PAYMENT_FREEZE_STATUS = "PERMANENTLY_LOCKED" as const;

/** Allowed payment methods only. */
export const PROMOTE_PAYMENT_METHODS = ["wallet", "default_card"] as const;

export const PROMOTE_PAYMENT_FREEZE_RULES = {
  instantActivation: true,
  noRefunds: true,
  noCancellation: true,
  noTimerReset: true,
  noTimerPause: true,
  noTimerExtension: true,
  noPromotionTransfer: true,
  walletPaymentAllowed: true,
  defaultSavedCardAllowed: true,
  notificationsEnabled: true,
  timerStartsImmediately: true,
  paymentsToRovexoProfitWallet: true,
  deletedListingsDoNotStopTimer: true,
  suspendedAccountsDoNotStopTimer: true,
  hiddenListingsDoNotStopTimer: true,
  promotionExpiresAutomatically: true,
  compactPremiumUiUnchanged: true,
  noEscrow: true,
  noHold: true,
  noProcessingDelays: true,
} as const;

export const PROMOTE_PAYMENT_NO_METHOD_COPY = "No payment method available." as const;

export const PROMOTE_PAYMENT_CONTINUE_LABEL = "Continue" as const;
export const PROMOTE_PAYMENT_PROCESSING_LABEL = "Processing payment…" as const;

export function getPromotePaymentFreezeSnapshot() {
  return {
    version: PROMOTE_PAYMENT_FREEZE_VERSION,
    status: PROMOTE_PAYMENT_FREEZE_STATUS,
    methods: PROMOTE_PAYMENT_METHODS,
    rules: PROMOTE_PAYMENT_FREEZE_RULES,
  };
}
