/**
 * Protection hold after delivery — context-aware (P0-D).
 * Prefer protectionHoursForSellerContext(order.seller_context).
 * Legacy constant kept as Individual default for deprecated imports.
 */
export { INDIVIDUAL_PROTECTION_HOURS as DELIVERED_RELEASE_HOURS } from "@/lib/seller-context/seller-context-v1";
export {
  INDIVIDUAL_PROTECTION_HOURS,
  BUSINESS_PROTECTION_HOURS,
  protectionHoursForSellerContext,
} from "@/lib/seller-context/seller-context-v1";
