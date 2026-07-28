/**
 * ROVEXO MASTER ENGINE v1.0 — Golden Rule resolvers (LOCK).
 *
 * NO FEATURE MAY BE IMPLEMENTED OUTSIDE THE MASTER ENGINE.
 *
 * CORRECT:
 *   resolveFeatureVisibility("holiday-mode", user)
 *   resolveVerifiedStatus(user)
 *   resolveBusinessVisibility(user)
 *
 * WRONG:
 *   if (user.hasListings) showHolidayMode()
 *   if (user.isVerified) showVerifiedBadge()
 *   showBusinessBank()
 */

import {
  resolveFeatureVisibility,
  type SmartFeatureContext,
} from "@/lib/smart-platform/features";

export type MasterUserContext = SmartFeatureContext;

export type FeatureVisibilityResult = ReturnType<typeof resolveFeatureVisibility>;

export type VerifiedStatusResult = {
  /** Cached / evaluated ROVEXO VERIFIED flag. */
  isVerified: boolean;
  /** Whether the 7px Facebook-style badge may render. */
  showBadge: boolean;
  reason: FeatureVisibilityResult["reason"];
};

export type BusinessVisibilityResult = {
  showBusinessBank: boolean;
  reason: FeatureVisibilityResult["reason"];
};

/**
 * Canonical feature visibility. Every platform feature must use this (or a
 * typed helper below that delegates here). Never inline production predicates in UI.
 */
export { resolveFeatureVisibility };

/**
 * ROVEXO VERIFIED badge gate.
 * Never: `if (user.isVerified) showBadge()`.
 * Always: `resolveVerifiedStatus(user).showBadge`.
 */
export function resolveVerifiedStatus(
  user: Pick<MasterUserContext, "isRovexoVerified"> | { isRovexoVerified?: boolean | null },
): VerifiedStatusResult {
  const isVerified = Boolean(user.isRovexoVerified);
  const { visible, reason } = resolveFeatureVisibility("verified-badge", {
    isRovexoVerified: isVerified,
  });
  return {
    isVerified,
    showBadge: isVerified && visible,
    reason,
  };
}

/**
 * Business Bank (and business-scoped money UI) gate.
 * Never: `showBusinessBank()`.
 * Always: `resolveBusinessVisibility(user).showBusinessBank`.
 */
export function resolveBusinessVisibility(
  user: Pick<MasterUserContext, "isBusinessVerified"> | { isBusinessVerified?: boolean | null },
): BusinessVisibilityResult {
  const { visible, reason } = resolveFeatureVisibility("business-bank-account", {
    isBusinessVerified: Boolean(user.isBusinessVerified),
  });
  return {
    showBusinessBank: visible,
    reason,
  };
}

export type BusinessAddressesVisibilityResult = {
  showBusinessAddressesTab: boolean;
  reason: FeatureVisibilityResult["reason"];
};

/**
 * Addresses Business tab gate (Addresses v1.0).
 * Never: `if (user.isBusinessVerified) showBusinessTab()`.
 * Always: `resolveBusinessAddressesVisibility(user).showBusinessAddressesTab`.
 *
 * Owner final contract: Business tab is fully functional for every ROVEXO account
 * (unified account — buy and sell on the same account; billing addresses allowed).
 */
export function resolveBusinessAddressesVisibility(
  _user?: Pick<MasterUserContext, "isBusinessVerified"> | { isBusinessVerified?: boolean | null },
): BusinessAddressesVisibilityResult {
  void _user;
  const { visible, reason } = resolveFeatureVisibility("business-addresses-tab", {
    isBusinessVerified: true,
  });
  return {
    showBusinessAddressesTab: visible,
    reason,
  };
}

/** Holiday Mode — always via feature registry. */
export function resolveHolidayModeVisibility(
  user: Pick<MasterUserContext, "activeListingCount">,
): FeatureVisibilityResult {
  return resolveFeatureVisibility("holiday-mode", {
    activeListingCount: user.activeListingCount ?? 0,
  });
}

/** Promote — always via feature registry. */
export function resolvePromoteVisibility(
  user: Pick<MasterUserContext, "activeListingCount">,
): FeatureVisibilityResult {
  return resolveFeatureVisibility("promote-listings", {
    activeListingCount: user.activeListingCount ?? 0,
  });
}
