"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "@/lib/products/types";
import { ListingCard, type ListingCardVariant } from "@/components/premium/ListingCard";
import { useInfiniteCarousel } from "@/components/premium/hooks/useInfiniteCarousel";
import { cn } from "@/lib/cn";

type ListingCarouselSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
  variant?: ListingCardVariant | ((product: Product) => ListingCardVariant);
  emptyState?: ReactNode;
};

function resolveVariant(
  product: Product,
  variant: ListingCarouselSectionProps["variant"],
): ListingCardVariant {
  if (typeof variant === "function") return variant(product);
  return variant ?? "default";
}

export function ListingCarouselSection({
  id,
  title,
  subtitle,
  products,
  viewAllHref,
  variant,
  emptyState,
}: ListingCarouselSectionProps) {
  const carousel = useInfiniteCarousel({
    itemCount: products.length,
    autoScrollSpeed: 0.25,
  });

  if (products.length === 0) {
    return emptyState ? <section className="premium-section">{emptyState}</section> : null;
  }

  const renderSet = (copyIndex: number) =>
    products.map((product) => (
      <ListingCard
        key={`${copyIndex}-${product.id}`}
        product={product}
        variant={resolveVariant(product, variant)}
      />
    ));

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="premium-section">
      <div className="premium-container">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            {subtitle ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">{subtitle}</p>
            ) : null}
            <h2 id={`${id}-heading`} className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h2>
          </div>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="shrink-0 text-sm font-semibold text-violet-600 transition hover:text-violet-700"
            >
              View all
            </Link>
          ) : null}
        </div>

        <div
          ref={carousel.scrollerRef}
          className={cn(
            "premium-infinite-scroller -mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "cursor-grab active:cursor-grabbing",
          )}
          onPointerDown={carousel.onPointerDown}
          onPointerMove={carousel.onPointerMove}
          onPointerUp={carousel.onPointerUp}
          onPointerCancel={carousel.onPointerCancel}
          onMouseEnter={carousel.onMouseEnter}
          onMouseLeave={carousel.onMouseLeave}
          onTouchStart={carousel.onTouchStart}
          onTouchEnd={carousel.onTouchEnd}
          onScroll={carousel.onScroll}
        >
          <div className="premium-infinite-track flex w-max gap-3 sm:gap-4">
            {Array.from({ length: carousel.loopCopies }, (_, copyIndex) => (
              <div key={copyIndex} className="flex shrink-0 gap-3 sm:gap-4" aria-hidden={copyIndex > 0}>
                {renderSet(copyIndex)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
