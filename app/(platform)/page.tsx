import type { Metadata } from "next";
import "@/styles/homepage-canonical.css";
import "@/styles/homepage-canonical-responsive.css";
import "@/styles/rovexo/header-v2.css";
import { CanonicalHomepage } from "@/components/homepage/canonical";
import { HomePageShell } from "@/components/home/HomePageShell";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { homePageJsonLd } from "@/lib/seo/home-jsonld";
import { canonicalForHomepage } from "@/lib/seo/engine/canonical";
import { HP_CANONICAL_BOTTOM_NAV } from "@/lib/homepage/canonical-nav";
import { loadHomepageDocumentData } from "@/lib/homepage/load-homepage-document";

/**
 * Wave 0 SSOT — absolute root with trailing slash (`https://www.rovexo.co.uk/`).
 * Do NOT pass this through Metadata `alternates.canonical`: Next.js
 * `resolveAbsoluteUrlWithPathname` collapses pathname `/` to `origin` (no slash)
 * when `trailingSlash` is false. Emit via `<link rel="canonical">` instead.
 */
const rootCanonical = canonicalForHomepage().canonicalUrl;

/**
 * PUBLIC ISR document — cookie-free catalogue path only.
 * User-specific UI (auth, saved, badges, header) hydrates client-side.
 * Draft visual preview: middleware rewrites `/?visualPreview=draft` → private route.
 */
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

export default async function HomePage() {
  // OPT-P0-B-1: Checkout self-heal is NOT awaited on Homepage critical path.
  // Ownership remains: listing / orders / wallet / seller / Buy Now / expire-stale / client trigger.
  // PUBLIC document: always live visual — draft is isolated on /homepage-visual-draft.
  const { visualConfig, sections } = await loadHomepageDocumentData({
    previewMode: "live",
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
