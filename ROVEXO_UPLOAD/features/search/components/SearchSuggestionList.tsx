"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { Price } from "@/components/ui/Price";
import { productToCardProps } from "@/lib/products/card";
import type { SearchResults } from "@/features/search/types";
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
};

const ICONS = {
  product: "🔍",
  category: "📂",
  brand: "🏷",
  location: "📍",
} as const;

type SuggestionRow =
  | { kind: "product"; key: string; href: string; title: string; price: number; imageUrl: string }
  | { kind: "category" | "brand" | "location"; key: string; href: string; title: string };

export function SearchSuggestionList({
  results,
  query,
  activeIndex,
  navOffset,
  onHoverIndex,
  onNavigate,
  maxProducts = 5,
}: SearchSuggestionListProps) {
  const rows = useMemo(() => {
    const items: SuggestionRow[] = [];

    for (const product of results.products.slice(0, maxProducts)) {
      const props = productToCardProps(product);
      items.push({
        kind: "product",
        key: product.id,
        href: props.href,
        title: product.title,
        price: props.price,
        imageUrl: props.imageUrl,
      });
    }

    for (const category of results.categories) {
      items.push({
        kind: "category",
        key: category.href,
        href: category.href,
        title: category.name,
      });
    }

    for (const brand of results.brands) {
      items.push({
        kind: "brand",
        key: brand.href,
        href: brand.href,
        title: brand.name,
      });
    }

    for (const location of results.locations) {
      items.push({
        kind: "location",
        key: location.href,
        href: location.href,
        title: location.name,
      });
    }

    return items;
  }, [maxProducts, results]);

  if (rows.length === 0) return null;

  return (
    <ul className="flex flex-col gap-ds-1" role="listbox" aria-label="Search suggestions">
      {rows.map((row, index) => {
        const currentIndex = navOffset + index;
        const isActive = activeIndex === currentIndex;

        if (row.kind === "product") {
          return (
            <li key={row.key} className="min-h-[52px]">
              <Link
                href={row.href}
                role="option"
                aria-selected={isActive}
                id={`search-nav-item-${currentIndex}`}
                onClick={onNavigate}
                onMouseEnter={() => onHoverIndex(currentIndex)}
                className={cn(
                  "flex min-h-[52px] items-center gap-ds-3 rounded-ds-md px-ds-3 py-ds-2 text-sm text-text-primary hover:bg-secondary",
                  focusRing,
                  transitionFast,
                  isActive && "bg-secondary ring-2 ring-primary/20",
                )}
              >
                <span aria-hidden className="w-6 shrink-0 text-center">
                  {ICONS.product}
                </span>
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-ds-sm bg-surface-muted">
                  <Image
                    src={row.imageUrl}
                    alt=""
                    fill
                    loading="lazy"
                    sizes="40px"
                    className="object-contain"
                  />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {highlightMatch(row.title, query)}
                </span>
                <Price amount={row.price} size="sm" className="shrink-0" />
              </Link>
            </li>
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
              <span aria-hidden className="w-6 shrink-0 text-center">
                {ICONS[row.kind]}
              </span>
              <span className="truncate">{highlightMatch(row.title, query)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
