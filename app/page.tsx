import type { Metadata } from "next";
import "@/styles/rovexo-homepage.css";
import { RovexoHeader } from "@/components/home/RovexoHeader";
import { RovexoHomePage } from "@/components/home/RovexoHomePage";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { fetchProducts } from "@/lib/products/queries";
import { homePageJsonLd } from "@/lib/seo/home-jsonld";
import { getAppUrl } from "@/lib/supabase/env";
import type { ProductsPage } from "@/lib/products/types";
import { getAuthContext, getUserRole } from "@/lib/auth/session";
import { getPlatformVisualConfig } from "@/lib/platform-visual/reader";
import { enrichHomepageData } from "@/lib/homepage/demo-data";

const emptyPage: ProductsPage = { items: [], page: 1, hasMore: false };

const siteUrl = getAppUrl();

export const revalidate = 60;

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

type HomePageProps = {
  searchParams: Promise<{ visualPreview?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  let previewMode: "live" | "draft" = "live";

  if (params.visualPreview === "draft") {
    const auth = await getAuthContext();
    const role = auth ? await getUserRole(auth.user.id) : null;
    if (role === "super_admin") {
      previewMode = "draft";
    }
  }

  const visualConfig = await getPlatformVisualConfig({ mode: previewMode });

  let featured: ProductsPage = emptyPage;
  let recommended: ProductsPage = emptyPage;
  let newListings: ProductsPage = emptyPage;
  let popularListings: ProductsPage = emptyPage;
  let allListings: ProductsPage = emptyPage;

  const [featuredResult, recommendedResult, newListingsResult, popularListingsResult] =
    await Promise.allSettled([
      fetchProducts("popular", 1),
      fetchProducts("recommended", 1),
      fetchProducts("new", 1),
      fetchProducts("popular", 2),
    ]);

  if (featuredResult.status === "fulfilled") featured = featuredResult.value;
  if (recommendedResult.status === "fulfilled") recommended = recommendedResult.value;
  if (newListingsResult.status === "fulfilled") newListings = newListingsResult.value;
  if (popularListingsResult.status === "fulfilled") popularListings = popularListingsResult.value;
  allListings = featured;

  const structuredData = homePageJsonLd(recommended.items, siteUrl);
  const homepage = enrichHomepageData({
    featured: featured.items,
    recommended: recommended.items,
    newListings: newListings.items,
    popularListings: popularListings.items,
  });

  return (
    <BetaAppShell bottomNavTab="home" className="rovexo-page-home" visualConfig={visualConfig}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <RovexoHeader />
      <RovexoHomePage
        featured={homepage.featured}
        recommended={homepage.recommended}
        newListings={homepage.newListings}
        boostListings={homepage.boostListings}
        premiumListings={homepage.premiumListings}
        businesses={homepage.businesses}
        allListings={allListings}
      />
    </BetaAppShell>
  );
}
