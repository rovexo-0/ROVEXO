/**
 * Listing → Delivery Details route (fail-closed).
 *
 * Forbidden: `/help/shipping` (hits help/[slug] → notFound → 404).
 * Canonical: Delivery and shipping Help article.
 */

export const PRODUCT_DELIVERY_DETAILS_HREF = "/help/delivery-shipping" as const;

/** Broken / legacy paths that must redirect to Delivery Details (never 404). */
export const PRODUCT_DELIVERY_LEGACY_HELP_SLUGS = ["shipping", "delivery", "delivery-details"] as const;

export function resolveDeliveryDetailsHref(candidate: string | null | undefined): string {
  const raw = (candidate ?? "").trim();
  if (!raw) return PRODUCT_DELIVERY_DETAILS_HREF;
  if (raw === PRODUCT_DELIVERY_DETAILS_HREF) return PRODUCT_DELIVERY_DETAILS_HREF;
  if (raw === "/help/shipping" || raw === "/help/delivery" || raw === "/help/delivery-details") {
    return PRODUCT_DELIVERY_DETAILS_HREF;
  }
  return PRODUCT_DELIVERY_DETAILS_HREF;
}
