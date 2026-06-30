import { HELP_TOPICS } from "@/lib/help/content/topics";
import { HELP_ARTICLES } from "@/lib/help/content/articles";
import { getAllDecisionTrees } from "@/lib/help/decision-trees/registry";
import type { HelpSearchResult, HelpTopicSlug } from "@/lib/help/types";

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

function buildExcerpt(content: string, queryTokens: string[]): string {
  const plain = content.replace(/^#+\s+/gm, "").replace(/\*\*/g, "");
  const sentences = plain.split(/(?<=[.!?])\s+/);
  const match = sentences.find((sentence) =>
    queryTokens.some((token) => sentence.toLowerCase().includes(token)),
  );
  return (match ?? sentences[0] ?? plain).slice(0, 180);
}

const FEATURE_INDEX = [
  { id: "sell", title: "Sell", href: "/sell", keywords: ["sell", "listing", "publish"] },
  { id: "orders", title: "Orders", href: "/orders", keywords: ["orders", "purchases"] },
  { id: "wallet", title: "Seller Wallet", href: "/seller/wallet", keywords: ["wallet", "withdraw", "balance"] },
  { id: "messages", title: "Messages", href: "/messages", keywords: ["messages", "chat"] },
  { id: "settings", title: "Settings", href: "/settings", keywords: ["settings", "profile"] },
  { id: "search", title: "Search", href: "/search", keywords: ["search", "find"] },
  { id: "support", title: "Contact Support", href: "/support", keywords: ["support", "contact", "ticket"] },
];

const ERROR_INDEX = [
  { id: "payment-declined", title: "Payment declined", keywords: ["payment declined", "card declined", "checkout failed"] },
  { id: "withdraw-failed", title: "Withdrawal failed", keywords: ["withdrawal failed", "payout failed"] },
  { id: "verification-required", title: "Verification required", keywords: ["verification required", "verify identity"] },
  { id: "message-blocked", title: "Message blocked", keywords: ["message blocked", "chat blocked"] },
];

export function searchHelpCentre(query: string, limit = 16): HelpSearchResult[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  const results: HelpSearchResult[] = [];

  for (const article of HELP_ARTICLES) {
    const haystack = [article.title, article.summary, article.content, ...article.keywords].join(" ").toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (article.title.toLowerCase().includes(token)) score += 5;
      if (article.summary.toLowerCase().includes(token)) score += 3;
      if (haystack.includes(token)) score += 1;
    }
    if (score > 0) {
      results.push({
        type: "article",
        id: article.slug,
        title: article.title,
        excerpt: buildExcerpt(article.content, tokens),
        href: `/help/${article.slug}`,
        score,
        article,
      });
    }
  }

  for (const topic of HELP_TOPICS) {
    const haystack = [topic.label, topic.description, ...topic.keywords].join(" ").toLowerCase();
    let score = topic.searchRanking / 100;
    for (const token of tokens) {
      if (topic.label.toLowerCase().includes(token)) score += 6;
      if (haystack.includes(token)) score += 2;
    }
    if (score > 1) {
      results.push({
        type: "topic",
        id: topic.slug,
        title: topic.label,
        excerpt: topic.description,
        href: `/help/category/${topic.slug}`,
        score,
        topic,
      });
    }
  }

  for (const tree of getAllDecisionTrees()) {
    for (const nodeEntry of Object.values(tree.nodes)) {
      for (const optionEntry of nodeEntry.options) {
        const haystack = optionEntry.label.toLowerCase();
        let score = 0;
        for (const token of tokens) {
          if (haystack.includes(token)) score += 4;
        }
        if (score > 0) {
          results.push({
            type: "faq",
            id: `${tree.topicSlug}:${optionEntry.id}`,
            title: `${tree.title} — ${optionEntry.label}`,
            excerpt: nodeEntry.question,
            href: `/help/category/${tree.topicSlug}`,
            score,
          });
        }
      }
    }
    for (const solutionEntry of Object.values(tree.solutions)) {
      const haystack = [solutionEntry.title, solutionEntry.overview, ...solutionEntry.faqs.map((faq) => faq.question)].join(" ").toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (solutionEntry.title.toLowerCase().includes(token)) score += 4;
        if (haystack.includes(token)) score += 1;
      }
      if (score > 0) {
        results.push({
          type: "faq",
          id: `${tree.topicSlug}:solution:${solutionEntry.id}`,
          title: solutionEntry.title,
          excerpt: solutionEntry.overview,
          href: `/help/category/${tree.topicSlug}`,
          score,
        });
      }
    }
  }

  for (const feature of FEATURE_INDEX) {
    let score = 0;
    for (const token of tokens) {
      if (feature.title.toLowerCase().includes(token)) score += 4;
      if (feature.keywords.some((keyword) => keyword.includes(token))) score += 3;
    }
    if (score > 0) {
      results.push({
        type: "feature",
        id: feature.id,
        title: feature.title,
        excerpt: `Open ${feature.title} in ROVEXO`,
        href: feature.href,
        score,
      });
    }
  }

  for (const policy of HELP_TOPICS.flatMap((topic) =>
    topic.relatedPolicies.map((entry) => ({ ...entry, topic: topic.slug })),
  )) {
    let score = 0;
    for (const token of tokens) {
      if (policy.label.toLowerCase().includes(token)) score += 3;
    }
    if (score > 0) {
      results.push({
        type: "policy",
        id: policy.href,
        title: policy.label,
        excerpt: "Official ROVEXO policy",
        href: policy.href,
        score,
      });
    }
  }

  for (const errorEntry of ERROR_INDEX) {
    let score = 0;
    for (const token of tokens) {
      if (errorEntry.keywords.some((keyword) => keyword.includes(token) || token.includes(keyword))) score += 5;
    }
    if (score > 0) {
      results.push({
        type: "faq",
        id: errorEntry.id,
        title: errorEntry.title,
        excerpt: "Guided troubleshooting available in Help Centre",
        href: `/help?q=${encodeURIComponent(errorEntry.title)}`,
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function searchHelpArticles(query: string, limit = 12) {
  return searchHelpCentre(query, limit).filter((result) => result.type === "article" && result.article);
}

export function suggestArticlesForPath(pathname: string) {
  const rules: Array<{ pattern: RegExp; slugs: string[]; topic?: HelpTopicSlug }> = [
    { pattern: /^\/sell/, slugs: ["selling-get-started", "selling-photos", "seller-tax-registration"], topic: "seller" },
    { pattern: /^\/checkout/, slugs: ["payments-checkout", "buying-buyer-protection"], topic: "buyer" },
    { pattern: /^\/orders/, slugs: ["delivery-tracking", "payments-refunds"], topic: "orders" },
    { pattern: /^\/messages/, slugs: ["chat-safety"], topic: "chat-messages" },
    { pattern: /^\/seller\/wallet/, slugs: ["payments-checkout", "seller-tax-registration"], topic: "withdraw" },
    { pattern: /^\/seller/, slugs: ["pro-seller-dashboard", "seller-tax-registration"], topic: "seller" },
    { pattern: /^\/settings/, slugs: ["account-overview"], topic: "account" },
    { pattern: /^\/support/, slugs: ["reports-appeals-process"], topic: "support" },
  ];

  const match = rules.find((rule) => rule.pattern.test(pathname));
  if (!match) {
    return HELP_ARTICLES.slice(0, 3);
  }

  return match.slugs
    .map((slug) => HELP_ARTICLES.find((article) => article.slug === slug))
    .filter((article): article is NonNullable<typeof article> => Boolean(article));
}

export function suggestTopicForPath(pathname: string): HelpTopicSlug | null {
  if (pathname.startsWith("/seller/wallet")) return "withdraw";
  if (pathname.startsWith("/seller")) return "seller";
  if (pathname.startsWith("/orders")) return "orders";
  if (pathname.startsWith("/messages")) return "chat-messages";
  if (pathname.startsWith("/sell")) return "seller";
  if (pathname.startsWith("/checkout")) return "buyer";
  if (pathname.startsWith("/support")) return "support";
  if (pathname.startsWith("/settings")) return "account";
  return null;
}
