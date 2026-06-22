import { getAllHelpArticles } from "@/lib/help/content/articles";
import { getAllDecisionTrees } from "@/lib/help/decision-trees/registry";

export type HelpFaqEntry = {
  id: string;
  question: string;
  answer: string;
  href: string;
  topicSlug?: string;
  source: "article" | "solution";
};

export function listHelpFaqs(limit = 200): HelpFaqEntry[] {
  const entries: HelpFaqEntry[] = [];

  for (const article of getAllHelpArticles()) {
    for (const [index, faq] of (article.sections?.faqs ?? []).entries()) {
      entries.push({
        id: `article:${article.slug}:${index}`,
        question: faq.question,
        answer: faq.answer,
        href: `/help/${article.slug}`,
        topicSlug: article.topic,
        source: "article",
      });
    }
  }

  for (const tree of getAllDecisionTrees()) {
    for (const solution of Object.values(tree.solutions)) {
      for (const [index, faq] of solution.faqs.entries()) {
        entries.push({
          id: `solution:${tree.topicSlug}:${solution.id}:${index}`,
          question: faq.question,
          answer: faq.answer,
          href: `/help/category/${tree.topicSlug}`,
          topicSlug: tree.topicSlug,
          source: "solution",
        });
      }
    }
  }

  return entries.slice(0, limit);
}

export function searchHelpFaqs(query: string, limit = 24): HelpFaqEntry[] {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
  if (!tokens.length) return listHelpFaqs(limit);

  return listHelpFaqs(500)
    .map((entry) => {
      const haystack = `${entry.question} ${entry.answer}`.toLowerCase();
      const score = tokens.reduce((sum, token) => (haystack.includes(token) ? sum + 1 : sum), 0);
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => entry);
}
