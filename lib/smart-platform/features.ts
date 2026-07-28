/**
 * ROVEXO Global Smart Platform Engine v1.0 — Smart Feature Engine.
 *
 * GOLDEN RULE: every feature registers here. UI never inlines production predicates.
 * Future features: registerSmartFeature() → resolveFeatureVisibility() → automatic rules.
 */

import { isSmartPlatformProductionActive, isSmartPlatformShowEverythingMode } from "@/lib/smart-platform/mode";

export type SmartFeatureId = string;

export type SmartFeatureDefinition = {
  id: SmartFeatureId;
  /** Human label for docs / QA. */
  label: string;
  /**
   * Production availability predicate.
   * Called only when the platform is production-active.
   * Return true to SHOW, false to HIDE (never delete the feature).
   */
  isAvailableInProduction: (ctx: SmartFeatureContext) => boolean;
};

export type SmartFeatureContext = {
  userId?: string | null;
  activeListingCount?: number;
  isBusinessVerified?: boolean;
  isRovexoVerified?: boolean;
  hasPaymentMethod?: boolean;
  availableBalance?: number;
  hasTransactions?: boolean;
  /** Holiday Mode (vacation_mode) — disables Store Showcase when production rules active. */
  holidayModeEnabled?: boolean;
  surface?: string;
};

const FEATURE_REGISTRY = new Map<SmartFeatureId, SmartFeatureDefinition>();

/** Register a feature once. Re-registration replaces the definition (SSOT). */
export function registerSmartFeature(definition: SmartFeatureDefinition): void {
  FEATURE_REGISTRY.set(definition.id, definition);
}

export function getSmartFeature(id: SmartFeatureId): SmartFeatureDefinition | undefined {
  return FEATURE_REGISTRY.get(id);
}

export function listSmartFeatures(): SmartFeatureDefinition[] {
  return [...FEATURE_REGISTRY.values()];
}

/**
 * Resolve feature visibility.
 * Local / QA / Demo / Certification / E2E → always SHOW.
 * Production (active) → SHOW only when available.
 * Never removes the feature — only show/hide.
 */
export function resolveFeatureVisibility(
  featureId: SmartFeatureId,
  ctx: SmartFeatureContext = {},
): { visible: boolean; reason: "show-everything" | "production-available" | "production-hidden" | "unknown" } {
  if (isSmartPlatformShowEverythingMode() || !isSmartPlatformProductionActive()) {
    return { visible: true, reason: "show-everything" };
  }

  const feature = FEATURE_REGISTRY.get(featureId);
  if (!feature) {
    // Unknown features stay visible in fail-open UI sense only when show-everything;
    // in production-active unknown → hide (fail closed for undeclared features).
    return { visible: false, reason: "unknown" };
  }

  const available = feature.isAvailableInProduction(ctx);
  return {
    visible: available,
    reason: available ? "production-available" : "production-hidden",
  };
}

/** Built-in platform features (canonical examples from Owner lock). */
export function registerCanonicalSmartFeatures(): void {
  registerSmartFeature({
    id: "holiday-mode",
    label: "Holiday Mode",
    isAvailableInProduction: (ctx) => Math.max(0, Math.floor(ctx.activeListingCount ?? 0)) >= 1,
  });
  registerSmartFeature({
    id: "promote-listings",
    label: "Promote Listings",
    isAvailableInProduction: (ctx) => Math.max(0, Math.floor(ctx.activeListingCount ?? 0)) >= 1,
  });
  registerSmartFeature({
    id: "verified-badge",
    label: "ROVEXO VERIFIED Badge",
    isAvailableInProduction: (ctx) => Boolean(ctx.isRovexoVerified),
  });
  registerSmartFeature({
    id: "payment-methods",
    label: "Payment Methods",
    isAvailableInProduction: () => true,
  });
  registerSmartFeature({
    id: "personal-bank-account",
    label: "Personal Bank Account",
    isAvailableInProduction: () => true,
  });
  registerSmartFeature({
    id: "business-bank-account",
    label: "Business Bank Account",
    isAvailableInProduction: (ctx) => Boolean(ctx.isBusinessVerified),
  });
  registerSmartFeature({
    id: "business-addresses-tab",
    label: "Business Addresses Tab",
    // Owner final contract: Business address book available to every ROVEXO account.
    isAvailableInProduction: () => true,
  });
  registerSmartFeature({
    id: "withdraw",
    label: "Withdraw",
    // Visible always; enabled only with balance (disable handled by UI/money engine).
    isAvailableInProduction: () => true,
  });
  registerSmartFeature({
    id: "transactions-empty-state",
    label: "Transactions Empty State",
    isAvailableInProduction: (ctx) => ctx.hasTransactions === false || ctx.hasTransactions == null,
  });
}

// Auto-register canonical features at module load (idempotent).
registerCanonicalSmartFeatures();
