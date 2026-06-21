import { searchHelpArticles } from "@/lib/help/search";
import type { HelpAssistantResponse } from "@/lib/help/types";

export function answerHelpQuestion(query: string): HelpAssistantResponse {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return {
      matched: false,
      answer:
        "Please enter a question about ROVEXO. I can only answer using official Help Centre articles.",
      articles: [],
      suggestSupport: false,
    };
  }

  const results = searchHelpArticles(trimmed, 3);
  if (!results.length || results[0].score < 2) {
    return {
      matched: false,
      answer:
        "I could not find an official Help Centre article that answers that question. Please contact Support and our team will review your request individually.",
      articles: [],
      suggestSupport: true,
    };
  }

  const top = results[0];
  const related = results
    .slice(1)
    .map((result) => `- [${result.article.title}](/help/${result.article.slug})`)
    .join("\n");

  const answer = [
    `Based on **${top.article.title}**:`,
    top.excerpt,
    related ? `\nRelated articles:\n${related}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    matched: true,
    answer,
    articles: results,
    suggestSupport: false,
  };
}
