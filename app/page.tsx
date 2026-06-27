import type { Metadata } from "next";
import Header from "@/components/Header";
import { HomeContent } from "@/components/home/HomeContent";
import { HomePageShell } from "@/components/home/HomePageShell";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { fetchProducts } from "@/lib/products/queries";
import { getAuctionsPageData } from "@/lib/auctions/queries";
import { getRecommendedBusinesses } from "@/lib/launch/recommendations";
import { homePageJsonLd } from "@/lib/seo/home-jsonld";
import { getAppUrl } from "@/lib/supabase/env";
import type { ProductsPage } from "@/lib/products/types";

const emptyPage: ProductsPage = { items: [], page: 1, hasMore: false };

const siteUrl = getAppUrl();

export const metadata: Metadata = {
  title: "ROVEXO · Buy and sell with buyer protection",
  description:
    "Discover featured listings, shop by category, and sell fashion, electronics, home, vehicles and more on ROVEXO.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "ROVEXO · The modern marketplace",
    description: "Buy and sell with buyer protection, verified sellers, and secure checkout.",
    type: "website",
    url: siteUrl,
    siteName: "ROVEXO",
  },
  twitter: {
    card: "summary_large_image",
    title: "ROVEXO · The modern marketplace",
    description: "Buy and sell with buyer protection, verified sellers, and secure checkout.",
  },
};

export default async function HomePage() {
  const loadError = {
    recommended: false,
    recentlyListed: false,
    auctions: false,
  };

  let recommended: ProductsPage = emptyPage;
  let recentlyListed: ProductsPage = emptyPage;
  let liveAuctions: Awaited<ReturnType<typeof getAuctionsPageData>>["featured"] = [];
  let businesses: Awaited<ReturnType<typeof getRecommendedBusinesses>> = [];

  const [recommendedResult, recentlyListedResult, auctionsResult, businessesResult] =
    await Promise.allSettled([
      fetchProducts("recommended", 1),
      fetchProducts("new", 1),
      getAuctionsPageData(),
      getRecommendedBusinesses(8),
    ]);

  if (recommendedResult.status === "fulfilled") {
    recommended = recommendedResult.value;
  } else {
    loadError.recommended = true;
  }

  if (recentlyListedResult.status === "fulfilled") {
    recentlyListed = recentlyListedResult.value;
  } else {
    loadError.recentlyListed = true;
  }

  if (auctionsResult.status === "fulfilled") {
    liveAuctions = auctionsResult.value.featured.slice(0, 8);
  } else {
    loadError.auctions = true;
  }

  if (businessesResult.status === "fulfilled") {
    businesses = businessesResult.value;
  }

  const structuredData = homePageJsonLd(recommended.items, siteUrl);

  return (
    <BetaAppShell bottomNavTab="home" className="rx-page-home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageShell header={<Header />} bottomNav={null}>
        <HomeContent
          recommended={recommended.items}
          recentlyListed={recentlyListed.items}
          liveAuctions={liveAuctions}
          businesses={businesses}
          loadError={loadError}
        />
      </HomePageShell>
    </BetaAppShell>
  );
}
