import { getAllHelpArticles } from "@/lib/help/content/articles";
import { getAllDecisionTrees } from "@/lib/help/decision-trees/registry";
import { FAQ_LIBRARY_V1, getFaqByCluster } from "@/lib/seo/faq-library-v1";
import type { FaqCluster } from "@/lib/seo/faq-library-v1";

export type HelpFaqEntry = {
  id: string;
  question: string;
  answer: string;
  href: string;
  topicSlug?: string;
  source: "article" | "solution" | "library";
  cluster?: FaqCluster;
};

function libraryEntries(): HelpFaqEntry[] {
  return FAQ_LIBRARY_V1.map((entry) => ({
    id: `library:${entry.id}`,
    question: entry.question,
    answer: entry.answer,
    href: entry.helpHref ?? "/help/faq",
    source: "library" as const,
    cluster: entry.clusters[0],
  }));
}

export function listHelpFaqs(limit = 200): HelpFaqEntry[] {
  const entries: HelpFaqEntry[] = [...libraryEntries()];
  const seenQuestions = new Set(entries.map((entry) => entry.question.toLowerCase()));

  for (const article of getAllHelpArticles()) {
    for (const [index, faq] of (article.sections?.faqs ?? []).entries()) {
      const key = faq.question.toLowerCase();
      if (seenQuestions.has(key)) continue;
      seenQuestions.add(key);
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
        const key = faq.question.toLowerCase();
        if (seenQuestions.has(key)) continue;
        seenQuestions.add(key);
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

export function listHelpFaqsByCluster(cluster: FaqCluster, limit = 12): HelpFaqEntry[] {
  return getFaqByCluster(cluster, limit).map((entry) => ({
    id: `library:${entry.id}`,
    question: entry.question,
    answer: entry.answer,
    href: entry.helpHref ?? "/help/faq",
    source: "library" as const,
    cluster,
  }));
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
