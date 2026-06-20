export type AccountType = "buyer" | "seller" | "business" | "admin";

export function canManageInventory(accountType: AccountType): boolean {
  return accountType === "seller" || accountType === "business" || accountType === "admin";
}
