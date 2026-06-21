import type { Metadata } from "next";
import Header from "@/components/Header";
import { HomeContent } from "@/components/home/HomeContent";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { getTopLevelCategoryCounts } from "@/lib/categories/server";
import { fetchProducts } from "@/lib/products/queries";
import type { ProductsPage } from "@/lib/products/types";

const emptyPage: ProductsPage = { items: [], page: 1, hasMore: false };

export const metadata: Metadata = {
  title: "ROVEXO · Buy and sell with buyer protection",
  description:
    "Discover trending listings, shop by category, and sell fashion, electronics, home, vehicles and more on ROVEXO.",
  openGraph: {
    title: "ROVEXO · The modern marketplace",
    description: "Buy and sell with buyer protection, verified sellers, and secure checkout.",
    type: "website",
  },
};

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof getTopLevelCategoryCounts>> = [];
  let loadError = false;

  try {
    categories = await getTopLevelCategoryCounts();
  } catch {
    loadError = true;
  }

  let trending: ProductsPage = emptyPage;
  let newToday: ProductsPage = emptyPage;
  let featured: ProductsPage = emptyPage;
  let recommended: ProductsPage = emptyPage;

  try {
    [trending, newToday, featured, recommended] = await Promise.all([
      fetchProducts("trending", 1),
      fetchProducts("new", 1),
      fetchProducts("recommended", 1),
      fetchProducts("trending", 1),
    ]);
  } catch {
    loadError = true;
  }

  return (
    <BetaAppShell bottomNavTab="home">
      <Header />
      <HomeContent
        categories={categories}
        featured={featured.items}
        trending={trending.items}
        newToday={newToday.items}
        recommended={recommended.items}
        recommendedHasMore={recommended.hasMore}
        loadError={loadError}
      />
    </BetaAppShell>
  );
}
