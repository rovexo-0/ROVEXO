import type { Metadata } from "next";
import "@/styles/rovexo-homepage.css";
import Header from "@/components/Header";
import { RovexoHomePage } from "@/components/home/RovexoHomePage";
import { HomePageShell } from "@/components/home/HomePageShell";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { fetchHomepageFeed } from "@/lib/products/queries";
import { homePageJsonLd } from "@/lib/seo/home-jsonld";
import { getAppUrl } from "@/lib/supabase/env";
import type { ProductsPage } from "@/lib/products/types";
import { getAuthContext, getUserRole } from "@/lib/auth/session";
import { getPlatformVisualConfig } from "@/lib/platform-visual/reader";
import { resolveHomepageFeedItems } from "@/lib/homepage/demo-data";

const emptyPage: ProductsPage = { items: [], page: 1, hasMore: false };

const siteUrl = getAppUrl();

export const revalidate = 60;

export const metadata: Metadata = {
  title: "ROVEXO · Buy and sell with buyer protection",
  description:
    "Browse all listings on ROVEXO — promoted and organic listings in one marketplace feed with buyer protection and verified sellers.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "ROVEXO · The modern marketplace",
    description: "Buy and sell with buyer protection, verified sellers, and secure checkout.",
    type: "website",
    url: siteUrl,
    siteName: "ROVEXO",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630, alt: "ROVEXO marketplace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ROVEXO · The modern marketplace",
    description: "Buy and sell with buyer protection, verified sellers, and secure checkout.",
    images: ["/brand/og-image.png"],
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

  const [visualConfig, feedResult] = await Promise.all([
    getPlatformVisualConfig({ mode: previewMode }),
    fetchHomepageFeed(1).catch(() => emptyPage),
  ]);

  const allListings = resolveHomepageFeedItems(feedResult);
  const structuredData = homePageJsonLd(allListings.items, siteUrl);

  const showHeader =
    !visualConfig.shell.header ||
    (visualConfig.shell.header.enabled && visualConfig.shell.header.published);

  return (
    <BetaAppShell bottomNavTab="home" className="rovexo-page-home" visualConfig={visualConfig}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageShell header={showHeader ? <Header variant="homepage" /> : null} bottomNav={null}>
        <RovexoHomePage allListings={allListings} />
      </HomePageShell>
    </BetaAppShell>
  );
}
