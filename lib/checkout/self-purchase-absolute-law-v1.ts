/**
 * ROVEXO SELF-PURCHASE ABSOLUTE LAW v1.0 (Cod Sânge · User Singularity)
 *
 * THERE IS ONLY USER ACCOUNT.
 * A User may act as buyer, seller, business, store owner, order owner, wallet owner —
 * never as separate account types.
 *
 * The ONLY purchase forbidden law:
 *   currentUser.id === listing.owner.id → BLOCK (self-purchase)
 *   currentUser.id !== listing.owner.id → ALLOW Buy Now → Checkout → Payment → Order
 *
 * Forbidden comparisons in self-purchase code:
 *   buyer == seller · seller == buyer · buyerId == sellerId
 *
 * Canonical comparison only:
 *   currentUser.id == listing.owner.id
 *
 * SSOT companion: buy-now-absolute-law-v1.ts
 */

export const SELF_PURCHASE_ABSOLUTE_LAW_V1 = {
  version: "1.0",
  status: "LOCKED",
  equation: "THERE_IS_ONLY_USER_ACCOUNT",
  forbiddenAccountTypes: [
    "BUYER_ACCOUNT",
    "SELLER_ACCOUNT",
    "BUSINESS_ACCOUNT",
    "SELF_EMPLOYED_ACCOUNT",
  ] as const,
  canonicalSelfPurchaseCompare: "currentUser.id === listing.owner.id" as const,
  forbiddenSelfPurchaseCompare: [
    "buyer == seller",
    "seller == buyer",
    "buyerId == sellerId",
  ] as const,
  blockWhen: "currentUser.id === listing.owner.id" as const,
  allowWhen: "currentUser.id !== listing.owner.id" as const,
  appliesWithoutExceptionsTo: [
    "BUYER_ROLE",
    "SELLER_ROLE",
    "BUSINESS",
    "SELF_EMPLOYED",
    "STORE_OWNER",
  ] as const,
} as const;

export type SelfPurchaseAbsoluteLawV1 = typeof SELF_PURCHASE_ABSOLUTE_LAW_V1;

/**
 * Canonical self-purchase gate.
 * true = BLOCK (current user owns the listing).
 */
export function isSelfPurchaseBlocked(input: {
  currentUserId: string;
  listingOwnerId: string | null | undefined;
}): boolean {
  const ownerId = input.listingOwnerId?.trim() || null;
  if (!ownerId) return true;
  return input.currentUserId === ownerId;
}
