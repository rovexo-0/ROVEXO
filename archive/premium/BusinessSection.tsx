"use client";

import Link from "next/link";
import type { Product } from "@/lib/products/types";
import { BusinessCard } from "@/components/premium/BusinessCard";
import { PREMIUM_VIEW_ALL, deriveBusinessesFromProducts } from "@/components/premium/constants";
import { useInfiniteCarousel } from "@/components/premium/hooks/useInfiniteCarousel";
import { cn } from "@/lib/cn";

type BusinessSectionProps = {
  products: Product[];
};

export function BusinessSection({ products }: BusinessSectionProps) {
  const businesses = deriveBusinessesFromProducts(products);
  const {
    scrollerRef,
    loopCopies,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onMouseEnter,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
    onScroll,
  } = useInfiniteCarousel({ itemCount: businesses.length, autoScrollSpeed: 0.2 });

  const renderSet = (copyIndex: number) =>
    businesses.map((business) => (
      <BusinessCard key={`${copyIndex}-${business.id}`} business={business} />
    ));

  return (
    <section aria-label="Verified businesses" className="premium-section">
      <div className="premium-container">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Trusted sellers</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Businesses</h2>
          </div>
          <Link href={PREMIUM_VIEW_ALL.businesses} className="text-sm font-semibold text-violet-600 hover:text-violet-700">
            View all
          </Link>
        </div>

        <div
          ref={scrollerRef}
          className={cn(
            "premium-infinite-scroller -mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "cursor-grab active:cursor-grabbing",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onScroll={onScroll}
        >
          <div className="premium-infinite-track flex w-max gap-4">
            {Array.from({ length: loopCopies }, (_, copyIndex) => (
              <div key={copyIndex} className="flex shrink-0 gap-4" aria-hidden={copyIndex > 0}>
                {renderSet(copyIndex)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
