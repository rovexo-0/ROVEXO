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
import { useMobileHeaderScrollContext } from "@/components/home/MobileHeaderScrollContext";
import { ProductCarouselSection } from "@/components/home/ProductCarouselSection";
import { HomeHero } from "@/components/home/HomeHero";
import { CategoryGridSection, type HomeCategoryCard } from "@/components/home/CategoryGridSection";
import { TrendingSearchesSection } from "@/components/home/TrendingSearchesSection";
import { RecentlyViewedSection } from "@/features/launch/components/RecentlyViewedSection";
import { cn } from "@/lib/cn";
import { transitionFast } from "@/components/ui/tokens";

type HomeContentProps = {
  categories: HomeCategoryCard[];
  featured: Product[];
  trending: Product[];
  newToday: Product[];
  recommended: Product[];
  recommendedHasMore: boolean;
  sponsoredProducts?: Product[];
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
  categories,
  featured,
  trending: initialTrending,
  newToday: initialNewToday,
  recommended: initialRecommended,
  recommendedHasMore: initialRecommendedHasMore,
  sponsoredProducts = [],
  loadError = false,
}: HomeContentProps) {
  const [trending, setTrending] = useState(initialTrending);
  const [newToday, setNewToday] = useState(initialNewToday);
  const [recommended, setRecommended] = useState(initialRecommended);
  const [recommendedPage, setRecommendedPage] = useState(1);
  const [hasMoreRecommended, setHasMoreRecommended] = useState(initialRecommendedHasMore);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshError, setRefreshError] = useState(false);
  const [, startTransition] = useTransition();
  const scroll = useMobileHeaderScrollContext();
  const usesHeaderSpacer = Boolean(scroll);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(false);

    try {
      const [trendingPage, newPage, recommendedPageData] = await Promise.all([
        fetchSection("trending", 1),
        fetchSection("new", 1),
        fetchSection("trending", 1),
      ]);

      setTrending(trendingPage.items);
      setNewToday(newPage.items);
      setRecommended(recommendedPageData.items);
      setRecommendedPage(1);
      setHasMoreRecommended(recommendedPageData.hasMore);
    } catch {
      setRefreshError(true);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, []);

  const loadMoreRecommended = useCallback(async () => {
    if (isLoadingMore || !hasMoreRecommended) return;

    setIsLoadingMore(true);

    try {
      const nextPage = recommendedPage + 1;
      const data = await fetchSection("trending", nextPage);
      setRecommended((current) => [...current, ...data.items]);
      setRecommendedPage(nextPage);
      setHasMoreRecommended(data.hasMore);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMoreRecommended, isLoadingMore, recommendedPage]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMoreRecommended || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore && hasMoreRecommended) {
          startTransition(() => {
            void loadMoreRecommended();
          });
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreRecommended, isLoadingMore, loadMoreRecommended, recommended.length]);

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
          "flex flex-col gap-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))] md:gap-ds-7 lg:mx-auto lg:max-w-7xl lg:w-full",
          usesHeaderSpacer
            ? "pt-0 lg:pt-[calc(8rem+env(safe-area-inset-top))]"
            : "pt-[calc(11rem+env(safe-area-inset-top))] lg:pt-[calc(8rem+env(safe-area-inset-top))]",
        )}
      >
        <HomeHero className="mt-ds-1" />

        <ProductCarouselSection
          id="featured-heading"
          title="⭐ Featured Listings"
          products={featured}
          loading={showSkeletons}
          error={sectionError}
          viewAllHref="/search?q=&featured=1"
        />

        <ProductCarouselSection
          id="trending-heading"
          title="🔥 Trending Today"
          products={trending}
          loading={showSkeletons}
          error={sectionError}
        />

        <ProductCarouselSection
          id="new-heading"
          title="🆕 New Today"
          products={newToday}
          loading={showSkeletons}
          error={sectionError}
        />

        <ProductCarouselSection
          id="recommended-heading"
          title="❤️ Recommended For You"
          products={recommended}
          loading={showSkeletons}
          loadingMore={isLoadingMore}
          error={sectionError}
          footer={<div ref={loadMoreRef} className="h-ds-2" aria-hidden />}
        />

        {sponsoredProducts.length > 0 ? (
          <ProductCarouselSection
            id="sponsored-heading"
            title="Sponsored Listings"
            products={sponsoredProducts}
            loading={showSkeletons}
            error={sectionError}
          />
        ) : null}

        <CategoryGridSection categories={categories} />

        <TrendingSearchesSection />

        <RecentlyViewedSection />
      </main>
    </div>
  );
});
