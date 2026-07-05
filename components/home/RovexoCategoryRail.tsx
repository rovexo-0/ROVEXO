"use client";

import { RovexoCategoryCard } from "@/components/home/RovexoCategoryCard";
import { ROVEXO_CATEGORIES } from "@/components/home/constants";
import { useInfiniteCarousel } from "@/components/home/hooks/useInfiniteCarousel";
import { cn } from "@/lib/cn";

export function RovexoCategoryRail() {
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
    shouldSuppressClick,
  } = useInfiniteCarousel({
    itemCount: ROVEXO_CATEGORIES.length,
    trackSelector: ".home-v1-category-track",
    mobileOnly: true,
    enableMomentum: true,
    autoScrollSpeed: 0.5,
    resumeDelayMs: 320,
  });

  const renderSet = (copyIndex: number) =>
    ROVEXO_CATEGORIES.map((category) => (
      <RovexoCategoryCard
        key={`${copyIndex}-${category.slug}`}
        category={category}
        onNavigate={() => {
          if (shouldSuppressClick()) return;
        }}
      />
    ));

  return (
    <section aria-label="Categories" className="home-v1-categories">
      <div
        ref={scrollerRef}
        className={cn(
          "home-v1-category-scroller home-v1-category-marquee premium-infinite-scroller",
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
        <div className="home-v1-category-track">
          {Array.from({ length: loopCopies }, (_, copyIndex) => (
            <div
              key={copyIndex}
              className="home-v1-category-track__set"
              aria-hidden={copyIndex > 0 ? true : undefined}
            >
              {renderSet(copyIndex)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
