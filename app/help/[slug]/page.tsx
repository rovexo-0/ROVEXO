import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HelpArticlePage } from "@/features/help/components/HelpArticlePage";
import { getHelpArticle } from "@/lib/help/content/articles";

type HelpArticleRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: HelpArticleRouteProps): Promise<Metadata> {
  const { slug } = await params;
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
  const article = getHelpArticle(slug);
  if (!article) {
    notFound();
  }

  return <HelpArticlePage article={article} />;
}
