import type { UserRole } from "@/lib/supabase/types/database";
import { isAdmin, isSeller, isSuperAdmin } from "@/lib/auth/roles";

/**
 * ROVEXO Unified Account Architecture v1.0 (SSOT)
 *
 * One universal ROVEXO account per email. Capabilities unlock by action and
 * verification — never by separate buyer/seller/business identities.
 */
export const ROVEXO_ACCOUNT_KIND = "account" as const;

export type RovexoAccountKind = typeof ROVEXO_ACCOUNT_KIND | "admin" | "super_admin";

/** @deprecated Legacy display field — marketplace users are always `"account"`. */
export type AccountType = RovexoAccountKind;

export type AccountCapabilities = {
  canBrowse: boolean;
  canBuy: boolean;
  canSell: boolean;
  canCreateStore: boolean;
  canVerifyBusiness: boolean;
  canReceivePayments: boolean;
  canWithdrawFunds: boolean;
  hasBusinessVerification: boolean;
  /** User has published listings or an active seller profile row. */
  hasSellingActivity: boolean;
  /** Public store page is available (username + at least one listing). */
  hasStore: boolean;
};

export type AccountCapabilityInput = {
  role: UserRole;
  verified: boolean;
  hasSellerProfile: boolean;
  hasBusinessAccount: boolean;
  listingCount?: number;
  username?: string;
};

export function resolveRovexoAccountKind(role: UserRole): RovexoAccountKind {
  if (isSuperAdmin(role)) return "super_admin";
  if (isAdmin(role)) return "admin";
  return ROVEXO_ACCOUNT_KIND;
}

/** @deprecated Use resolveRovexoAccountKind — kept for gradual migration. */
export function resolveAccountType(role: UserRole): AccountType {
  return resolveRovexoAccountKind(role);
}

export function resolveAccountCapabilities(input: AccountCapabilityInput): AccountCapabilities {
  const isStaff = isAdmin(input.role) || isSuperAdmin(input.role);
  const listingCount = input.listingCount ?? 0;
  const hasSellingActivity =
    input.hasSellerProfile || listingCount > 0 || isSeller(input.role) || isStaff;
  const hasStore =
    Boolean(input.username?.trim()) && (listingCount > 0 || input.hasSellerProfile);
  const hasBusinessVerification = input.hasBusinessAccount || input.role === "business" || isStaff;

  return {
    canBrowse: true,
    canBuy: true,
    canSell: true,
    canCreateStore: true,
    canVerifyBusiness: !hasBusinessVerification,
    canReceivePayments: true,
    canWithdrawFunds: true,
    hasBusinessVerification,
    hasSellingActivity,
    hasStore,
  };
}

export function hasSellingCapability(input: AccountCapabilityInput): boolean {
  return resolveAccountCapabilities(input).canSell;
}

export function hasBusinessVerificationCapability(input: AccountCapabilityInput): boolean {
  return resolveAccountCapabilities(input).hasBusinessVerification;
}

/** Private seller quick form vs business/wholesale advanced forms. */
export type SellListingMode = "quick" | "advanced" | "enterprise";

export function getSellListingMode(capabilities: AccountCapabilities): SellListingMode {
  if (capabilities.hasBusinessVerification) return "advanced";
  return "quick";
}

export function canManageInventory(capabilities: AccountCapabilities): boolean {
  return capabilities.hasBusinessVerification;
}

export function usesQuickListingForm(mode: SellListingMode): boolean {
  return mode === "quick";
}
