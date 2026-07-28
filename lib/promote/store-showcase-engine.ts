/**
 * ROVEXO STORE SHOWCASE ENGINE v1.0 (LOCK) — orchestration SSOT.
 *
 * Fair store visibility. Entire store. 7 days · £6.30 only.
 * ≠ Pay to Win · ≠ Top Search · ≠ Featured position buying · ≠ Manual positioning.
 */

import {
  STORE_SHOWCASE_DURATION_DAYS,
  STORE_SHOWCASE_ENGINE_NAME,
  STORE_SHOWCASE_ENGINE_VERSION,
  STORE_SHOWCASE_FEATURE_ID,
  STORE_SHOWCASE_PACKAGE_ID,
  STORE_SHOWCASE_PERSISTENCE_TYPE,
  STORE_SHOWCASE_PRICE_CENTS,
  STORE_SHOWCASE_PRICE_LABEL,
  STORE_SHOWCASE_PRODUCTION_READY,
  STORE_SHOWCASE_USER_COPY,
} from "@/lib/promote/constants";
import {
  assertNoDoubleStoreShowcaseBoost,
  evaluateStoreShowcaseAntiAbuse,
  type StoreShowcaseAntiAbuseInput,
  type StoreShowcaseAntiAbuseResult,
} from "@/lib/promote/anti-abuse-engine";
import {
  calculateStoreShowcaseDecay,
  type StoreShowcaseDecayState,
} from "@/lib/promote/store-showcase-decay-engine";
import {
  applyStoreShowcaseProductionRules,
  type StoreShowcaseRulesInput,
  type StoreShowcaseRulesResult,
} from "@/lib/promote/store-showcase-rules";
import {
  buildStoreShowcaseAnalyticsSnapshot,
  type StoreShowcaseAnalyticsSnapshot,
} from "@/lib/promote/store-showcase-analytics";

export type StoreShowcaseOffer = {
  featureId: typeof STORE_SHOWCASE_FEATURE_ID;
  title: string;
  durationDays: typeof STORE_SHOWCASE_DURATION_DAYS;
  durationLabel: string;
  packageId: typeof STORE_SHOWCASE_PACKAGE_ID;
  priceCents: typeof STORE_SHOWCASE_PRICE_CENTS;
  priceLabel: string;
  promotes: readonly string[];
  tagline: string;
  persistenceType: typeof STORE_SHOWCASE_PERSISTENCE_TYPE;
};

/** Canonical offer — only option. */
export function getStoreShowcaseOffer(): StoreShowcaseOffer {
  return {
    featureId: STORE_SHOWCASE_FEATURE_ID,
    title: STORE_SHOWCASE_USER_COPY.title,
    durationDays: STORE_SHOWCASE_DURATION_DAYS,
    durationLabel: STORE_SHOWCASE_USER_COPY.durationLabel,
    packageId: STORE_SHOWCASE_PACKAGE_ID,
    priceCents: STORE_SHOWCASE_PRICE_CENTS,
    priceLabel: STORE_SHOWCASE_PRICE_LABEL,
    promotes: STORE_SHOWCASE_USER_COPY.promotes,
    tagline: STORE_SHOWCASE_USER_COPY.tagline,
    persistenceType: STORE_SHOWCASE_PERSISTENCE_TYPE,
  };
}

/** Reject any package other than the locked 7-day offer. */
export function isValidStoreShowcasePackage(packageId: string): boolean {
  return packageId === STORE_SHOWCASE_PACKAGE_ID || packageId === String(STORE_SHOWCASE_DURATION_DAYS);
}

export function getStoreShowcaseEngineSnapshot() {
  return {
    name: STORE_SHOWCASE_ENGINE_NAME,
    version: STORE_SHOWCASE_ENGINE_VERSION,
    productionReady: STORE_SHOWCASE_PRODUCTION_READY,
    featureId: STORE_SHOWCASE_FEATURE_ID,
    offer: getStoreShowcaseOffer(),
  };
}

export type StoreShowcasePurchaseGateInput = StoreShowcaseRulesInput &
  StoreShowcaseAntiAbuseInput & {
    /** When true, production listing/holiday rules are applied. */
    productionRulesActive: boolean;
  };

export type StoreShowcasePurchaseGateResult = {
  canPurchase: boolean;
  visibility: StoreShowcaseRulesResult;
  antiAbuse: StoreShowcaseAntiAbuseResult;
  offer: StoreShowcaseOffer;
};

/**
 * Full purchase gate: visibility + anti-abuse.
 * Local (productionRulesActive=false): visibility show-everything; anti-abuse still applies.
 */
export function evaluateStoreShowcasePurchaseGate(
  input: StoreShowcasePurchaseGateInput,
): StoreShowcasePurchaseGateResult {
  const visibility = input.productionRulesActive
    ? applyStoreShowcaseProductionRules(input)
    : { visible: true, enabled: true, reason: "available" as const };

  const doubleBoost = assertNoDoubleStoreShowcaseBoost(input.hasActiveStoreShowcase);
  const antiAbuse =
    doubleBoost.allowed === false
      ? doubleBoost
      : evaluateStoreShowcaseAntiAbuse(input);

  const canPurchase = visibility.visible && visibility.enabled && antiAbuse.allowed;

  return {
    canPurchase,
    visibility,
    antiAbuse,
    offer: getStoreShowcaseOffer(),
  };
}

export {
  applyStoreShowcaseProductionRules,
  buildStoreShowcaseAnalyticsSnapshot,
  calculateStoreShowcaseDecay,
  evaluateStoreShowcaseAntiAbuse,
  assertNoDoubleStoreShowcaseBoost,
};

export type {
  StoreShowcaseAnalyticsSnapshot,
  StoreShowcaseAntiAbuseInput,
  StoreShowcaseAntiAbuseResult,
  StoreShowcaseDecayState,
  StoreShowcaseRulesInput,
  StoreShowcaseRulesResult,
};
