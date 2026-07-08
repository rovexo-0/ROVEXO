import type { Metadata } from "next";
import "@/styles/homepage-canonical.css";
import "@/styles/homepage-canonical-responsive.css";
import "@/styles/rovexo/header-v2.css";
import { CanonicalHomepage } from "@/components/homepage/canonical";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { HomePageShell } from "@/components/home/HomePageShell";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import {
  fetchHomepageFeed,
  fetchProducts,
  fetchShowcaseSellerSections,
} from "@/lib/products/queries";
import { resolveHomepageV4Sections } from "@/lib/homepage/v4-data";
import { homePageJsonLd } from "@/lib/seo/home-jsonld";
import { getAppUrl } from "@/lib/supabase/env";
import type { ProductsPage } from "@/lib/products/types";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { getAuthContext, getUserRole } from "@/lib/auth/session";
import { getPlatformVisualConfig } from "@/lib/platform-visual/reader";

const emptyPage: ProductsPage = { items: [], page: 1, hasMore: false };
const siteUrl = getAppUrl();

export const revalidate = 60;

export const metadata: Metadata = {
  title: "ROVEXO · Buy and sell with purchase protection",
  description:
    "Browse all listings on ROVEXO — promoted and organic listings in one marketplace feed with purchase protection and verified sellers.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "ROVEXO · The modern marketplace",
    description: "Buy and sell with purchase protection, verified sellers, and secure checkout.",
    type: "website",
    url: siteUrl,
    siteName: "ROVEXO",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630, alt: "ROVEXO marketplace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ROVEXO · The modern marketplace",
    description: "Buy and sell with purchase protection, verified sellers, and secure checkout.",
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

  const [visualConfig, featuredPage, feedResult, showcaseFromDb] = await Promise.all([
    getPlatformVisualConfig({ mode: previewMode }),
    fetchProducts("recommended", 1).catch(() => emptyPage),
    fetchHomepageFeed(1).catch(() => emptyPage),
    fetchShowcaseSellerSections().catch(() => [] as ShowcaseSellerSection[]),
  ]);

  const sections = resolveHomepageV4Sections({
    featuredPage,
    feed: feedResult,
    showcase: showcaseFromDb,
  });

  const structuredData = homePageJsonLd(sections.feed.items, siteUrl);

  const showHeader =
    !visualConfig.shell.header ||
    (visualConfig.shell.header.enabled && visualConfig.shell.header.published);

  return (
    <BetaAppShell bottomNavTab="home" className="rovexo-page-home" visualConfig={visualConfig}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageShell header={showHeader ? <RovexoHeaderV2 /> : null} bottomNav={null}>
        <CanonicalHomepage {...sections} />
      </HomePageShell>
    </BetaAppShell>
  );
}
