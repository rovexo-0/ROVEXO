import { guideHrefForTopic, detectHelpIntent } from "@/lib/help/intents";
import { searchHelpCentre } from "@/lib/help/search";
import type { HelpAssistantResponse } from "@/lib/help/types";

export function answerHelpQuestion(query: string): HelpAssistantResponse {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return {
      matched: false,
      answer: "Please enter a question about ROVEXO. I can guide you using official Help Centre topics and articles.",
      articles: [],
      intent: null,
      guideHref: null,
      suggestSupport: false,
      suggestTree: false,
    };
  }

  const intent = detectHelpIntent(trimmed);
  const results = searchHelpCentre(trimmed, 5);

  if (intent) {
    const guideHref = guideHrefForTopic(intent.topicSlug);
    const topArticle = results.find((result) => result.type === "article");
    return {
      matched: true,
      answer: [
        `I can help with **${intent.topicSlug.replace(/-/g, " ")}**.`,
        "I'll start the interactive guided troubleshooting flow so we can identify the exact issue.",
        topArticle ? `\nRelated article: ${topArticle.title}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      articles: results,
      intent,
      guideHref,
      suggestSupport: false,
      suggestTree: true,
    };
  }

  if (!results.length || results[0].score < 2) {
    return {
      matched: false,
      answer:
        "I could not find an official Help Centre match. Try browsing a help topic below or complete guided troubleshooting before contacting Support.",
      articles: results,
      intent: null,
      guideHref: null,
      suggestSupport: true,
      suggestTree: false,
    };
  }

  const top = results[0];
  const related = results
    .slice(1, 4)
    .map((result) => `- [${result.title}](${result.href})`)
    .join("\n");

  return {
    matched: true,
    answer: [`Based on **${top.title}**:`, top.excerpt, related ? `\nRelated:\n${related}` : ""]
      .filter(Boolean)
      .join("\n\n"),
    articles: results,
    intent: top.topic ? { topicSlug: top.topic.slug, confidence: 0.8, matchedTerms: [] } : null,
    guideHref: top.topic ? guideHrefForTopic(top.topic.slug) : top.href,
    suggestSupport: false,
    suggestTree: top.type === "topic",
  };
}
