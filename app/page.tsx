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
import { getAuthContext, getUserRole } from "@/lib/auth/session";
import { getPlatformVisualConfig } from "@/lib/platform-visual/reader";
import {
  resolveHeroAutoAdvanceMs,
  resolveLiveHeroSlides,
} from "@/lib/platform-visual/resolver";

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
  const heroSlides = resolveLiveHeroSlides(visualConfig.banners);
  const heroAutoAdvanceMs = resolveHeroAutoAdvanceMs(visualConfig.banners);

  const loadError = {
    featured: false,
    recommended: false,
    recentlyListed: false,
    auctions: false,
  };

  let featured: ProductsPage = emptyPage;
  let recommended: ProductsPage = emptyPage;
  let recentlyListed: ProductsPage = emptyPage;
  let liveAuctions: Awaited<ReturnType<typeof getAuctionsPageData>>["featured"] = [];
  let businesses: Awaited<ReturnType<typeof getRecommendedBusinesses>> = [];

  const [featuredResult, recommendedResult, recentlyListedResult, auctionsResult, businessesResult] =
    await Promise.allSettled([
      fetchProducts("popular", 1),
      fetchProducts("recommended", 1),
      fetchProducts("new", 1),
      getAuctionsPageData(),
      getRecommendedBusinesses(8),
    ]);

  if (featuredResult.status === "fulfilled") {
    featured = featuredResult.value;
  } else {
    loadError.featured = true;
  }

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
  const showHeader =
    !visualConfig.shell.header ||
    (visualConfig.shell.header.enabled && visualConfig.shell.header.published);

  return (
    <BetaAppShell bottomNavTab="home" className="rx-page-home" visualConfig={visualConfig}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageShell header={showHeader ? <Header /> : null} bottomNav={null}>
        <HomeContent
          featured={featured.items}
          recommended={recommended.items}
          recentlyListed={recentlyListed.items}
          liveAuctions={liveAuctions}
          businesses={businesses}
          visualConfig={visualConfig}
          heroSlides={heroSlides}
          heroAutoAdvanceMs={heroAutoAdvanceMs}
          loadError={loadError}
        />
      </HomePageShell>
    </BetaAppShell>
  );
}
