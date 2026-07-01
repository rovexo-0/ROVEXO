"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "@/lib/products/types";
import { RovexoListingCard } from "@/components/home/RovexoListingCard";
import { useInfiniteCarousel } from "@/components/home/hooks/useInfiniteCarousel";
import { cn } from "@/lib/cn";

type RovexoListingCarouselSectionProps = {
  id: string;
  title: string;
  products: Product[];
  viewAllHref?: string;
  emptyState?: ReactNode;
  maxVisible?: number;
};

export function RovexoListingCarouselSection({
  id,
  title,
  products,
  viewAllHref,
  emptyState,
  maxVisible = 12,
}: RovexoListingCarouselSectionProps) {
  const visibleProducts = products.slice(0, maxVisible);
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
  } = useInfiniteCarousel({
    itemCount: visibleProducts.length,
    trackSelector: ".home-v1-listing-track",
    autoScrollSpeed: 0.45,
    enableMomentum: true,
    resumeDelayMs: 320,
  });

  if (products.length === 0) {
    return emptyState ? <section className="home-v1-listing-section">{emptyState}</section> : null;
  }

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="home-v1-listing-section">
      <div className="home-v1-listing-section__header">
        <h2 id={`${id}-heading`} className="home-v1-listing-section__title">
          {title}
        </h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="home-v1-listing-section__view-all">
            View All
          </Link>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className={cn(
          "home-v1-listing-scroller home-v1-listing-marquee premium-infinite-scroller",
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
        <div className="home-v1-listing-track">
          {Array.from({ length: loopCopies }, (_, copyIndex) => (
            <div
              key={copyIndex}
              className="home-v1-listing-track__set"
              aria-hidden={copyIndex > 0 ? true : undefined}
            >
              {visibleProducts.map((product) => (
                <RovexoListingCard
                  key={`${copyIndex}-${product.id}`}
                  product={product}
                  className="home-v1-listing-card--rail"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
