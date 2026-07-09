import type { Metadata } from "next";
import { isIndexableInventory } from "@/lib/seo/engine/config";

/** Surfaces that must never be indexed. */
export const NOINDEX_PATH_PREFIXES = [
  "/admin",
  "/api",
  "/checkout",
  "/account",
  "/seller",
  "/business",
  "/messages",
  "/orders",
  "/saved",
  "/notifications",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auctions",
  "/sell/auction",
  "/super-admin",
  "/staff",
  "/403",
] as const;

export function isPrivatePath(pathname: string): boolean {
  return NOINDEX_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function shouldNoIndexSearchResults(hasQuery: boolean): boolean {
  return hasQuery;
}

export function shouldNoIndexEmptyInventory(listingCount: number): boolean {
  return !isIndexableInventory(listingCount);
}

export function shouldNoIndexDuplicateFilters(params: URLSearchParams): boolean {
  const filterKeys = ["page", "sort", "brand", "condition", "minPrice", "maxPrice", "location"];
  let activeFilters = 0;
  for (const key of filterKeys) {
    if (params.get(key)) activeFilters += 1;
  }
  return activeFilters > 2;
}

export function robotsForInventory(listingCount: number): Metadata["robots"] {
  if (shouldNoIndexEmptyInventory(listingCount)) {
    return { index: false, follow: true };
  }
  return { index: true, follow: true };
}
