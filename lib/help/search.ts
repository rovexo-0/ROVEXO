import { HELP_ARTICLES } from "@/lib/help/content/articles";
import type { HelpArticle, HelpSearchResult } from "@/lib/help/types";

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function buildExcerpt(content: string, queryTokens: string[]): string {
  const plain = content.replace(/^#+\s+/gm, "").replace(/\*\*/g, "");
  const sentences = plain.split(/(?<=[.!?])\s+/);
  const match = sentences.find((sentence) =>
    queryTokens.some((token) => sentence.toLowerCase().includes(token)),
  );
  return (match ?? sentences[0] ?? plain).slice(0, 180);
}

export function searchHelpArticles(query: string, limit = 12): HelpSearchResult[] {
  const tokens = tokenize(query);
  if (!tokens.length) {
    return [];
  }

  const scored = HELP_ARTICLES.map((article) => {
    const haystack = [
      article.title,
      article.summary,
      article.content,
      article.category,
      ...article.keywords,
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const token of tokens) {
      if (article.title.toLowerCase().includes(token)) score += 5;
      if (article.summary.toLowerCase().includes(token)) score += 3;
      if (haystack.includes(token)) score += 1;
    }

    return {
      article,
      score,
      excerpt: buildExcerpt(article.content, tokens),
    };
  })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function suggestArticlesForPath(pathname: string): HelpArticle[] {
  const rules: Array<{ pattern: RegExp; slugs: string[] }> = [
    { pattern: /^\/sell/, slugs: ["selling-get-started", "selling-photos", "seller-tax-registration"] },
    { pattern: /^\/checkout/, slugs: ["payments-checkout", "buying-buyer-protection"] },
    { pattern: /^\/orders/, slugs: ["delivery-tracking", "payments-refunds"] },
    { pattern: /^\/messages/, slugs: ["chat-safety"] },
    { pattern: /^\/seller/, slugs: ["pro-seller-dashboard", "seller-tax-registration"] },
    { pattern: /^\/settings/, slugs: ["account-overview"] },
    { pattern: /^\/listing/, slugs: ["buying-how-to-buy", "reports-appeals-process"] },
    { pattern: /^\/notifications/, slugs: ["account-overview"] },
    { pattern: /^\/admin\/moderation/, slugs: ["ai-moderation-overview"] },
    { pattern: /^\/support/, slugs: ["reports-appeals-process"] },
  ];

  const match = rules.find((rule) => rule.pattern.test(pathname));
  if (!match) {
    return HELP_ARTICLES.slice(0, 3);
  }

  return match.slugs
    .map((slug) => HELP_ARTICLES.find((article) => article.slug === slug))
    .filter((article): article is HelpArticle => Boolean(article));
}
