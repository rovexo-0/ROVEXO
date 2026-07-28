/**
 * ROVEXO MASTER ENGINE — Store Showcase registration + resolvers (LOCK).
 *
 * GOLDEN RULE: Store Showcase visibility / decay / production promotion rules
 * resolve only through Master Engine APIs.
 */

import { registerSmartFeature } from "@/lib/smart-platform/features";
import {
  STORE_SHOWCASE_FEATURE_ID,
  STORE_SHOWCASE_MIN_LISTINGS,
} from "@/lib/promote/constants";
import {
  applyStoreShowcaseProductionRules,
  calculateStoreShowcaseDecay,
  evaluateStoreShowcasePurchaseGate,
  getStoreShowcaseEngineSnapshot,
  getStoreShowcaseOffer,
  type StoreShowcasePurchaseGateInput,
  type StoreShowcaseRulesInput,
  type StoreShowcaseRulesResult,
} from "@/lib/promote/store-showcase-engine";
import type { StoreShowcaseDecayState } from "@/lib/promote/store-showcase-decay-engine";
import { areProductionPromotionRulesActive } from "@/lib/master-engine/activation";

/**
 * Register Store Showcase into the Smart Feature registry (idempotent).
 * Production availability: 2+ listings AND holiday mode off.
 */
export function registerStoreShowcase(): void {
  registerSmartFeature({
    id: STORE_SHOWCASE_FEATURE_ID,
    label: "Store Showcase",
    isAvailableInProduction: (ctx) => {
      const listings = Math.max(0, Math.floor(ctx.activeListingCount ?? 0));
      if (listings < STORE_SHOWCASE_MIN_LISTINGS) return false;
      if (ctx.holidayModeEnabled) return false;
      return true;
    },
  });
}

export type StoreShowcaseVisibilityResult = StoreShowcaseRulesResult & {
  mode: "show-everything" | "production";
};

/**
 * Resolve Store Showcase visibility.
 * Local / QA / Demo / Certification → SHOW EVERYTHING.
 * Production → applyStoreShowcaseProductionRules.
 */
export function resolveStoreShowcaseVisibility(
  user: StoreShowcaseRulesInput,
): StoreShowcaseVisibilityResult {
  if (!areProductionPromotionRulesActive()) {
    return {
      visible: true,
      enabled: true,
      reason: "available",
      mode: "show-everything",
    };
  }
  return {
    ...applyStoreShowcaseProductionRules(user),
    mode: "production",
  };
}

export { calculateStoreShowcaseDecay, applyStoreShowcaseProductionRules };

export function resolveStoreShowcasePurchaseGate(
  input: Omit<StoreShowcasePurchaseGateInput, "productionRulesActive">,
) {
  return evaluateStoreShowcasePurchaseGate({
    ...input,
    productionRulesActive: areProductionPromotionRulesActive(),
  });
}

export { getStoreShowcaseEngineSnapshot, getStoreShowcaseOffer };

export type { StoreShowcaseDecayState, StoreShowcaseRulesInput, StoreShowcaseRulesResult };

// Auto-register at module load.
registerStoreShowcase();
