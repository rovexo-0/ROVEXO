/**
 * Wave 0 — SEO Eligibility Orchestrator (SSOT · FINAL GATE).
 *
 * Pipeline:
 * ROVEXO DATA → CONTENT STATE → QUALITY → DUPLICATE → INVENTORY
 * → SEARCH INTENT → CANONICAL → PROTECTION → ELIGIBILITY → INDEXATION
 *
 * Fail closed: unknown / unsafe → do not INDEX.
 * Reuses protection, lifecycle, canonical, config thresholds — no parallel v2.
 */

import { MIN_QUALITY_SCORE_TO_INDEX, isIndexableInventory } from "@/lib/seo/engine/config";
import {
  absoluteCanonicalFromPath,
  resolveSeoCanonical,
  type SeoCanonicalResult,
} from "@/lib/seo/engine/canonical";
import {
  evaluateSeoProtection,
  isSeoIndexExcludedPath,
  type SeoProtectionResult,
} from "@/lib/seo/engine/protection";
import {
  resolveLifecyclePolicy,
  resolveListingLifecycle,
  type SeoIndexationDecision,
  type SeoLifecyclePolicy,
  type SeoLifecycleState,
} from "@/lib/seo/engine/lifecycle";
import type { SeoPageKind } from "@/lib/seo/engine/types";
import type { ProductStatus } from "@/lib/supabase/types/database";

export type SeoEligibilityPageType =
  | SeoPageKind
  | "homepage"
  | "search"
  | "private"
  | "api"
  | "auth";

export type SeoEligibilityInput = {
  pageType: SeoEligibilityPageType;
  path: string;
  searchParams?: URLSearchParams | Record<string, string | undefined | null>;
  /** Listing / hub inventory count when applicable. */
  listingCount?: number;
  qualityScore?: number;
  duplicateRisk?: number;
  facetCount?: number;
  activeFilterCount?: number;
  hasSearchQuery?: boolean;
  taxonomyValid?: boolean;
  /** Search intent classified OK (default true when omitted). */
  intentOk?: boolean;
  /** Override lifecycle; listing helpers may set via productStatus. */
  lifecycle?: SeoLifecycleState;
  productFound?: boolean;
  productStatus?: ProductStatus | null;
  softUnavailable?: boolean;
  /** Preferred path for canonical (e.g. after facet canonicalisation). */
  preferredCanonicalPath?: string;
};

export type SeoEligibilityResult = {
  eligible: boolean;
  reason: string;
  reasons: string[];
  indexation: SeoIndexationDecision;
  canonical: SeoCanonicalResult;
  lifecycle: SeoLifecyclePolicy | null;
  protection: SeoProtectionResult;
  sitemapEligible: boolean;
  structuredDataEligible: boolean;
};

function pathFromInput(path: string): string {
  if (!path || path === "") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function toParams(
  input?: URLSearchParams | Record<string, string | undefined | null>,
): URLSearchParams | undefined {
  if (!input) return undefined;
  if (input instanceof URLSearchParams) return input;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(input)) {
    if (v != null && v !== "") params.set(k, v);
  }
  return params;
}

/**
 * Final SEO eligibility gate. Protection runs first; then lifecycle; then quality/inventory.
 */
export function evaluateSeoEligibility(input: SeoEligibilityInput): SeoEligibilityResult {
  const path = pathFromInput(input.path);
  const reasons: string[] = [];
  const searchParams = toParams(input.searchParams);

  const hasSearchQuery =
    input.hasSearchQuery === true ||
    (path.startsWith("/search") && Boolean(searchParams?.get("q")));

  // --- Protection (BEFORE eligibility grant) ---
  const protection = evaluateSeoProtection({
    path,
    hasSearchQuery,
    searchParams,
    activeFilterCount: input.activeFilterCount,
    listingCount:
      input.pageType === "homepage" || input.pageType === "static"
        ? undefined
        : input.listingCount,
    facetCount: input.facetCount,
    duplicateRisk: input.duplicateRisk,
    taxonomyValid: input.taxonomyValid,
    softUnavailable: input.softUnavailable,
  });

  // --- Canonical ---
  const canonicalPath = input.preferredCanonicalPath ?? path;
  const canonical = resolveSeoCanonical({
    path: canonicalPath,
    searchParams,
    allowQuery: false,
  });

  if (!canonical.valid) {
    reasons.push(canonical.reason);
    return {
      eligible: false,
      reason: canonical.reason,
      reasons,
      indexation: "NOINDEX",
      canonical,
      lifecycle: null,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  if (isSeoIndexExcludedPath(path) || input.pageType === "private" || input.pageType === "api") {
    reasons.push("private_or_excluded_surface");
    return {
      eligible: false,
      reason: "private_or_excluded_surface",
      reasons,
      indexation: "EXCLUDE",
      canonical,
      lifecycle: null,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  if (input.pageType === "auth" || protection.verdict === "BLOCK_EXCLUDE") {
    reasons.push(...protection.reasons);
    return {
      eligible: false,
      reason: protection.reasons[0] ?? "protection_exclude",
      reasons,
      indexation: "EXCLUDE",
      canonical,
      lifecycle: null,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  if (!protection.allowed) {
    reasons.push(...protection.reasons);
    return {
      eligible: false,
      reason: protection.reasons[0] ?? "protection_block",
      reasons,
      indexation: "NOINDEX",
      canonical,
      lifecycle: input.softUnavailable
        ? resolveLifecyclePolicy("UNAVAILABLE")
        : null,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  // --- Lifecycle ---
  let lifecycle: SeoLifecyclePolicy | null = null;
  if (input.lifecycle === "EXPIRED") {
    // product_status has no "expired" — preserve NOT_VERIFIED; never invent 410.
    lifecycle = resolveLifecyclePolicy("EXPIRED");
  } else if (input.pageType === "product" || input.productFound !== undefined) {
    lifecycle = resolveListingLifecycle({
      productFound: input.productFound !== false,
      status: input.productStatus,
    });
  } else if (input.lifecycle) {
    lifecycle = resolveLifecyclePolicy(input.lifecycle);
  } else if (input.softUnavailable) {
    lifecycle = resolveLifecyclePolicy("UNAVAILABLE");
  } else if (
    input.pageType === "homepage" ||
    input.pageType === "category" ||
    input.pageType === "brand" ||
    input.pageType === "store" ||
    input.pageType === "seller" ||
    input.pageType === "location" ||
    input.pageType === "location-category" ||
    input.pageType === "browse" ||
    input.pageType === "discovery" ||
    input.pageType === "collection" ||
    input.pageType === "trend" ||
    input.pageType === "static"
  ) {
    lifecycle = resolveLifecyclePolicy("ACTIVE");
  }

  if (lifecycle && !lifecycle.policyVerified) {
    reasons.push(lifecycle.reason);
    return {
      eligible: false,
      reason: lifecycle.reason,
      reasons,
      indexation: "NOT_VERIFIED",
      canonical,
      lifecycle,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  if (lifecycle && (lifecycle.indexation === "NOINDEX" || lifecycle.indexation === "EXCLUDE")) {
    reasons.push(lifecycle.reason);
    return {
      eligible: false,
      reason: lifecycle.reason,
      reasons,
      indexation: lifecycle.indexation,
      canonical,
      lifecycle,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  if (lifecycle?.indexation === "NOT_VERIFIED") {
    reasons.push(lifecycle.reason);
    return {
      eligible: false,
      reason: lifecycle.reason,
      reasons,
      indexation: "NOT_VERIFIED",
      canonical,
      lifecycle,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  // --- Search intent ---
  if (input.intentOk === false) {
    reasons.push("search_intent_failed");
    return {
      eligible: false,
      reason: "search_intent_failed",
      reasons,
      indexation: "NOINDEX",
      canonical,
      lifecycle,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  // --- Inventory / quality (hubs & listings with counts) ---
  const longTail = (input.facetCount ?? 0) >= 3;
  if (typeof input.listingCount === "number" && input.pageType !== "product") {
    // Product PDP inventory is lifecycle-driven (sold still INDEX).
    if (!isIndexableInventory(input.listingCount, longTail)) {
      reasons.push("inventory_gate_failed");
      return {
        eligible: false,
        reason: "inventory_gate_failed",
        reasons,
        indexation: "NOINDEX",
        canonical,
        lifecycle,
        protection,
        sitemapEligible: false,
        structuredDataEligible: false,
      };
    }
  }

  if (typeof input.qualityScore === "number" && input.qualityScore < MIN_QUALITY_SCORE_TO_INDEX) {
    reasons.push("quality_gate_failed");
    return {
      eligible: false,
      reason: "quality_gate_failed",
      reasons,
      indexation: "NOINDEX",
      canonical,
      lifecycle,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  if (typeof input.duplicateRisk === "number" && input.duplicateRisk >= 0.85) {
    reasons.push("duplicate_gate_failed");
    return {
      eligible: false,
      reason: "duplicate_gate_failed",
      reasons,
      indexation: "NOINDEX",
      canonical,
      lifecycle,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  // Homepage / empty search landing: INDEX without listingCount requirement
  const indexation: SeoIndexationDecision =
    lifecycle?.indexation === "INDEX" || !lifecycle ? "INDEX" : lifecycle.indexation;

  if (indexation !== "INDEX") {
    reasons.push(`lifecycle_${indexation}`);
    return {
      eligible: false,
      reason: `lifecycle_${indexation}`,
      reasons,
      indexation,
      canonical,
      lifecycle,
      protection,
      sitemapEligible: false,
      structuredDataEligible: false,
    };
  }

  reasons.push("eligibility_pass");
  const sitemapEligible = lifecycle ? lifecycle.sitemapEligible : true;
  const structuredDataEligible = lifecycle ? lifecycle.structuredDataEligible : true;

  return {
    eligible: true,
    reason: "eligibility_pass",
    reasons,
    indexation: "INDEX",
    canonical,
    lifecycle,
    protection,
    sitemapEligible,
    structuredDataEligible,
  };
}

/** Helper: listing PDP eligibility from existing product fields. */
export function evaluateListingSeoEligibility(input: {
  slug: string;
  productFound: boolean;
  status?: ProductStatus | null;
}): SeoEligibilityResult {
  return evaluateSeoEligibility({
    pageType: "product",
    path: `/listing/${input.slug}`,
    productFound: input.productFound,
    productStatus: input.status,
    softUnavailable: !input.productFound,
  });
}

export { absoluteCanonicalFromPath };
