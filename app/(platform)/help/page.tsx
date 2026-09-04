import type { Metadata } from "next";
import { HelpCentrePage } from "@/features/help/components/HelpCentrePage";
import { resolveViewerHelpAudiences } from "@/lib/help/help-content-audience-server-v1";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Help Centre | ROVEXO",
  description:
    "ROVEXO Help Centre — buying, selling, payments, wallet, shipping, verification and safety guides for the UK marketplace.",
  path: "/help",
});

type HelpIndexPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function HelpIndexPage({ searchParams }: HelpIndexPageProps) {
  const params = await searchParams;
  const allowedAudiences = await resolveViewerHelpAudiences();

  return <HelpCentrePage initialQuery={params.q ?? ""} allowedAudiences={allowedAudiences} />;
}
