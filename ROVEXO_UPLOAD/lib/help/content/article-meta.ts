import type { HelpArticle, HelpCategory, HelpTopicSlug } from "@/lib/help/types";

const CATEGORY_TO_TOPIC: Record<HelpCategory, HelpTopicSlug> = {
  account: "account",
  buying: "buyer",
  selling: "seller",
  payments: "payments",
  delivery: "shipping",
  chat: "chat-messages",
  "pro-seller": "promoted-listings",
  "business-accounts": "business-accounts",
  safety: "safety",
  "ai-moderation": "reports",
  "prohibited-items": "policies",
  "community-guidelines": "policies",
  "reports-appeals": "reports",
  privacy: "privacy",
  terms: "policies",
};

const RELATED_BY_SLUG: Record<string, string[]> = {
  "account-overview": ["reset-password", "privacy-policy"],
  "buying-how-to-buy": ["buying-buyer-protection", "payments-checkout", "delivery-tracking"],
  "payments-refunds": ["buying-buyer-protection", "delivery-tracking"],
  "seller-tax-registration": ["payments-checkout", "business-accounts-setup"],
  "pro-seller-promotions": ["pro-seller-dashboard"],
};

export function enrichHelpArticle(article: HelpArticle): HelpArticle {
  const topic = article.topic ?? CATEGORY_TO_TOPIC[article.category];
  return {
    ...article,
    topic,
    lastUpdated: article.lastUpdated ?? "2025-06-19",
    relatedArticleSlugs: article.relatedArticleSlugs ?? RELATED_BY_SLUG[article.slug] ?? [],
    relatedTopicSlugs: article.relatedTopicSlugs ?? [topic],
    relatedFeatureHrefs: article.relatedFeatureHrefs ?? [],
    relatedPolicyHrefs: article.relatedPolicyHrefs ?? [],
  };
}

export function getArticleSections(article: HelpArticle) {
  if (article.sections) return article.sections;

  const lines = article.content.split("\n").filter(Boolean);
  const steps = lines.filter((line) => /^\d+\./.test(line.trim()) || line.trim().startsWith("- "));
  return {
    overview: article.summary,
    steps: steps.slice(0, 8).map((line) => line.replace(/^[-\d.]+\s*/, "")),
    requirements: ["ROVEXO account where applicable"],
    processingTime: "Instant self-service",
    commonMistakes: ["Skipping verification or setup steps"],
    troubleshooting: ["Use the interactive help guide for this topic if the article does not resolve your issue"],
    faqs: [{ question: article.title, answer: article.summary }],
  };
}
