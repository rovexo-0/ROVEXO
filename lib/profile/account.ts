export type AccountType = "buyer" | "seller" | "business" | "admin" | "super_admin";

/** Private seller quick form vs business/wholesale advanced forms. */
export type SellListingMode = "quick" | "advanced" | "enterprise";

export function getSellListingMode(accountType: AccountType): SellListingMode {
  if (accountType === "business" || accountType === "admin" || accountType === "super_admin") {
    return "advanced";
  }
  return "quick";
}

/** SKU and low-stock alerts are managed in the Business Inventory module only. */
export function canManageInventory(accountType: AccountType): boolean {
  return accountType === "business" || accountType === "admin" || accountType === "super_admin";
}

export function usesQuickListingForm(mode: SellListingMode): boolean {
  return mode === "quick";
}
