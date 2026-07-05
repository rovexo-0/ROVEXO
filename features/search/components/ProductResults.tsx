"use client";

import { useRef } from "react";
import type { Product } from "@/lib/products/types";
import { SearchResultCard } from "@/features/search/components/SearchResultCard";
import { useIntersectionWhenVisible } from "@/lib/performance/hooks";

type ProductResultsProps = {
  items: Product[];
  query: string;
  activeIndex: number;
  navOffset: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onHoverIndex: (index: number) => void;
  onNavigate: () => void;
  onLoadMore: () => void;
};

export function ProductResults({
  items,
  query,
  activeIndex,
  navOffset,
  hasMore,
  isLoadingMore,
  onHoverIndex,
  onNavigate,
  onLoadMore,
}: ProductResultsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useIntersectionWhenVisible(onLoadMore, {
    targetRef: sentinelRef,
    enabled: hasMore && !isLoadingMore,
    rootMargin: "160px",
  });

  if (items.length === 0) return null;

  return (
    <>
      <ul className="flex flex-col gap-ds-2" role="listbox" aria-label="Products">
        {items.map((product, index) => {
          const navIndex = navOffset + index;
          return (
            <SearchResultCard
              key={product.id}
              product={product}
              query={query}
              elementId={`search-nav-item-${navIndex}`}
              isActive={activeIndex === navIndex}
              onHover={() => onHoverIndex(navIndex)}
              onNavigate={onNavigate}
            />
          );
        })}
      </ul>

      {hasMore && <div ref={sentinelRef} className="h-ds-2" aria-hidden />}
      {isLoadingMore && (
        <p className="px-ds-4 py-ds-2 text-center text-xs text-text-secondary" aria-live="polite">
          Loading more products…
        </p>
      )}
    </>
  );
}
