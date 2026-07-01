"use client";

import Link from "next/link";
import { memo } from "react";
import type { RovexoBusiness } from "@/components/home/constants";
import { ROVEXO_VIEW_ALL } from "@/components/home/constants";
import { RovexoBusinessCard } from "@/components/home/RovexoBusinessCard";
import { useInfiniteCarousel } from "@/components/home/hooks/useInfiniteCarousel";
import { cn } from "@/lib/cn";

type RovexoBusinessesProps = {
  businesses: RovexoBusiness[];
};

export const RovexoBusinesses = memo(function RovexoBusinesses({
  businesses,
}: RovexoBusinessesProps) {
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
    itemCount: businesses.length,
    trackSelector: ".home-v1-business-track",
    autoScrollSpeed: 0.35,
    enableMomentum: true,
    resumeDelayMs: 320,
  });

  if (businesses.length === 0) return null;

  return (
    <section aria-labelledby="businesses-heading" className="home-v1-listing-section home-v1-business-section">
      <div className="home-v1-listing-section__header">
        <h2 id="businesses-heading" className="home-v1-listing-section__title">
          Businesses
        </h2>
        <Link href={ROVEXO_VIEW_ALL.businesses} className="home-v1-listing-section__view-all">
          View All
        </Link>
      </div>

      <div
        ref={scrollerRef}
        className={cn(
          "home-v1-listing-scroller home-v1-business-marquee premium-infinite-scroller",
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
        <div className="home-v1-business-track">
          {Array.from({ length: loopCopies }, (_, copyIndex) => (
            <div
              key={copyIndex}
              className="home-v1-business-track__set"
              aria-hidden={copyIndex > 0 ? true : undefined}
              {...(copyIndex > 0 ? { inert: true } : {})}
            >
              {businesses.map((business) => (
                <RovexoBusinessCard key={`${copyIndex}-${business.id}`} business={business} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
