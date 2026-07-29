"use client";

import { MarketplaceNoProductsEmpty } from "@/features/search/components/MarketplaceNoProductsEmpty";

type SearchResultsEmptyProps = {
  variant: "idle" | "no-results";
  query?: string;
  resultCount?: number;
  entity?: string;
};

/**
 * Owner UI Lock — Global Empty State (Search & Browse).
 * Idle: render nothing (Recent / Trending / categories own idle UX).
 * No-results: canonical "No products found" only.
 */
export function SearchResultsEmpty({ variant }: SearchResultsEmptyProps) {
  if (variant === "idle") return null;
  return <MarketplaceNoProductsEmpty />;
}
