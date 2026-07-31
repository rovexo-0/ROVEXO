import type { HelpArticle, HelpCategory, HelpTopicSlug } from "@/lib/help/types";
import { PHASE_C3_SETTINGS_IA_V1 } from "@/lib/settings/phase-c3-settings-information-architecture-v1";

const HELP_LAST_UPDATED = PHASE_C3_SETTINGS_IA_V1.helpLastUpdated;

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

/** Ensure every article body includes Phase C.3 professional documentation sections. */
export function ensureProfessionalHelpContent(article: HelpArticle): string {
  const body = article.content.trim();
  const hasPurpose = /##\s*Purpose/i.test(body);
  if (hasPurpose) {
    return body.includes("Last Updated")
      ? body
      : `${body}\n\n*Last Updated: ${HELP_LAST_UPDATED}*`;
  }

  return `# ${article.title}

*Last Updated: ${HELP_LAST_UPDATED}*

## Purpose
${article.summary}

## Explanation
${body.replace(/^#\s.+\n+/, "")}

## Examples
- Open **Settings** → **Help Centre** to find this guide again.
- Use search in Help Centre for related policies and legal documents.

## Common mistakes
- Looking for Help or Legal on the Profile menu — both live under **Settings**.
- Leaving ROVEXO to negotiate off-platform (purchase protection may not apply).
- Skipping verification steps when ROVEXO asks for them.

## Frequently Asked Questions
**Q: Where do I find Help Centre?**  
A: Go to **Settings → Help Centre**.

**Q: Where are legal documents?**  
A: Go to **Settings → Legal Information**, or open a specific policy from the Legal section in Settings.

**Q: How do I contact Support?**  
A: Go to **Settings → Contact Support**.

## Related Articles
${(RELATED_BY_SLUG[article.slug] ?? [])
  .map((slug) => `- [/help/${slug}](/help/${slug})`)
  .join("\n") || "- [/help](/help) — Help Centre home"}
- [/account/settings](/account/settings) — Settings (Account Control Centre)
- [/legal](/legal) — Legal Information
- [/support](/support) — Contact Support
`;
}

export function enrichHelpArticle(article: HelpArticle): HelpArticle {
  const topic = article.topic ?? CATEGORY_TO_TOPIC[article.category];
  const content = ensureProfessionalHelpContent(article);
  return {
    ...article,
    content,
    topic,
    lastUpdated: HELP_LAST_UPDATED,
    relatedArticleSlugs: article.relatedArticleSlugs ?? RELATED_BY_SLUG[article.slug] ?? [],
    relatedTopicSlugs: article.relatedTopicSlugs ?? [topic],
    relatedFeatureHrefs: article.relatedFeatureHrefs ?? [
      { label: "Settings", href: "/account/settings" },
      { label: "Help Centre", href: "/help" },
    ],
    relatedPolicyHrefs: article.relatedPolicyHrefs ?? [
      { label: "Legal Information", href: "/legal" },
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
    ],
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
    commonMistakes: [
      "Looking for Help or Legal on Profile instead of Settings",
      "Skipping verification or setup steps",
    ],
    troubleshooting: [
      "Use the interactive help guide for this topic if the article does not resolve your issue",
      "Open Settings → Contact Support if you still need help",
    ],
    faqs: [
      {
        question: "Where is Help Centre?",
        answer: "Settings → Help Centre.",
      },
      { question: article.title, answer: article.summary },
    ],
  };
}
