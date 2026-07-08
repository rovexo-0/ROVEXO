export type FeatureExplanation = {
  id: string;
  title: string;
  summary: string;
  href: string;
  helpTopicSlug: string;
  keywords: string[];
};

export const MARKETPLACE_FEATURES: FeatureExplanation[] = [
  {
    id: "buyer-protection",
    title: "Purchase Protection",
    summary: "Secure checkout with dispute support through the resolution center.",
    href: "/help/category/buyer",
    helpTopicSlug: "buyer",
    keywords: ["purchase protection", "secure checkout"],
  },
  {
    id: "withdrawals",
    title: "Seller Withdrawals",
    summary: "Withdraw seller balance to your verified bank account via Stripe.",
    href: "/help/category/withdraw",
    helpTopicSlug: "withdraw",
    keywords: ["withdraw", "payout", "wallet"],
  },
  {
    id: "promotions",
    title: "Promoted Listings",
    summary: "Bump or feature listings for more visibility in search and home sections.",
    href: "/help/category/promoted-listings",
    helpTopicSlug: "promoted-listings",
    keywords: ["bump", "featured", "promote"],
  },
  {
    id: "subscriptions",
    title: "Premium Plans",
    summary: "Seller Pro, Business, and Wholesale subscriptions unlock analytics and premium tools.",
    href: "/plans",
    helpTopicSlug: "subscriptions",
    keywords: ["subscription", "premium", "plans"],
  },
  {
    id: "rfq",
    title: "Request for Quote",
    summary: "Submit RFQ requests to verified wholesale suppliers.",
    href: "/wholesale",
    helpTopicSlug: "request-quote",
    keywords: ["rfq", "quote", "wholesale"],
  },
  {
    id: "trust",
    title: "Trust Score",
    summary: "Build reputation through verifications, successful orders, and community safety.",
    href: "/trust",
    helpTopicSlug: "trust-score",
    keywords: ["trust score", "verification", "badge"],
  },
];

export function explainFeature(query: string): FeatureExplanation | null {
  const normalized = query.toLowerCase();
  let best: { feature: FeatureExplanation; score: number } | null = null;

  for (const feature of MARKETPLACE_FEATURES) {
    let score = 0;
    if (normalized.includes(feature.title.toLowerCase())) score += 4;
    for (const keyword of feature.keywords) {
      if (normalized.includes(keyword)) score += 2;
    }
    if (score > 0 && (!best || score > best.score)) best = { feature, score };
  }

  return best?.feature ?? null;
}
