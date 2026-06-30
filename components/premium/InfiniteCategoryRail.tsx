"use client";

import { CategoryCard } from "@/components/premium/CategoryCard";
import { PREMIUM_CATEGORIES } from "@/components/premium/constants";
import { useInfiniteCarousel } from "@/components/premium/hooks/useInfiniteCarousel";
import { cn } from "@/lib/cn";

export function InfiniteCategoryRail() {
  const carousel = useInfiniteCarousel({ itemCount: PREMIUM_CATEGORIES.length });

  const renderSet = (copyIndex: number) =>
    PREMIUM_CATEGORIES.map((category) => (
      <CategoryCard
        key={`${copyIndex}-${category.slug}`}
        category={category}
        onNavigate={() => {
          if (carousel.shouldSuppressClick()) return;
        }}
      />
    ));

  return (
    <section aria-label="Shop by category" className="premium-section">
      <div className="premium-container">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Explore</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Infinite Categories
            </h2>
          </div>
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
          <div className="premium-infinite-track flex w-max gap-4 sm:gap-5">
            {Array.from({ length: carousel.loopCopies }, (_, copyIndex) => (
              <div key={copyIndex} className="flex shrink-0 gap-4 sm:gap-5" aria-hidden={copyIndex > 0}>
                {renderSet(copyIndex)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
