import type { Metadata } from "next";
import "@/styles/homepage-canonical.css";
import "@/styles/homepage-canonical-responsive.css";
import "@/styles/rovexo/header-v2.css";
import { CanonicalHomepage } from "@/components/homepage/canonical";
import { HomePageShell } from "@/components/home/HomePageShell";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  fetchHomepageFeed,
  fetchShowcaseSellerSections,
} from "@/lib/products/queries";
import { resolveHomepageV4Sections } from "@/lib/homepage/v4-data";
import { homePageJsonLd } from "@/lib/seo/home-jsonld";
import { canonicalForHomepage } from "@/lib/seo/engine/canonical";
import type { ProductsPage } from "@/lib/products/types";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { getAuthContext, getUserRole } from "@/lib/auth/session";
import { getPlatformVisualConfig, getDefaultPlatformVisualConfig } from "@/lib/platform-visual/reader";
import { HP_CANONICAL_BOTTOM_NAV } from "@/lib/homepage/canonical-nav";
import { listActivePreferredMarketplaceStores } from "@/lib/preferred-marketplace-stores/store";
import { awaitCheckoutSessionSelfHeal } from "@/lib/checkout/checkout-session-self-heal-server-v1";

/** Empty featured rail input — canonical Homepage does not render a featured section. */
const emptyPage: ProductsPage = { items: [], page: 1, hasMore: false };
/**
 * Wave 0 SSOT — absolute root with trailing slash (`https://www.rovexo.co.uk/`).
 * Do NOT pass this through Metadata `alternates.canonical`: Next.js
 * `resolveAbsoluteUrlWithPathname` collapses pathname `/` to `origin` (no slash)
 * when `trailingSlash` is false. Emit via `<link rel="canonical">` instead.
 */
const rootCanonical = canonicalForHomepage().canonicalUrl;

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
  // No alternates.canonical — see rootCanonical comment (Next strips homepage slash).
  openGraph: {
    title: HOMEPAGE_OG_TITLE,
    description: HOMEPAGE_OG_DESCRIPTION,
    type: "website",
    url: rootCanonical,
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
  // Checkout TTL Absolute Law — self-heal before marketplace feed (no daily-cron dependency).
  await awaitCheckoutSessionSelfHeal("homepage");

  const params = await searchParams;
  let previewMode: "live" | "draft" = "live";

  if (params.visualPreview === "draft") {
    const auth = await getAuthContext();
    const role = auth ? await getUserRole(auth.user.id) : null;
    if (role === "super_admin") {
      previewMode = "draft";
    }
  }

  // P1: skip unused recommended-section SSR query — CanonicalHomepage has no featured rail;
  // feed + showcase remain the live data path (identical UI/UX).
  const [visualConfig, feedResult, showcaseFromDb, preferredStores] = await Promise.all([
    getPlatformVisualConfig({ mode: previewMode }).catch(() => getDefaultPlatformVisualConfig()),
    fetchHomepageFeed(1).catch(() => emptyPage),
    fetchShowcaseSellerSections().catch(() => [] as ShowcaseSellerSection[]),
    listActivePreferredMarketplaceStores().catch(() => []),
  ]);

  const sections = resolveHomepageV4Sections({
    featuredPage: emptyPage,
    feed: feedResult,
    showcase: showcaseFromDb,
    preferredStores,
  });

  const structuredData = homePageJsonLd(sections.feed.items, rootCanonical);

  return (
    <BetaAppShell
      bottomNavTab="home"
      className="rovexo-page-home"
      visualConfig={visualConfig}
      menuItems={HP_CANONICAL_BOTTOM_NAV}
    >
      <link rel="canonical" href={rootCanonical} />
      <JsonLdScript id="jsonld-app-(platform)-page-tsx" data={structuredData} />
      <HomePageShell header={null} bottomNav={null}>
        <CanonicalHomepage {...sections} />
      </HomePageShell>
    </BetaAppShell>
  );
}
