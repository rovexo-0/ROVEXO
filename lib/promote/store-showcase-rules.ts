/**
 * ROVEXO STORE SHOWCASE — production smart rules v1.0 (LOCK).
 *
 * 0–1 listings → HIDDEN
 * 2+ listings → visible
 * Holiday Mode ON → DISABLED
 * Holiday Mode OFF → ENABLED (when visible)
 *
 * Local / QA / Demo / Certification → SHOW EVERYTHING (caller via Master Engine).
 */

import { STORE_SHOWCASE_MIN_LISTINGS } from "@/lib/promote/constants";

export type StoreShowcaseRulesInput = {
  activeListingCount: number;
  holidayModeEnabled: boolean;
};

export type StoreShowcaseRulesResult = {
  /** False = HIDDEN (do not render entry). */
  visible: boolean;
  /** False = DISABLED (visible but cannot purchase / activate). */
  enabled: boolean;
  reason:
    | "available"
    | "hidden-insufficient-listings"
    | "disabled-holiday-mode";
};

/**
 * Pure production rules (no mode short-circuit).
 * Master Engine applies show-everything before calling this when inactive.
 */
export function applyStoreShowcaseProductionRules(
  input: StoreShowcaseRulesInput,
): StoreShowcaseRulesResult {
  const listings = Math.max(0, Math.floor(input.activeListingCount));

  if (listings < STORE_SHOWCASE_MIN_LISTINGS) {
    return {
      visible: false,
      enabled: false,
      reason: "hidden-insufficient-listings",
    };
  }

  if (input.holidayModeEnabled) {
    return {
      visible: true,
      enabled: false,
      reason: "disabled-holiday-mode",
    };
  }

  return {
    visible: true,
    enabled: true,
    reason: "available",
  };
}
