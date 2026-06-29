"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useCallback, useMemo, type MouseEvent } from "react";
import { HomeCategoryIconImage } from "@/components/home/HomeCategoryIconImage";
import { useCategoryRailInfiniteCarousel } from "@/components/home/useCategoryRailInfiniteCarousel";
import { HOME_CATEGORY_NAV } from "@/lib/home/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HomeCategoryRailProps = {
  className?: string;
  iconSize?: number;
  gap?: number;
};

function triggerCategoryHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(8);
  }
}

export const HomeCategoryRail = memo(function HomeCategoryRail({
  className,
  iconSize = 80,
  gap,
}: HomeCategoryRailProps) {
  const pathname = usePathname();

  const carousel = useCategoryRailInfiniteCarousel({
    itemCount: HOME_CATEGORY_NAV.length,
    gap,
  });

  const loopedCategories = useMemo(
    () =>
      Array.from({ length: carousel.loopCopies }, (_, copyIndex) =>
        HOME_CATEGORY_NAV.map((category) => ({ category, copyIndex })),
      ).flat(),
    [carousel.loopCopies],
  );

  const handlePress = useCallback(() => {
    triggerCategoryHaptic();
  }, []);

  const handleLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (carousel.shouldSuppressClick()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      handlePress();
    },
    [carousel, handlePress],
  );

  return (
    <section
      aria-labelledby="home-categories-heading"
      className={cn("rx-category-rail-section px-ds-4", className)}
    >
      <h2 id="home-categories-heading" className="sr-only">
        Categories
      </h2>

      <div
        ref={carousel.scrollerRef}
        className="rx-category-rail rx-category-rail--infinite -mx-ds-4 px-ds-4"
        role="list"
        aria-label="Shop by category"
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
        <div
          className="rx-category-rail__track"
          data-category-renderer="HomeCategoryIconImage-premium"
          style={gap != null ? { gap } : undefined}
        >
          {loopedCategories.map(({ category, copyIndex }) => {
            const href = category.href ?? `/category/${category.slug}`;
            const isSelected = pathname === href || pathname.startsWith(`${href}/`);
            const itemIndex = HOME_CATEGORY_NAV.findIndex((item) => item.slug === category.slug);

            return (
              <Link
                key={`${copyIndex}-${category.slug}`}
                href={href}
                role="listitem"
                onClick={handleLinkClick}
                aria-current={copyIndex === 1 && isSelected ? "page" : undefined}
                aria-hidden={copyIndex !== 1 ? true : undefined}
                tabIndex={copyIndex !== 1 ? -1 : undefined}
                className={cn(
                  "rx-category-card",
                  isSelected && copyIndex === 1 && "rx-category-card--selected",
                  focusRing,
                )}
                draggable={false}
              >
                <span className="rx-category-icon">
                  <HomeCategoryIconImage
                    type={category.icon}
                    size={iconSize}
                    variant="premium"
                    staged
                    priority={copyIndex === 1 && itemIndex < 4}
                  />
                </span>
                <span className="rx-category-card__text">
                  <span className="rx-category-card__title">{category.name}</span>
                  <span className="rx-category-card__subtitle">{category.subtitle}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
});
