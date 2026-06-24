"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { Product, ProductsPage } from "@/lib/products/types";
import { ProductCarouselSection } from "@/components/home/ProductCarouselSection";
import { HomeCategoryRail } from "@/components/home/HomeCategoryRail";
import { HomeRecentlyViewedCarousel } from "@/components/home/HomeRecentlyViewedCarousel";
import { AuctionsSection } from "@/components/home/AuctionsSection";
import { cn } from "@/lib/cn";
import { transitionFast } from "@/components/ui/tokens";
import "@/styles/home-premium-polish.css";

type HomeContentProps = {
  featured: Product[];
  popular: Product[];
  popularHasMore: boolean;
  recommended: Product[];
  newest: Product[];
  loadError?: boolean;
};

const PULL_THRESHOLD = 72;

async function fetchSection(section: string, page: number): Promise<ProductsPage> {
  const response = await fetch(`/api/products?section=${section}&page=${page}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export const HomeContent = memo(function HomeContent({
  featured,
  popular: initialPopular,
  popularHasMore: initialPopularHasMore,
  recommended,
  newest,
  loadError = false,
}: HomeContentProps) {
  const [popular, setPopular] = useState(initialPopular);
  const [popularPage, setPopularPage] = useState(1);
  const [hasMorePopular, setHasMorePopular] = useState(initialPopularHasMore);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMorePopular, setIsLoadingMorePopular] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshError, setRefreshError] = useState(false);
  const [, startTransition] = useTransition();

  const loadMorePopularRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(false);

    try {
      const popularPageData = await fetchSection("popular", 1);
      setPopular(popularPageData.items);
      setPopularPage(1);
      setHasMorePopular(popularPageData.hasMore);
    } catch {
      setRefreshError(true);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, []);

  const loadMorePopular = useCallback(async () => {
    if (isLoadingMorePopular || !hasMorePopular) return;

    setIsLoadingMorePopular(true);

    try {
      const nextPage = popularPage + 1;
      const data = await fetchSection("popular", nextPage);
      setPopular((current) => [...current, ...data.items]);
      setPopularPage(nextPage);
      setHasMorePopular(data.hasMore);
    } finally {
      setIsLoadingMorePopular(false);
    }
  }, [hasMorePopular, isLoadingMorePopular, popularPage]);

  useEffect(() => {
    const node = loadMorePopularRef.current;
    if (!node || !hasMorePopular || isLoadingMorePopular) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          startTransition(() => {
            void loadMorePopular();
          });
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMorePopular, isLoadingMorePopular, loadMorePopular, popular.length]);

  function handleTouchStart(event: React.TouchEvent) {
    if (window.scrollY > 0 || isRefreshing) return;
    touchStartY.current = event.touches[0]?.clientY ?? 0;
    isPulling.current = true;
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (!isPulling.current || isRefreshing) return;

    const currentY = event.touches[0]?.clientY ?? 0;
    const distance = Math.max(0, Math.min(currentY - touchStartY.current, 96));
    setPullDistance(distance);
  }

  function handleTouchEnd() {
    if (!isPulling.current) return;
    isPulling.current = false;

    setPullDistance((distance) => {
      if (distance >= PULL_THRESHOLD) {
        void refreshAll();
      }
      return distance >= PULL_THRESHOLD ? distance : 0;
    });
  }

  const showSkeletons = isRefreshing;
  const sectionError = loadError || refreshError;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        aria-live="polite"
        className={cn(
          "flex items-center justify-center overflow-hidden text-sm text-text-secondary",
          transitionFast,
        )}
        style={{ height: pullDistance > 0 || isRefreshing ? Math.max(pullDistance, isRefreshing ? 40 : 0) : 0 }}
      >
        {isRefreshing
          ? "Refreshing…"
          : pullDistance >= PULL_THRESHOLD
            ? "Release to refresh"
            : pullDistance > 0
              ? "Pull to refresh"
              : null}
      </div>

      <main
        className={cn(
          "home-premium-polish flex flex-col gap-ds-2 pb-[calc(var(--ds-space-7)+env(safe-area-inset-bottom))] lg:mx-auto lg:max-w-7xl lg:w-full",
        )}
      >
        <HomeCategoryRail />

        <ProductCarouselSection
          id="featured-heading"
          title="Featured Listings"
          products={featured}
          loading={showSkeletons}
          error={sectionError}
          viewAllHref="/search?q=&featured=1"
        />

        <ProductCarouselSection
          id="recommended-heading"
          title="Recommended For You"
          products={recommended}
          loading={showSkeletons}
          error={sectionError}
          viewAllHref="/search?q=&sort=trending"
        />

        <ProductCarouselSection
          id="latest-heading"
          title="Latest Listings"
          products={newest}
          loading={showSkeletons}
          error={sectionError}
          viewAllHref="/search?q=&sort=newest"
        />

        <ProductCarouselSection
          id="popular-near-heading"
          title="Popular Near You"
          products={popular}
          loading={showSkeletons}
          loadingMore={isLoadingMorePopular}
          error={sectionError}
          viewAllHref="/search?q=&sort=popular"
          footer={<div ref={loadMorePopularRef} className="h-ds-2" aria-hidden />}
        />

        <AuctionsSection />

        <HomeRecentlyViewedCarousel />
      </main>
    </div>
  );
});
