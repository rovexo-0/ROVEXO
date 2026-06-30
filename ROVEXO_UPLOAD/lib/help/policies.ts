import { getAllHelpArticles } from "@/lib/help/content/articles";

export type HelpPolicyEntry = {
  slug: string;
  title: string;
  summary: string;
  href: string;
  category: string;
};

const POLICY_CATEGORIES = new Set([
  "privacy",
  "terms",
  "safety",
  "prohibited-items",
  "community-guidelines",
  "reports-appeals",
]);

export function listHelpPolicies(): HelpPolicyEntry[] {
  return getAllHelpArticles()
    .filter(
      (article) =>
        POLICY_CATEGORIES.has(article.category) ||
        article.slug.includes("policy") ||
        article.slug.includes("terms") ||
        article.slug.includes("privacy") ||
        article.slug.includes("guidelines"),
    )
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      href: `/help/${article.slug}`,
      category: article.category,
    }));
}
