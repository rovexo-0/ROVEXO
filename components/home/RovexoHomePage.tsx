"use client";

import "@/styles/rovexo-homepage.css";
import { memo } from "react";

import type { Product, ProductsPage } from "@/lib/products/types";
import type { RovexoBusiness } from "@/components/home/constants";

import { RovexoBanner } from "@/components/home/RovexoBanner";
import { RovexoCategoryRail } from "@/components/home/RovexoCategoryRail";
import { RovexoFeaturedListings } from "@/components/home/RovexoFeaturedListings";
import { RovexoRecommendedListings } from "@/components/home/RovexoRecommendedListings";
import { RovexoBusinesses } from "@/components/home/RovexoBusinesses";
import { RovexoNewListings } from "@/components/home/RovexoNewListings";
import { RovexoBoostListings } from "@/components/home/RovexoBoostListings";
import { RovexoPremiumListings } from "@/components/home/RovexoPremiumListings";
import { RovexoAllListings } from "@/components/home/RovexoAllListings";

export type RovexoHomePageProps = {
  featured: Product[];
  recommended: Product[];
  newListings: Product[];
  boostListings: Product[];
  premiumListings: Product[];
  businesses: RovexoBusiness[];
  allListings: ProductsPage;
};

export const RovexoHomePage = memo(function RovexoHomePage({
  featured,
  recommended,
  newListings,
  boostListings,
  premiumListings,
  businesses,
  allListings,
}: RovexoHomePageProps) {
  return (
    <main className="home-v1-main">
      <RovexoCategoryRail />
      <RovexoBanner />
      <RovexoFeaturedListings products={featured} />
      <RovexoRecommendedListings products={recommended} />
      <RovexoNewListings products={newListings} />
      <RovexoBoostListings products={boostListings} />
      <RovexoPremiumListings products={premiumListings} />
      <RovexoBusinesses businesses={businesses} />
      <RovexoAllListings initialPage={allListings} />
    </main>
  );
});
