import type { Metadata } from "next";
import { HelpCentrePage } from "@/features/help/components/HelpCentrePage";
import { buildPageMetadata } from "@/lib/seo/metadata";

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

  return <HelpCentrePage initialQuery={params.q ?? ""} />;
}
