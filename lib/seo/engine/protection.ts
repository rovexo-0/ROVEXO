/**
 * Wave 0 — SEO Protection / Anti-Bloat Engine (SSOT).
 * Runs BEFORE eligibility is granted. Reuses index-control + AUTH_PROTECTED_PREFIXES.
 */

import { AUTH_PROTECTED_PREFIXES, AUTH_PUBLIC_PREFIXES } from "@/lib/auth/protected-routes";
import {
  isPrivatePath,
  shouldNoIndexDuplicateFilters,
  shouldNoIndexEmptyInventory,
} from "@/lib/seo/engine/index-control";
import { isIndexableInventory } from "@/lib/seo/engine/config";

export type SeoProtectionVerdict =
  | "ALLOW"
  | "BLOCK_NOINDEX"
  | "BLOCK_EXCLUDE"
  | "BLOCK_CANONICAL";

export type SeoProtectionResult = {
  allowed: boolean;
  verdict: SeoProtectionVerdict;
  reasons: string[];
  /** Suggested canonical when verdict is BLOCK_CANONICAL. */
  canonicalTarget?: string;
};

export type SeoProtectionInput = {
  path: string;
  /** Search / filter query present (e.g. ?q=). */
  hasSearchQuery?: boolean;
  /** URLSearchParams or count of active facet filters. */
  searchParams?: URLSearchParams;
  activeFilterCount?: number;
  listingCount?: number;
  /** Facet depth / combination count for browse. */
  facetCount?: number;
  duplicateRisk?: number;
  taxonomyValid?: boolean;
  /** True for soft-unavailable / missing public surfaces. */
  softUnavailable?: boolean;
};

function isAuthPublicPath(pathname: string): boolean {
  return AUTH_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthProtectedPath(pathname: string): boolean {
  return AUTH_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Anti-bloat + private-route protection.
 * Fail closed: any block reason → not allowed for INDEX.
 */
export function evaluateSeoProtection(input: SeoProtectionInput): SeoProtectionResult {
  const path = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const reasons: string[] = [];

  if (path.startsWith("/api")) {
    return { allowed: false, verdict: "BLOCK_EXCLUDE", reasons: ["api_route_excluded"] };
  }

  // Auth public surfaces (login/register/…) — crawlable HTML but never INDEX.
  if (isAuthPublicPath(path)) {
    return {
      allowed: false,
      verdict: "BLOCK_NOINDEX",
      reasons: ["auth_public_surface_noindex"],
    };
  }

  if (isAuthProtectedPath(path) || isPrivatePath(path)) {
    return {
      allowed: false,
      verdict: "BLOCK_EXCLUDE",
      reasons: ["private_or_auth_protected_route"],
    };
  }

  if (input.softUnavailable) {
    return {
      allowed: false,
      verdict: "BLOCK_NOINDEX",
      reasons: ["soft_unavailable_noindex"],
    };
  }

  if (input.taxonomyValid === false) {
    return {
      allowed: false,
      verdict: "BLOCK_NOINDEX",
      reasons: ["invalid_taxonomy_combination"],
    };
  }

  if (path.startsWith("/search") && input.hasSearchQuery) {
    return {
      allowed: false,
      verdict: "BLOCK_NOINDEX",
      reasons: ["search_results_query_noindex"],
    };
  }

  if (input.searchParams && shouldNoIndexDuplicateFilters(input.searchParams)) {
    return {
      allowed: false,
      verdict: "BLOCK_NOINDEX",
      reasons: ["filter_combination_explosion"],
    };
  }

  if (typeof input.activeFilterCount === "number" && input.activeFilterCount > 2) {
    return {
      allowed: false,
      verdict: "BLOCK_NOINDEX",
      reasons: ["filter_combination_explosion"],
    };
  }

  if (typeof input.facetCount === "number" && input.facetCount >= 3) {
    reasons.push("long_tail_facet_depth");
  }

  if (typeof input.duplicateRisk === "number" && input.duplicateRisk >= 0.85) {
    return {
      allowed: false,
      verdict: "BLOCK_NOINDEX",
      reasons: ["duplicate_content_risk"],
    };
  }

  if (typeof input.listingCount === "number") {
    if (input.listingCount === 0) {
      return {
        allowed: false,
        verdict: "BLOCK_NOINDEX",
        reasons: ["empty_inventory_thin_page"],
      };
    }
    if (shouldNoIndexEmptyInventory(input.listingCount)) {
      return {
        allowed: false,
        verdict: "BLOCK_NOINDEX",
        reasons: [`thin_inventory_below_min_${input.listingCount}`],
      };
    }
  }

  if (reasons.includes("long_tail_facet_depth") && typeof input.listingCount === "number") {
    if (!isIndexableInventory(input.listingCount, true)) {
      return {
        allowed: false,
        verdict: "BLOCK_NOINDEX",
        reasons: [...reasons, "long_tail_inventory_gate"],
      };
    }
  }

  return {
    allowed: true,
    verdict: "ALLOW",
    reasons: reasons.length ? reasons : ["protection_pass"],
  };
}

/** True when path must never be INDEX (private / auth / API). */
export function isSeoIndexExcludedPath(pathname: string): boolean {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (path.startsWith("/api")) return true;
  if (isAuthProtectedPath(path) || isPrivatePath(path) || isAuthPublicPath(path)) return true;
  return false;
}
