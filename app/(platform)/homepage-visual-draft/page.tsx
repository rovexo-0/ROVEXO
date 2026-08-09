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
import { getAuthContext, getUserRole } from "@/lib/auth/session";

/**
 * PRIVATE super_admin draft visual preview.
 * Public URL remains `/?visualPreview=draft` via middleware rewrite.
 * Never cached — cookies()/auth required.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "ROVEXO – Draft visual preview",
  robots: { index: false, follow: false },
};

const rootCanonical = canonicalForHomepage().canonicalUrl;

export default async function HomepageVisualDraftPage() {
  let previewMode: "live" | "draft" = "live";
  const auth = await getAuthContext();
  const role = auth ? await getUserRole(auth.user.id) : null;
  if (role === "super_admin") {
    previewMode = "draft";
  }

  const { visualConfig, sections } = await loadHomepageDocumentData({
    previewMode,
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
      <JsonLdScript id="jsonld-homepage-visual-draft" data={structuredData} />
      <HomePageShell header={null} bottomNav={null}>
        <CanonicalHomepage {...sections} />
      </HomePageShell>
    </BetaAppShell>
  );
}
