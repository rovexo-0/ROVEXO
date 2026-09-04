/**
 * ROVEXO Help/Legal content audience — ONE filter SSOT.
 *
 * Viewer rule (authoritative seller context only):
 *   guest      → shared
 *   individual → shared + individual
 *   business   → shared + business
 *
 * Missing `audience` on any in-code item = shared (preserve public content).
 * Do not use localStorage, URL flags, or client-provided account type.
 */

import type { SellerContext } from "@/lib/seller-context/seller-context-v1";
import type { HelpContentAudience, HelpTopicSlug, SupportHelpContext } from "@/lib/help/types";

export const HELP_CONTENT_AUDIENCES = ["shared", "individual", "business"] as const;

export type { HelpContentAudience };

export const HELP_AUDIENCES_FOR_GUEST = ["shared"] as const satisfies readonly HelpContentAudience[];
export const HELP_AUDIENCES_FOR_INDIVIDUAL = [
  "shared",
  "individual",
] as const satisfies readonly HelpContentAudience[];
export const HELP_AUDIENCES_FOR_BUSINESS = [
  "shared",
  "business",
] as const satisfies readonly HelpContentAudience[];

export function isHelpContentAudience(value: unknown): value is HelpContentAudience {
  return value === "shared" || value === "individual" || value === "business";
}

/** Guest when context is null/undefined. Never infer from URL or client flags. */
export function resolveHelpContentAudiencesForSellerContext(
  context: SellerContext | null | undefined,
): readonly HelpContentAudience[] {
  if (context === "business") return HELP_AUDIENCES_FOR_BUSINESS;
  if (context === "individual") return HELP_AUDIENCES_FOR_INDIVIDUAL;
  return HELP_AUDIENCES_FOR_GUEST;
}

export function resolveHelpContentAudience(
  audience: HelpContentAudience | undefined | null,
): HelpContentAudience {
  return audience ?? "shared";
}

export function canAccessHelpContent(
  audience: HelpContentAudience | undefined | null,
  allowedAudiences: readonly HelpContentAudience[],
): boolean {
  return allowedAudiences.includes(resolveHelpContentAudience(audience));
}

export function filterHelpContentByAudience<T extends { audience?: HelpContentAudience }>(
  items: readonly T[],
  allowedAudiences: readonly HelpContentAudience[],
): T[] {
  return items.filter((item) => canAccessHelpContent(item.audience, allowedAudiences));
}

/**
 * Unused / non-mounted verticals. Kept in-code. Must not appear as current
 * Help categories or search surfaces after audience filtering.
 */
export const LEGACY_HELP_TOPIC_SLUGS = [
  "wholesale",
  "manufacturers",
  "suppliers",
  "subscriptions",
  "promoted-listings",
  "featured-listings",
  "bump-listings",
  "auto",
  "license-plate-search",
  "vin-search",
  "property",
  "jobs",
  "services",
  "business-directory",
  "company-profiles",
  "request-quote",
  "request-part",
  "request-services",
] as const satisfies readonly HelpTopicSlug[];

export type LegacyHelpTopicSlug = (typeof LEGACY_HELP_TOPIC_SLUGS)[number];

export function isLegacyHelpTopicSlug(slug: string): slug is LegacyHelpTopicSlug {
  return (LEGACY_HELP_TOPIC_SLUGS as readonly string[]).includes(slug);
}

/**
 * Live Business-only Help articles. Shared/Individual markdown bodies must
 * never embed these hrefs — related UI already filters per viewer.
 */
export const BUSINESS_ONLY_HELP_ARTICLE_SLUGS = ["business-storefront-tips"] as const;

export function isBusinessOnlyHelpArticleSlug(slug: string): boolean {
  return (BUSINESS_ONLY_HELP_ARTICLE_SLUGS as readonly string[]).includes(slug);
}

/**
 * Discard any client-provided accountType and stamp the canonical seller context.
 */
export function bindSupportHelpContextToSellerContext(
  helpContext: SupportHelpContext | undefined,
  sellerContext: SellerContext,
): SupportHelpContext {
  const rest = { ...(helpContext ?? {}) };
  delete rest.accountType;
  return {
    ...rest,
    accountType: sellerContext,
  };
}
