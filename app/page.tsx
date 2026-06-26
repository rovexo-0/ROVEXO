import type { Metadata } from "next";
import Header from "@/components/Header";
import { HomeContent } from "@/components/home/HomeContent";
import { HomePageShell } from "@/components/home/HomePageShell";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { fetchProducts } from "@/lib/products/queries";
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
  let loadError = false;

  let featured: ProductsPage = emptyPage;
  let popular: ProductsPage = emptyPage;
  let recommended: ProductsPage = emptyPage;
  let newest: ProductsPage = emptyPage;

  try {
    const [featuredPage, popularPage, trendingPage, newestPage] = await Promise.all([
      fetchProducts("recommended", 1),
      fetchProducts("popular", 1),
      fetchProducts("trending", 1),
      fetchProducts("new", 1),
    ]);

    featured = featuredPage;
    popular = popularPage;
    recommended = trendingPage;
    newest = newestPage;
  } catch {
    loadError = true;
  }

  const structuredData = homePageJsonLd(featured.items, siteUrl);

  return (
    <BetaAppShell bottomNavTab="home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageShell header={<Header />} bottomNav={null}>
        <HomeContent
          featured={featured.items}
          popular={popular.items}
          popularHasMore={popular.hasMore}
          recommended={recommended.items}
          newest={newest.items}
          loadError={loadError}
        />
      </HomePageShell>
    </BetaAppShell>
  );
}
