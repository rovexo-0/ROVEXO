"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { useSearchOverlayOptional } from "@/features/search/client";
import { VoiceSearchPlaceholder } from "@/features/search/components/VoiceSearchPlaceholder";
import { defaultCategories, defaultTrendingSearches } from "@/lib/search/defaults";

export function SearchLandingClient() {
  const searchOverlay = useSearchOverlayOptional();

  useEffect(() => {
    searchOverlay?.open();
  }, [searchOverlay]);

  return (
    <div className="flex flex-col gap-ds-5">
      <Card padding="lg" className="shadow-ds-soft">
        <h1 className="text-xl font-semibold text-text-primary">Search ROVEXO</h1>
        <p className="mt-ds-2 text-sm leading-relaxed text-text-secondary">
          Find products, sellers, stores, and categories. Use the search bar above or explore
          trending and popular categories below.
        </p>
      </Card>

      <Card padding="none" className="overflow-hidden shadow-ds-soft">
        <VoiceSearchPlaceholder />
      </Card>

      <section aria-labelledby="search-trending-heading">
        <h2 id="search-trending-heading" className="text-base font-semibold text-text-primary">
          Trending searches
        </h2>
        <div className="mt-ds-3 flex flex-wrap gap-ds-2">
          {defaultTrendingSearches.map((term) => (
            <Link key={term} href={`/search?q=${encodeURIComponent(term)}`}>
              <CategoryChip label={term} />
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="search-categories-heading">
        <h2 id="search-categories-heading" className="text-base font-semibold text-text-primary">
          Popular categories
        </h2>
        <div className="mt-ds-3 grid grid-cols-2 gap-ds-2 sm:grid-cols-3">
          {defaultCategories.slice(0, 6).map((category) => (
            <Link key={category.href} href={category.href}>
              <Card padding="sm" interactive className="min-h-[72px] shadow-ds-soft">
                <p className="text-sm font-semibold text-text-primary">{category.name}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
