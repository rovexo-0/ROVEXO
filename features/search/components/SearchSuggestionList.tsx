"use client";

import Link from "next/link";
import { useMemo } from "react";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons/icons";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/products/types";
import type { SearchResults } from "@/features/search/types";
import { SearchResultCard } from "@/features/search/components/SearchResultCard";
import { highlightMatch } from "@/features/search/utils/highlight-match";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type SearchSuggestionListProps = {
  results: SearchResults;
  query: string;
  activeIndex: number;
  navOffset: number;
  onHoverIndex: (index: number) => void;
  onNavigate?: () => void;
  maxProducts?: number;
  /** Restrict row kinds — Search System v1.0 Items section uses products only. */
  kinds?: Array<"product" | "category" | "brand" | "location">;
};

const SUGGESTION_ICONS = {
  category: RovexoIcons.dashboard.categories,
  brand: RovexoIcons.seller.listings,
  location: RovexoIcons.dashboard.addresses,
} as const;

type SuggestionRow =
  | { kind: "product"; key: string; product: Product }
  | { kind: "category" | "brand" | "location"; key: string; href: string; title: string };

export function SearchSuggestionList({
  results,
  query,
  activeIndex,
  navOffset,
  onHoverIndex,
  onNavigate,
  maxProducts = 5,
  kinds = ["product", "category", "brand", "location"],
}: SearchSuggestionListProps) {
  const kindsSet = useMemo(() => new Set(kinds), [kinds]);

  const rows = useMemo(() => {
    const items: SuggestionRow[] = [];

    if (kindsSet.has("product")) {
      for (const product of results.products.slice(0, maxProducts)) {
        items.push({ kind: "product", key: product.id, product });
      }
    }

    if (kindsSet.has("category")) {
      for (const category of results.categories) {
        items.push({
          kind: "category",
          key: category.href,
          href: category.href,
          title: category.name,
        });
      }
    }

    if (kindsSet.has("brand")) {
      for (const brand of results.brands) {
        items.push({
          kind: "brand",
          key: brand.href,
          href: brand.href,
          title: brand.name,
        });
      }
    }

    if (kindsSet.has("location")) {
      for (const location of results.locations) {
        items.push({
          kind: "location",
          key: location.href,
          href: location.href,
          title: location.name,
        });
      }
    }

    return items;
  }, [kindsSet, maxProducts, results]);

  if (rows.length === 0) return null;

  return (
    <ul className="flex flex-col gap-ds-2" role="listbox" aria-label="Search suggestions">
      {rows.map((row, index) => {
        const currentIndex = navOffset + index;
        const isActive = activeIndex === currentIndex;

        if (row.kind === "product") {
          return (
            <SearchResultCard
              key={row.key}
              product={row.product}
              query={query}
              elementId={`search-nav-item-${currentIndex}`}
              isActive={isActive}
              onHover={() => onHoverIndex(currentIndex)}
              onNavigate={onNavigate}
            />
          );
        }

        return (
          <li key={row.key} className="min-h-[44px]">
            <Link
              href={row.href}
              role="option"
              aria-selected={isActive}
              id={`search-nav-item-${currentIndex}`}
              onMouseEnter={() => onHoverIndex(currentIndex)}
              onClick={onNavigate}
              className={cn(
                "flex min-h-[44px] items-center gap-ds-3 rounded-ds-md px-ds-3 py-ds-2 text-sm text-text-primary hover:bg-secondary",
                focusRing,
                transitionFast,
                isActive && "bg-secondary ring-2 ring-primary/20",
              )}
            >
              <span aria-hidden className="flex w-6 shrink-0 justify-center">
                <RovexoIcon icon={SUGGESTION_ICONS[row.kind]} size={20} />
              </span>
              <span className="truncate">{highlightMatch(row.title, query)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
