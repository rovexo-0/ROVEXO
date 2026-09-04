import { HELP_TOPICS } from "@/lib/help/content/topics";
import { HELP_ARTICLES } from "@/lib/help/content/articles";
import { listHelpCategoryHubsForAudience } from "@/lib/help/content/category-hubs-v1";
import { getAllDecisionTrees } from "@/lib/help/decision-trees/registry";
import {
  canAccessHelpContent,
  HELP_AUDIENCES_FOR_GUEST,
  isLegacyHelpTopicSlug,
  type HelpContentAudience,
} from "@/lib/help/help-content-audience-v1";
import { CANONICAL_LEGAL_DOCUMENTS } from "@/lib/legal/canonical-documents";
import type { HelpSearchResult, HelpTopicSlug } from "@/lib/help/types";

/** Synonyms expand user queries so plain-English and platform terms match. */
const HELP_SEARCH_SYNONYMS: Record<string, string[]> = {
  fee: ["platform", "seller", "commission", "charge"],
  fees: ["platform", "seller", "commission", "charge"],
  commission: ["fee", "seller", "platform"],
  payout: ["withdraw", "withdrawal", "balance", "wallet"],
  payouts: ["withdraw", "withdrawal", "balance", "wallet"],
  refund: ["return", "money", "cancel"],
  refunds: ["return", "money", "cancel"],
  dispute: ["issue", "problem", "claim", "appeal"],
  disputes: ["issue", "problem", "claim", "appeal"],
  postage: ["shipping", "delivery", "parcel"],
  delivery: ["shipping", "tracking", "parcel"],
  tracking: ["shipping", "delivery", "parcel"],
  gdpr: ["privacy", "data", "rights"],
  protection: ["buyer", "seller", "safety"],
};

function tokenize(input: string): string[] {
  const base = input
    .toLowerCase()
    .split(/[^a-z0-9£]+/)
    .filter((token) => token.length > 1);
  const expanded = new Set(base);
  for (const token of base) {
    for (const synonym of HELP_SEARCH_SYNONYMS[token] ?? []) {
      expanded.add(synonym);
    }
  }
  return [...expanded];
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
  { id: "wallet", title: "Balance", href: "/balance", keywords: ["wallet", "withdraw", "balance", "payout"] },
  { id: "messages", title: "Messages", href: "/inbox", keywords: ["messages", "chat", "inbox"] },
  { id: "settings", title: "Settings", href: "/account/settings", keywords: ["settings", "profile", "account control"] },
  { id: "privacy", title: "Privacy", href: "/account/privacy", keywords: ["privacy", "gdpr", "data rights"] },
  { id: "security", title: "Security", href: "/account/security", keywords: ["security", "password", "sessions", "mfa"] },
  { id: "verification", title: "Verification", href: "/account/verification", keywords: ["verification", "identity", "verify"] },
  { id: "search", title: "Search", href: "/search", keywords: ["search", "find"] },
  { id: "support", title: "Contact Support", href: "/support", keywords: ["support", "contact", "ticket"] },
  { id: "legal", title: "Legal Information", href: "/legal", keywords: ["legal", "terms", "policy", "policies"] },
];

const ERROR_INDEX = [
  { id: "payment-declined", title: "Payment declined", keywords: ["payment declined", "card declined", "checkout failed"] },
  { id: "withdraw-failed", title: "Withdrawal failed", keywords: ["withdrawal failed", "payout failed"] },
  { id: "verification-required", title: "Verification required", keywords: ["verification required", "verify identity"] },
  { id: "message-blocked", title: "Message blocked", keywords: ["message blocked", "chat blocked"] },
];

export type HelpSearchOptions = {
  allowedAudiences?: readonly HelpContentAudience[];
};

/**
 * In-memory Help Centre search. Audience defaults to guest = shared only.
 * Pass allowedAudiences from resolveViewerHelpAudiences() for signed-in viewers.
 */
export function searchHelpCentre(
  query: string,
  limit = 16,
  options?: HelpSearchOptions,
): HelpSearchResult[] {
  const allowedAudiences = options?.allowedAudiences ?? HELP_AUDIENCES_FOR_GUEST;
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  const results: HelpSearchResult[] = [];

  for (const article of HELP_ARTICLES) {
    if (!canAccessHelpContent(article.audience, allowedAudiences)) {
      continue;
    }
    // Help stubs that redirect to Legal Centre must not compete in search.
    if (
      article.slug === "privacy-policy" ||
      article.slug === "terms-of-service" ||
      article.slug === "community-guidelines" ||
      article.slug === "prohibited-items-list"
    ) {
      continue;
    }
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

  for (const hub of listHelpCategoryHubsForAudience(allowedAudiences)) {
    const haystack = [hub.title, hub.summary, hub.content, ...hub.keywords].join(" ").toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (hub.title.toLowerCase().includes(token)) score += 7;
      if (hub.summary.toLowerCase().includes(token)) score += 4;
      if (hub.keywords.some((keyword) => keyword.toLowerCase().includes(token))) score += 3;
      if (haystack.includes(token)) score += 2;
    }
    if (score > 0) {
      results.push({
        type: "topic",
        id: hub.slug,
        title: hub.title,
        excerpt: buildExcerpt(hub.content, tokens),
        href: `/help/category/${hub.slug}`,
        score,
      });
    }

    const faqBlock = hub.content.split("## Frequently Asked Questions")[1]?.split("\n## ")[0] ?? "";
    for (const line of faqBlock.split("\n")) {
      const match =
        line.match(/^\*\*Q:\s*(.+?)\*\*/) ||
        line.match(/^Q:\s*(.+)/i) ||
        line.match(/^A:\s*(.+)/i);
      if (!match?.[1]) continue;
      const text = match[1].replace(/\*\*/g, "").trim();
      let faqScore = 0;
      for (const token of tokens) {
        if (text.toLowerCase().includes(token)) faqScore += 5;
      }
      if (faqScore > 0) {
        results.push({
          type: "faq",
          id: `hub:${hub.slug}:${text.slice(0, 48)}`,
          title: `${hub.title} — FAQ`,
          excerpt: text.slice(0, 180),
          href: `/help/category/${hub.slug}`,
          score: faqScore,
        });
      }
    }
  }

  for (const topic of HELP_TOPICS) {
    if (isLegacyHelpTopicSlug(topic.slug)) {
      continue;
    }
    if (!canAccessHelpContent(topic.audience, allowedAudiences)) {
      continue;
    }
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
    if (isLegacyHelpTopicSlug(tree.topicSlug)) {
      continue;
    }
    if (!canAccessHelpContent(tree.audience, allowedAudiences)) {
      continue;
    }
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

  for (const policy of HELP_TOPICS.filter((topic) => !isLegacyHelpTopicSlug(topic.slug)).flatMap((topic) =>
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

  for (const document of CANONICAL_LEGAL_DOCUMENTS) {
    if (!canAccessHelpContent(document.audience, allowedAudiences)) {
      continue;
    }
    const haystack = [document.title, document.summary, document.content, document.slug]
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (document.title.toLowerCase().includes(token)) score += 6;
      if (document.summary.toLowerCase().includes(token)) score += 3;
      if (haystack.includes(token)) score += 1;
    }
    if (score > 0) {
      results.push({
        type: "policy",
        id: `legal:${document.slug}`,
        title: document.title,
        excerpt: buildExcerpt(document.content, tokens),
        href: `/legal/${document.slug}`,
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

  return dedupeHelpSearchResults(results.sort((a, b) => b.score - a.score)).slice(0, limit);
}

/**
 * Prefer one canonical result per title/href.
 * When Help stubs collide with Legal Centre docs, keep the /legal result.
 * Do not globally re-rank Legal above higher-scoring Help/feature hits.
 */
function dedupeHelpSearchResults(results: HelpSearchResult[]): HelpSearchResult[] {
  const byHref = new Map<string, HelpSearchResult>();
  const byTitle = new Map<string, HelpSearchResult>();

  for (const result of results) {
    const hrefKey = result.href.split("?")[0] ?? result.href;
    const titleKey = result.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    const existingHref = byHref.get(hrefKey);
    if (!existingHref || result.score > existingHref.score) {
      byHref.set(hrefKey, result);
    }

    if (!titleKey) continue;
    const existingTitle = byTitle.get(titleKey);
    if (!existingTitle) {
      byTitle.set(titleKey, result);
      continue;
    }
    const existingLegal = existingTitle.href.startsWith("/legal/");
    const nextLegal = result.href.startsWith("/legal/");
    if (nextLegal && !existingLegal) {
      byTitle.set(titleKey, result);
    } else if (nextLegal === existingLegal && result.score > existingTitle.score) {
      byTitle.set(titleKey, result);
    }
  }

  const chosen = new Set<HelpSearchResult>();
  for (const result of byTitle.values()) chosen.add(result);
  for (const result of byHref.values()) {
    const titleKey = result.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const titleWinner = titleKey ? byTitle.get(titleKey) : undefined;
    if (titleWinner && titleWinner !== result && titleWinner.href.startsWith("/legal/") && result.href.startsWith("/help/")) {
      continue;
    }
    chosen.add(result);
  }

  return [...chosen].sort((a, b) => b.score - a.score);
}

export function searchHelpArticles(query: string, limit = 12, options?: HelpSearchOptions) {
  return searchHelpCentre(query, limit, options).filter((result) => result.type === "article" && result.article);
}

export function suggestArticlesForPath(pathname: string) {
  const rules: Array<{ pattern: RegExp; slugs: string[]; topic?: HelpTopicSlug }> = [
    { pattern: /^\/sell/, slugs: ["selling-get-started", "selling-photos", "seller-tax-registration"], topic: "seller" },
    { pattern: /^\/checkout/, slugs: ["payments-checkout", "buying-buyer-protection"], topic: "buyer" },
    { pattern: /^\/orders/, slugs: ["delivery-tracking", "payments-refunds"], topic: "orders" },
    { pattern: /^\/inbox/, slugs: ["chat-safety"], topic: "chat-messages" },
    { pattern: /^\/messages/, slugs: ["chat-safety"], topic: "chat-messages" },
    { pattern: /^\/wallet/, slugs: ["payments-checkout", "seller-tax-registration"], topic: "withdraw" },
    { pattern: /^\/seller\/wallet/, slugs: ["payments-checkout", "seller-tax-registration"], topic: "withdraw" },
    { pattern: /^\/seller/, slugs: ["pro-seller-dashboard", "seller-tax-registration"], topic: "seller" },
    { pattern: /^\/account\/settings/, slugs: ["account-overview"], topic: "account" },
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
  if (
    pathname.startsWith("/balance") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/seller/wallet")
  ) {
    return "withdraw";
  }
  if (pathname.startsWith("/seller")) return "seller";
  if (pathname.startsWith("/orders")) return "orders";
  if (pathname.startsWith("/inbox") || pathname.startsWith("/messages")) return "chat-messages";
  if (pathname.startsWith("/sell")) return "seller";
  if (pathname.startsWith("/account/settings") || pathname.startsWith("/settings")) return "account";
  if (pathname.startsWith("/checkout")) return "buyer";
  if (pathname.startsWith("/support")) return "support";
  if (pathname.startsWith("/settings")) return "account";
  return null;
}
