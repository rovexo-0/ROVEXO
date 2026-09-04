import type { Metadata } from "next";
import { HelpFaqPage } from "@/features/help/components/HelpFaqPage";
import { resolveViewerHelpAudiences } from "@/lib/help/help-content-audience-server-v1";
import { buildPageMetadata, faqJsonLd } from "@/lib/seo/metadata";
import { getFaqByCluster, faqLibraryAsItems } from "@/lib/seo/faq-library-v1";
import { JsonLdScript } from "@/components/seo/JsonLdScript";

export const dynamic = "force-dynamic";

const faqItems = faqLibraryAsItems([
  ...getFaqByCluster("global", 4),
  ...getFaqByCluster("buyer", 3),
  ...getFaqByCluster("seller", 3),
  ...getFaqByCluster("wallet", 2),
  ...getFaqByCluster("shipping", 2),
].filter((entry, index, arr) => arr.findIndex((item) => item.id === entry.id) === index).slice(0, 12));

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ | ROVEXO Help Centre",
  description:
    "Frequently asked questions for ROVEXO buyers and sellers — payments, wallet, shipping, offers and safety.",
  path: "/help/faq",
});

export default async function HelpFaqRoute() {
  const allowedAudiences = await resolveViewerHelpAudiences();
  return (
    <>
      <JsonLdScript id="jsonld-app-(platform)-help-faq-page-tsx" data={faqJsonLd(faqItems)} />
      <HelpFaqPage allowedAudiences={allowedAudiences} />
    </>
  );
}
