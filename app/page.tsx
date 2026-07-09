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

const HOMEPAGE_OG_TITLE = "ROVEXO – Buy & Sell with Confidence";
const HOMEPAGE_OG_DESCRIPTION =
  "Discover thousands of products from trusted sellers across the UK.";
const HOMEPAGE_OG_IMAGE = {
  url: "/brand/og-image.png",
  width: 1200,
  height: 630,
  alt: "ROVEXO marketplace",
} as const;

export const metadata: Metadata = {
  title: HOMEPAGE_OG_TITLE,
  description: HOMEPAGE_OG_DESCRIPTION,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: HOMEPAGE_OG_TITLE,
    description: HOMEPAGE_OG_DESCRIPTION,
    type: "website",
    url: siteUrl,
    siteName: "ROVEXO",
    images: [HOMEPAGE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: HOMEPAGE_OG_TITLE,
    description: HOMEPAGE_OG_DESCRIPTION,
    images: [HOMEPAGE_OG_IMAGE.url],
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
      <HomePageShell
        header={showHeader ? <RovexoHeaderV2 replaceAccountWithShare /> : null}
        bottomNav={null}
      >
        <CanonicalHomepage {...sections} />
      </HomePageShell>
    </BetaAppShell>
  );
}
