"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { productToCardProps } from "@/lib/products/card";
import type { Product } from "@/lib/products/types";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type ProductResultsProps = {
  items: Product[];
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
  activeIndex,
  navOffset,
  hasMore,
  isLoadingMore,
  onHoverIndex,
  onNavigate,
  onLoadMore,
}: ProductResultsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "160px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (items.length === 0) return null;

  return (
    <>
      <ul className="flex flex-col gap-ds-2" role="listbox" aria-label="Products">
        {items.map((product, index) => {
          const props = productToCardProps(product);
          const navIndex = navOffset + index;
          const isActive = activeIndex === navIndex;

          return (
            <li key={product.id}>
              <Link
                href={props.href}
                role="option"
                aria-selected={isActive}
                onClick={onNavigate}
                onMouseEnter={() => onHoverIndex(navIndex)}
                className={cn(
                  "premium-menu-row premium-glass flex min-h-ds-7 items-center gap-ds-3 rounded-ds-lg p-ds-2",
                  focusRing,
                  transitionFast,
                  isActive && "border-primary/30 bg-surface-muted",
                )}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
                  <Image
                    src={props.imageUrl}
                    alt={props.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{props.title}</p>
                  <Price amount={props.price} size="sm" />
                </div>
              </Link>
            </li>
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
