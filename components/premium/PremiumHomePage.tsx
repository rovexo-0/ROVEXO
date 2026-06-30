"use client";

import { memo } from "react";
import type { Product } from "@/lib/products/types";
import { PremiumHero } from "@/components/premium/PremiumHero";
import { ImportListingBanner } from "@/components/premium/ImportListingBanner";
import { InfiniteCategoryRail } from "@/components/premium/InfiniteCategoryRail";
import { FeaturedListings } from "@/components/premium/FeaturedListings";
import { RecommendedListings } from "@/components/premium/RecommendedListings";
import { NewListings } from "@/components/premium/NewListings";
import { TrendingListings } from "@/components/premium/TrendingListings";
import { BusinessSection } from "@/components/premium/BusinessSection";
import { LatestListings } from "@/components/premium/LatestListings";
import { DealsSection } from "@/components/premium/DealsSection";
import { BenefitsSection } from "@/components/premium/BenefitsSection";

export type PremiumHomePageProps = {
  featured: Product[];
  recommended: Product[];
  newListings: Product[];
  latestListings: Product[];
  trendingListings: Product[];
  allListings: Product[];
};

export const PremiumHomePage = memo(function PremiumHomePage({
  featured,
  recommended,
  newListings,
  latestListings,
  trendingListings,
  allListings,
}: PremiumHomePageProps) {
  const dealPool = [...featured, ...recommended, ...newListings, ...trendingListings, ...allListings];
  const businessPool = [...featured, ...recommended, ...latestListings, ...trendingListings];

  return (
    <main className="premium-home bg-white pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
      <PremiumHero />
      <ImportListingBanner />
      <InfiniteCategoryRail />
      <FeaturedListings products={featured} />
      <RecommendedListings products={recommended} />
      <NewListings products={newListings} />
      <TrendingListings products={trendingListings} />
      <BusinessSection products={businessPool} />
      <LatestListings products={latestListings} />
      <DealsSection products={dealPool} />
      <BenefitsSection />
    </main>
  );
});
