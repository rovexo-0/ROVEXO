/**
 * Canonical Seller Shop account-type resolver.
 * BUSINESS only when persisted business_name or business_type is present.
 * Never infer from seller name, listing titles, badges, or listing count.
 */
export type SellerAccountType = "individual" | "business";

export function resolveSellerAccountType(input: {
  businessName?: string | null;
  businessType?: string | null;
} | null | undefined): SellerAccountType {
  const businessName = input?.businessName?.replace(/\s+/g, " ").trim() || "";
  const businessType = input?.businessType?.replace(/\s+/g, " ").trim() || "";
  if (businessName || businessType) return "business";
  return "individual";
}
