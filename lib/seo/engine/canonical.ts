/**
 * Wave 0 — Canonical Engine (SSOT).
 * One absolute canonical URL authority. Reuses getAppUrl() — no parallel generator.
 */

import { getAppUrl } from "@/lib/supabase/env";

/** Tracking / noise params that must never appear on canonical URLs. */
export const CANONICAL_STRIP_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "fbclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
  "source",
  "_ga",
  "_gl",
] as const;

export type SeoCanonicalSurface =
  | "homepage"
  | "category"
  | "product_type"
  | "brand"
  | "listing"
  | "store"
  | "seller"
  | "location"
  | "location_category"
  | "browse"
  | "discover"
  | "collection"
  | "trend"
  | "search"
  | "static"
  | "other";

export type ResolveCanonicalInput = {
  /** Path starting with `/`, or empty for homepage. */
  path: string;
  /** Optional query — tracking params stripped; other queries rejected for INDEX surfaces. */
  searchParams?: URLSearchParams | Record<string, string | undefined | null>;
  /** When true, any remaining query after strip forces fail-closed (no query on canonical). */
  allowQuery?: boolean;
};

export type SeoCanonicalResult = {
  canonicalUrl: string;
  canonicalPath: string;
  absolute: true;
  strippedParams: string[];
  /** False when path is private/auth or empty after sanitise. */
  valid: boolean;
  reason: string;
};

function toSearchParams(
  input?: URLSearchParams | Record<string, string | undefined | null>,
): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return new URLSearchParams(input.toString());
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value != null && value !== "") params.set(key, value);
  }
  return params;
}

function sanitizePath(path: string): string {
  const trimmed = (path || "/").trim();
  if (!trimmed.startsWith("/")) return `/${trimmed}`;
  // Collapse duplicate slashes except protocol (paths only).
  return trimmed.replace(/\/{2,}/g, "/") || "/";
}

/**
 * Absolute production-style canonical. Homepage always trailing slash.
 * Other paths: no trailing slash (Next default trailingSlash=false).
 */
export function resolveSeoCanonical(input: ResolveCanonicalInput): SeoCanonicalResult {
  const base = getAppUrl().replace(/\/$/, "");
  const stripped: string[] = [];
  const path = sanitizePath(input.path);

  if (path === "/login" || path.startsWith("/login/")) {
    return {
      canonicalUrl: `${base}/`,
      canonicalPath: "/",
      absolute: true,
      strippedParams: [],
      valid: false,
      reason: "canonical_must_not_point_to_login",
    };
  }

  const params = toSearchParams(input.searchParams);
  for (const key of [...params.keys()]) {
    if ((CANONICAL_STRIP_PARAMS as readonly string[]).includes(key)) {
      stripped.push(key);
      params.delete(key);
    }
  }

  const allowQuery = input.allowQuery === true;
  if (!allowQuery && [...params.keys()].length > 0) {
    // Fail closed: do not emit query-bearing canonicals for indexable surfaces.
    for (const key of [...params.keys()]) {
      stripped.push(key);
      params.delete(key);
    }
  }

  let canonicalPath = path;
  if (canonicalPath === "" || canonicalPath === "/") {
    canonicalPath = "/";
  } else if (canonicalPath.endsWith("/") && canonicalPath.length > 1) {
    canonicalPath = canonicalPath.replace(/\/+$/, "");
  }

  const query = allowQuery && [...params.keys()].length ? `?${params.toString()}` : "";
  const canonicalUrl =
    canonicalPath === "/" ? `${base}/` : `${base}${canonicalPath}${query}`;

  return {
    canonicalUrl,
    canonicalPath,
    absolute: true,
    strippedParams: stripped,
    valid: true,
    reason: stripped.length ? "canonical_query_stripped" : "canonical_ok",
  };
}

/** Convenience builders — path patterns only; eligibility decides indexability. */
export function canonicalForHomepage(): SeoCanonicalResult {
  return resolveSeoCanonical({ path: "/" });
}

export function canonicalForCategory(slugPath: string[]): SeoCanonicalResult {
  const path = `/category/${slugPath.filter(Boolean).join("/")}`;
  return resolveSeoCanonical({ path });
}

export function canonicalForBrand(slug: string): SeoCanonicalResult {
  return resolveSeoCanonical({ path: `/brand/${slug}` });
}

export function canonicalForListing(slug: string): SeoCanonicalResult {
  return resolveSeoCanonical({ path: `/listing/${slug}` });
}

export function canonicalForStore(slug: string): SeoCanonicalResult {
  return resolveSeoCanonical({ path: `/store/${slug}` });
}

export function canonicalForSeller(username: string): SeoCanonicalResult {
  return resolveSeoCanonical({ path: `/user/${username}` });
}

export function canonicalForLocation(locationSlug: string, categorySlugs?: string[]): SeoCanonicalResult {
  const tail = categorySlugs?.length ? `/${categorySlugs.join("/")}` : "";
  return resolveSeoCanonical({ path: `/l/${locationSlug}${tail}` });
}

/**
 * Align Next Metadata `alternates.canonical` with Wave 0 authority.
 * Prefer absolute URL string from resolveSeoCanonical.
 */
export function absoluteCanonicalFromPath(path: string): string {
  return resolveSeoCanonical({ path }).canonicalUrl;
}
