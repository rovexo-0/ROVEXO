/**
 * ROVEXO Smart Visibility Engine v1.0 — SSOT (Master Engine lock).
 *
 * PRODUCTION_READY = true
 * ACTIVE only after `activateProductionRules()` on the Master Engine.
 *
 * Golden Rule: production predicates live ONLY in `registerSmartFeature()`.
 * This engine aggregates `resolveFeatureVisibility` / registry — never duplicates rules.
 *
 * Payment Methods + Personal Bank: always visible (local + production).
 * Withdraw: always visible; disabled when no money; blocked by money/security when active.
 */

import { isSmartPlatformProductionActive } from "@/lib/smart-platform/mode";
import {
  getSmartFeature,
  resolveFeatureVisibility,
  type SmartFeatureContext,
  type SmartFeatureId,
} from "@/lib/smart-platform/features";

export const SMART_VISIBILITY_ENGINE_VERSION = "v1.0" as const;
export const SMART_VISIBILITY_PRODUCTION_READY = true as const;

/** Legacy flag — runtime activation owned by Master Engine `activateProductionRules()`. */
export const SMART_VISIBILITY_ENGINE_ACTIVE: boolean = false;

export type SmartVisibilityInput = {
  activeListingCount: number;
  isBusinessVerified: boolean;
  hasPaymentMethod?: boolean;
  isRovexoVerified?: boolean;
  availableBalance?: number;
  hasTransactions?: boolean;
};

export type SmartVisibilityState = {
  showHolidayMode: boolean;
  showPromoteListings: boolean;
  showBusinessBankAccount: boolean;
  /** Always true — Payment Methods visible for every user. */
  showPaymentMethods: boolean;
  /** Always true — Personal Bank visible for every user. */
  showPersonalBankAccount: boolean;
  /** Withdraw control visible (may be disabled/blocked separately). */
  showWithdraw: boolean;
  allowVerifiedBadge: boolean;
  showTransactionsEmptyState: boolean;
  disableWithdrawForZeroBalance: boolean;
};

function toFeatureContext(input: SmartVisibilityInput): SmartFeatureContext {
  return {
    activeListingCount: input.activeListingCount,
    isBusinessVerified: input.isBusinessVerified,
    isRovexoVerified: Boolean(input.isRovexoVerified),
    hasPaymentMethod: input.hasPaymentMethod,
    availableBalance: input.availableBalance,
    hasTransactions: input.hasTransactions,
  };
}

/** Pure production predicate from the feature registry (no mode short-circuit). */
function productionAvailable(featureId: SmartFeatureId, ctx: SmartFeatureContext): boolean {
  const feature = getSmartFeature(featureId);
  if (!feature) return false;
  return feature.isAvailableInProduction(ctx);
}

/** Development / QA / certification — every surface visible. */
export function showEverythingVisibility(input?: Partial<SmartVisibilityInput>): SmartVisibilityState {
  void input;
  return {
    showHolidayMode: true,
    showPromoteListings: true,
    showBusinessBankAccount: true,
    showPaymentMethods: true,
    showPersonalBankAccount: true,
    showWithdraw: true,
    allowVerifiedBadge: true,
    showTransactionsEmptyState: true,
    /** Withdraw Button v3.0 — never disable hub CTA; zero balance → empty page. */
    disableWithdrawForZeroBalance: false,
  };
}

/**
 * Production rules (Master Engine lock — inactive until activateProductionRules).
 * Implemented exclusively via registered smart features — no inline listing/verified checks.
 */
export function applyProductionVisibilityRules(input: SmartVisibilityInput): SmartVisibilityState {
  const ctx = toFeatureContext(input);

  return {
    showHolidayMode: productionAvailable("holiday-mode", ctx),
    showPromoteListings: productionAvailable("promote-listings", ctx),
    showBusinessBankAccount: productionAvailable("business-bank-account", ctx),
    showPaymentMethods: productionAvailable("payment-methods", ctx),
    showPersonalBankAccount: productionAvailable("personal-bank-account", ctx),
    showWithdraw: productionAvailable("withdraw", ctx),
    allowVerifiedBadge: productionAvailable("verified-badge", ctx),
    showTransactionsEmptyState: productionAvailable("transactions-empty-state", {
      ...ctx,
      hasTransactions: input.hasTransactions ?? false,
    }),
    /** Withdraw Button v3.0 — never disable hub CTA; zero balance → empty page. */
    disableWithdrawForZeroBalance: false,
  };
}

export function isSmartVisibilityEngineActive(): boolean {
  return isSmartPlatformProductionActive();
}

/**
 * Batch visibility snapshot for menus.
 * Local → SHOW EVERYTHING. Production → registry predicates only.
 */
export function resolveSmartVisibility(input: SmartVisibilityInput): SmartVisibilityState {
  if (!isSmartVisibilityEngineActive()) {
    return showEverythingVisibility(input);
  }
  return applyProductionVisibilityRules(input);
}

/**
 * @deprecated Prefer `resolveVerifiedStatus` from `@/lib/master-engine`.
 * Kept as a thin adapter for legacy callers.
 */
export function shouldRenderVerifiedBadge(isVerified: boolean): boolean {
  if (!isVerified) return false;
  return resolveFeatureVisibility("verified-badge", {
    isRovexoVerified: true,
  }).visible;
}
