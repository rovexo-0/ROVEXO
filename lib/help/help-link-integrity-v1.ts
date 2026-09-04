/**
 * Current Help / About / Legal / Support hrefs used by Step 3 surfaces.
 * Used for link-integrity tests. Do not invent destinations.
 */

export const ABOUT_PAGE_HREFS = [
  "/help",
  "/search",
  "/sell",
  "/help/buying-buyer-protection",
  "/legal/buyer-protection",
  "/help/category/seller",
  "/legal/seller-protection",
  "/help/category/safety",
  "/trust",
  "/legal/community-guidelines",
  "/help/category/payments",
  "/legal/platform-fee-policy",
  "/help/category/shipping",
  "/legal/shipping-policy",
  "/support",
  "/legal/privacy-policy",
  "/account/privacy",
  "/legal",
] as const;

export const HELP_HOME_DESTINATION_HREFS = [
  "/support",
  "/support?category=report_user",
  "/help/faq",
  "/legal/privacy-policy",
  "/account/privacy",
  "/legal",
  "/about",
] as const;

export const HELP_CURRENT_CATEGORY_HREFS = [
  "/help/category/buyer",
  "/help/category/seller",
  "/help/category/payments",
  "/help/category/shipping",
  "/help/category/orders",
  "/help/category/account",
  "/help/category/safety",
  "/help/category/reports",
] as const;

export const FORBIDDEN_CURRENT_HELP_CATEGORY_HREFS = [
  "/help/category/property",
  "/help/category/jobs",
  "/help/category/vin-search",
  "/help/category/wholesale",
  "/help/category/subscriptions",
  "/help/category/promoted-listings",
  "/help/category/featured-listings",
  "/help/category/bump-listings",
] as const;
