import type { Metadata } from "next";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HelpCentrePage } from "@/features/help/components/HelpCentrePage";
import { getAllHelpArticles } from "@/lib/help/content/articles";

export const metadata: Metadata = {
  title: "Help Centre | ROVEXO",
  description: "Official ROVEXO help articles for buying, selling, payments, safety, and account support.",
};

type HelpIndexPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function HelpIndexPage({ searchParams }: HelpIndexPageProps) {
  const params = await searchParams;

  return (
    <BetaAppShell showBottomNav={false}>
      <HelpCentrePage articles={getAllHelpArticles()} initialQuery={params.q ?? ""} />
    </BetaAppShell>
  );
}
