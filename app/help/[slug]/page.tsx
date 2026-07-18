import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HelpArticlePage } from "@/features/help/components/HelpArticlePage";
import { getHelpArticle } from "@/lib/help/content/articles";

/** Help policy summaries must never compete with Legal SSOT. */
const HELP_TO_LEGAL: Record<string, string> = {
  "privacy-policy": "/legal/privacy-policy",
  "terms-of-service": "/legal/terms-and-conditions",
};

type HelpArticleRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: HelpArticleRouteProps): Promise<Metadata> {
  const { slug } = await params;
  if (HELP_TO_LEGAL[slug]) {
    return { title: "Legal | ROVEXO" };
  }
  const article = getHelpArticle(slug);
  if (!article) {
    return { title: "Help | ROVEXO" };
  }

  return {
    title: `${article.title} | ROVEXO Help`,
    description: article.summary,
  };
}

export default async function HelpArticleRoute({ params }: HelpArticleRouteProps) {
  const { slug } = await params;
  const legalHref = HELP_TO_LEGAL[slug];
  if (legalHref) {
    redirect(legalHref);
  }

  const article = getHelpArticle(slug);
  if (!article) {
    notFound();
  }

  return <HelpArticlePage article={article} />;
}
