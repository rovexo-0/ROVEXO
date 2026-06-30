import type { HelpTopicSlug } from "@/lib/help/types";

type IntentRule = { topicSlug: HelpTopicSlug; terms: string[]; weight?: number };

const INTENT_RULES: IntentRule[] = [
  { topicSlug: "withdraw", terms: ["withdraw", "withdrawal", "payout", "can't withdraw"], weight: 3 },
  { topicSlug: "orders", terms: ["order", "tracking", "not received"], weight: 2 },
  { topicSlug: "refunds", terms: ["refund", "money back"], weight: 3 },
  { topicSlug: "verification", terms: ["verify", "verification", "identity"], weight: 2 },
  { topicSlug: "business-accounts", terms: ["business", "company", "vat"], weight: 2 },
  { topicSlug: "wholesale", terms: ["wholesale", "bulk", "moq", "rfq"], weight: 2 },
  { topicSlug: "buyer", terms: ["buy", "purchase", "checkout"], weight: 2 },
  { topicSlug: "seller", terms: ["sell", "listing", "seller"], weight: 2 },
];

export function detectHelpIntent(query: string) {
  const normalized = query.toLowerCase();
  let best: { topicSlug: HelpTopicSlug; score: number; matchedTerms: string[] } | null = null;
  for (const rule of INTENT_RULES) {
    const matchedTerms = rule.terms.filter((term) => normalized.includes(term));
    if (!matchedTerms.length) continue;
    const score = matchedTerms.reduce((sum) => sum + (rule.weight ?? 1), 0);
    if (!best || score > best.score) best = { topicSlug: rule.topicSlug, score, matchedTerms };
  }
  if (!best || best.score < 2) return null;
  return { topicSlug: best.topicSlug, confidence: Math.min(1, best.score / 6), matchedTerms: best.matchedTerms };
}

export function guideHrefForTopic(topicSlug: HelpTopicSlug): string {
  return `/help/category/${topicSlug}`;
}
