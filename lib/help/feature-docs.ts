import type { HelpContentRequirement } from "@/lib/help/types";
import { getHelpArticle } from "@/lib/help/content/articles";
import { getDecisionTree } from "@/lib/help/decision-trees/registry";

/** Platform features that require Help Center documentation before release. */
export const HELP_CONTENT_REQUIREMENTS: HelpContentRequirement[] = [
  {
    featureId: "seller-wallet-withdraw",
    featureName: "Seller Wallet Withdrawals",
    requiredTopicSlug: "withdraw",
    requiredArticleSlug: "payments-checkout",
    requiredTree: true,
    requiredFaq: true,
    requiredKeywords: ["withdraw", "payout", "wallet", "bank transfer"],
    requiredPolicyHref: "/help/terms-of-service",
    estimatedProcessingTime: "Review up to 24 hours; transfer 1–3 business days",
  },
  {
    featureId: "stripe-connect",
    featureName: "Bank Account Payouts",
    requiredTopicSlug: "stripe",
    requiredArticleSlug: "seller-tax-registration",
    requiredTree: true,
    requiredFaq: true,
    requiredKeywords: ["stripe", "connect", "verification", "payout"],
    estimatedProcessingTime: "24–48 hours for verification",
  },
  {
    featureId: "buyer-protection",
    featureName: "Buyer Protection",
    requiredTopicSlug: "buyer",
    requiredArticleSlug: "buying-buyer-protection",
    requiredTree: true,
    requiredFaq: true,
    requiredKeywords: ["buyer protection", "refund", "dispute"],
    requiredPolicyHref: "/help/buying-buyer-protection",
  },
  {
    featureId: "listing-promotions",
    featureName: "Promoted / Featured / Bump Listings",
    requiredTopicSlug: "promoted-listings",
    requiredArticleSlug: "pro-seller-promotions",
    requiredTree: true,
    requiredFaq: true,
    requiredKeywords: ["promoted", "featured", "bump", "promotion"],
  },
  {
    featureId: "business-accounts",
    featureName: "Business Accounts",
    requiredTopicSlug: "business-accounts",
    requiredArticleSlug: "business-accounts-setup",
    requiredTree: true,
    requiredFaq: true,
    requiredKeywords: ["business", "company", "vat", "inventory"],
  },
];

export function validateHelpDocumentation(featureId: string): {
  complete: boolean;
  requirement: HelpContentRequirement | null;
  missing: string[];
} {
  const requirement = HELP_CONTENT_REQUIREMENTS.find((entry) => entry.featureId === featureId) ?? null;
  if (!requirement) {
    return { complete: true, requirement: null, missing: [] };
  }

  const missing: string[] = [];
  const tree = getDecisionTree(requirement.requiredTopicSlug);
  const article = getHelpArticle(requirement.requiredArticleSlug);

  if (requirement.requiredTree && !tree) missing.push("decision tree");
  if (requirement.requiredArticleSlug && !article) missing.push("article");
  if (requirement.requiredFaq && (!tree || Object.keys(tree.solutions).length === 0)) missing.push("faq");
  if (requirement.requiredKeywords.length && article) {
    const haystack = [article.title, article.summary, ...article.keywords].join(" ").toLowerCase();
    const missingKeywords = requirement.requiredKeywords.filter(
      (keyword) => !haystack.includes(keyword.toLowerCase()),
    );
    if (missingKeywords.length) missing.push("keywords");
  }

  return {
    complete: missing.length === 0,
    requirement,
    missing,
  };
}

export function listIncompleteHelpDocumentation(): HelpContentRequirement[] {
  return HELP_CONTENT_REQUIREMENTS.filter((requirement) => !validateHelpDocumentation(requirement.featureId).complete);
}
