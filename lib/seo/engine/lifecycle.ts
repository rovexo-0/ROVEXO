/**
 * Wave 0 — Indexation Lifecycle Engine (SSOT).
 * Maps ROVEXO content states → SEO HTTP / indexability policy.
 *
 * Evidence-based only. product_status enum has no "expired" —
 * EXPIRED → 410 remains NOT_VERIFIED (do not invent).
 */

import type { ProductStatus } from "@/lib/supabase/types/database";

export const SEO_LIFECYCLE_STATES = [
  "ACTIVE",
  "SOLD",
  "EXPIRED",
  "DELETED",
  "UNAVAILABLE",
  "NOT_FOUND",
] as const;

export type SeoLifecycleState = (typeof SEO_LIFECYCLE_STATES)[number];

export type SeoIndexationDecision =
  | "INDEX"
  | "NOINDEX"
  | "REDIRECT"
  | "404"
  | "410"
  | "EXCLUDE"
  | "NOT_VERIFIED";

export type SeoLifecyclePolicy = {
  state: SeoLifecycleState;
  /** Expected HTTP for the marketplace surface (Owner soft-200 where noted). */
  httpStatus: 200 | 301 | 302 | 307 | 308 | 404 | 410 | null;
  indexation: SeoIndexationDecision;
  sitemapEligible: boolean;
  structuredDataEligible: boolean;
  /** Soft-200 unavailable UI (Owner Homepage freeze). */
  softUnavailable: boolean;
  /** Offer availability hint for Product JSON-LD when applicable. */
  offerAvailability: "InStock" | "OutOfStock" | null;
  reason: string;
  /** When true, callers must not invent HTTP 410 / hard delete behaviour. */
  policyVerified: boolean;
};

/**
 * Canonical lifecycle policies — Owner / audit locked where verified.
 */
export const SEO_LIFECYCLE_POLICIES: Record<SeoLifecycleState, SeoLifecyclePolicy> = {
  ACTIVE: {
    state: "ACTIVE",
    httpStatus: 200,
    indexation: "INDEX",
    sitemapEligible: true,
    structuredDataEligible: true,
    softUnavailable: false,
    offerAvailability: "InStock",
    reason: "published_active_listing_or_hub",
    policyVerified: true,
  },
  SOLD: {
    state: "SOLD",
    httpStatus: 200,
    indexation: "INDEX",
    sitemapEligible: true,
    structuredDataEligible: true,
    softUnavailable: false,
    offerAvailability: "OutOfStock",
    reason: "sold_pdp_keep_indexed_out_of_stock",
    policyVerified: true,
  },
  EXPIRED: {
    state: "EXPIRED",
    httpStatus: null,
    indexation: "NOT_VERIFIED",
    sitemapEligible: false,
    structuredDataEligible: false,
    softUnavailable: false,
    offerAvailability: null,
    reason: "expired_not_a_product_status_410_mapping_not_verified",
    policyVerified: false,
  },
  DELETED: {
    state: "DELETED",
    httpStatus: 200,
    indexation: "NOINDEX",
    sitemapEligible: false,
    structuredDataEligible: false,
    softUnavailable: true,
    offerAvailability: null,
    reason: "deleted_soft_unavailable_noindex",
    policyVerified: true,
  },
  UNAVAILABLE: {
    state: "UNAVAILABLE",
    httpStatus: 200,
    indexation: "NOINDEX",
    sitemapEligible: false,
    structuredDataEligible: false,
    softUnavailable: true,
    offerAvailability: null,
    reason: "soft_200_unavailable_noindex_owner_freeze",
    policyVerified: true,
  },
  NOT_FOUND: {
    state: "NOT_FOUND",
    httpStatus: 200,
    indexation: "NOINDEX",
    sitemapEligible: false,
    structuredDataEligible: false,
    softUnavailable: true,
    offerAvailability: null,
    reason: "missing_listing_or_store_soft_unavailable_noindex",
    policyVerified: true,
  },
};

/** Map DB product_status → lifecycle. Unknown / non-public → fail closed. */
export function lifecycleFromProductStatus(
  status: ProductStatus | null | undefined,
): SeoLifecycleState | "DRAFT_EXCLUDED" | "PAUSED_EXCLUDED" | "RESERVED_EXCLUDED" {
  switch (status) {
    case "published":
      return "ACTIVE";
    case "sold":
      return "SOLD";
    case "deleted":
      return "DELETED";
    case "draft":
      return "DRAFT_EXCLUDED";
    case "paused":
      return "PAUSED_EXCLUDED";
    case "reserved":
      return "RESERVED_EXCLUDED";
    default:
      return "NOT_FOUND";
  }
}

export function resolveLifecyclePolicy(state: SeoLifecycleState): SeoLifecyclePolicy {
  return SEO_LIFECYCLE_POLICIES[state];
}

/**
 * Resolve listing-page lifecycle for SEO governance.
 * Missing product → NOT_FOUND (soft-200 + noindex), never invent 410.
 */
export function resolveListingLifecycle(input: {
  productFound: boolean;
  status?: ProductStatus | null;
}): SeoLifecyclePolicy {
  if (!input.productFound) {
    return SEO_LIFECYCLE_POLICIES.NOT_FOUND;
  }

  const mapped = lifecycleFromProductStatus(input.status);
  if (mapped === "ACTIVE" || mapped === "SOLD" || mapped === "DELETED") {
    return SEO_LIFECYCLE_POLICIES[mapped];
  }

  // draft / paused / reserved — never public INDEX
  return {
    state: "UNAVAILABLE",
    httpStatus: 200,
    indexation: "EXCLUDE",
    sitemapEligible: false,
    structuredDataEligible: false,
    softUnavailable: false,
    offerAvailability: null,
    reason: `non_public_product_status_${String(input.status ?? "unknown")}`,
    policyVerified: true,
  };
}
