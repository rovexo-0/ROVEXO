"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import { productToCardProps } from "@/lib/products/card";
import type { Product, ProductsPage } from "@/lib/products/types";
import { ProductGridSkeleton, ProductSectionEmpty } from "@/components/home/ProductSectionStates";
import { ProductSection } from "@/components/home/ProductSection";
import { HomeHero } from "@/components/home/HomeHero";
import { CategoryGridSection, type HomeCategoryCard } from "@/components/home/CategoryGridSection";
import { TrendingSearchesSection } from "@/components/home/TrendingSearchesSection";
import { transitionFast } from "@/components/ui/tokens";

type HomeContentProps = {
  categories: HomeCategoryCard[];
  featured: Product[];
  trending: Product[];
  newToday: Product[];
  recommended: Product[];
  recommendedHasMore: boolean;
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

export function HomeContent({
  categories,
  featured,
  trending: initialTrending,
  newToday: initialNewToday,
  recommended: initialRecommended,
  recommendedHasMore: initialRecommendedHasMore,
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
  }, [hasMoreRecommended, isLoadingMore, loadMoreRecommended]);

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
        className={`flex items-center justify-center overflow-hidden text-sm text-text-secondary ${transitionFast}`}
        style={{ height: pullDistance > 0 || isRefreshing ? Math.max(pullDistance, isRefreshing ? 40 : 0) : 0 }}
      >
        {isRefreshing ? "Refreshing…" : pullDistance >= PULL_THRESHOLD ? "Release to refresh" : pullDistance > 0 ? "Pull to refresh" : null}
      </div>

      <main className="flex flex-col gap-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))] pt-[calc(7.5rem+env(safe-area-inset-top))] md:gap-ds-7 lg:mx-auto lg:max-w-7xl lg:w-full lg:pt-[calc(8rem+env(safe-area-inset-top))]">
        <HomeHero />

        <CategoryGridSection categories={categories} />

        <TrendingSearchesSection />

        <ProductSection
          id="featured-heading"
          title="Featured Listings"
          products={featured}
          loading={showSkeletons}
          error={sectionError}
          viewAllHref="/search?q=&featured=1"
        />

        <ProductSection
          id="trending-heading"
          title="Trending Today"
          products={trending}
          loading={showSkeletons}
          error={sectionError}
        />

        <ProductSection
          id="new-heading"
          title="Latest Listings"
          products={newToday}
          loading={showSkeletons}
          error={sectionError}
        />

        <section aria-labelledby="recommended-heading" className="px-ds-4">
          <h2 id="recommended-heading" className="mb-ds-3 text-lg font-semibold text-text-primary">
            Recommended For You
          </h2>
          <div className="grid grid-cols-2 gap-ds-3 md:grid-cols-3 md:gap-ds-4 lg:grid-cols-4">
            {showSkeletons ? (
              <ProductGridSkeleton count={4} />
            ) : sectionError ? (
              <div
                role="alert"
                className="col-span-full rounded-ds-xl border border-danger/30 bg-danger/5 px-ds-5 py-ds-6 text-center text-sm text-text-secondary"
              >
                Unable to load recommendations.
              </div>
            ) : recommended.length === 0 ? (
              <ProductSectionEmpty title="recommendations" />
            ) : (
              recommended.map((product) => (
                <div key={product.id} className="h-full">
                  <ProductCard {...productToCardProps(product, "homepage")} />
                </div>
              ))
            )}
            {isLoadingMore && <ProductGridSkeleton count={2} />}
          </div>
          <div ref={loadMoreRef} className="h-ds-2" aria-hidden />
        </section>
      </main>
    </div>
  );
}
