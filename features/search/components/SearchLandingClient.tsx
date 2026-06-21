"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { useSearchOverlayOptional } from "@/features/search/client";
import { TrendingSearchesSection } from "@/components/home/TrendingSearchesSection";

export function SearchLandingClient() {
  const searchOverlay = useSearchOverlayOptional();

  useEffect(() => {
    searchOverlay?.open();
  }, [searchOverlay]);

  return (
    <div className="flex flex-col gap-ds-5">
      <Card padding="lg" className="shadow-ds-soft">
        <h1 className="text-xl font-semibold text-text-primary">Search ROVEXO</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Use the search bar above to find products, sellers, stores, and categories.
        </p>
      </Card>
      <TrendingSearchesSection />
    </div>
  );
}
