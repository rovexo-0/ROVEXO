import { isBusinessOnlyHelpArticleSlug } from "@/lib/help/help-content-audience-v1";
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
  "pro-seller": "seller",
  "business-accounts": "business-accounts",
  safety: "safety",
  "ai-moderation": "reports",
  "prohibited-items": "policies",
  "community-guidelines": "policies",
  "reports-appeals": "reports",
  privacy: "privacy",
  terms: "policies",
};

export const RELATED_BY_SLUG: Record<string, string[]> = {
  "account-overview": ["reset-password", "account-notifications", "account-delete"],
  "buying-how-to-buy": ["buying-total-buyer-pays", "buying-make-offer", "buying-buyer-protection", "payments-checkout"],
  "buying-total-buyer-pays": ["buying-how-to-buy", "payments-platform-fee", "payments-checkout"],
  "buying-make-offer": ["buying-how-to-buy", "buying-first-purchase", "safety-scam-red-flags"],
  "buying-first-purchase": ["buying-how-to-buy", "buying-condition-guide", "uk-buying-secondhand"],
  "selling-get-started": ["selling-fees", "selling-listing-quality", "selling-photos"],
  "selling-fees": ["selling-get-started", "payments-platform-fee", "wallet-overview"],
  "wallet-overview": ["wallet-withdraw", "wallet-bank-account", "payments-checkout"],
  "wallet-withdraw": ["wallet-overview", "wallet-bank-account", "verification-payouts"],
  "shipping-labels": ["delivery-shipping", "delivery-tracking", "selling-parcels"],
  "payments-refunds": ["buying-buyer-protection", "returns-buyer-steps", "delivery-tracking"],
  "returns-buyer-steps": ["returns-seller-steps", "payments-refunds", "buying-buyer-protection"],
  "safety-scam-red-flags": ["safety-tips", "buying-buyer-protection", "community-reporting"],
  "community-reviews": ["trust-and-safety", "buying-how-to-buy", "selling-get-started"],
  "uk-buying-secondhand": ["buying-first-purchase", "uk-selling-locally", "buying-condition-guide"],
  "guide-womens-fashion": ["buying-condition-guide", "selling-listing-quality", "guide-mens-fashion"],
  "guide-vehicle-parts": ["selling-get-started", "selling-parcels", "uk-selling-locally"],
  "seller-tax-registration": ["business-vat-basics", "business-storefront-tips", "wallet-withdraw"],
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
A: Open **Help Centre → Contact Support**, or go to /support.

## Related Articles
${(RELATED_BY_SLUG[article.slug] ?? [])
  .filter((slug) => !isBusinessOnlyHelpArticleSlug(slug))
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
