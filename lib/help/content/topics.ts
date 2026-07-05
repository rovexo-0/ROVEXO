import { node, option, solution, tree } from "@/lib/help/decision-trees/builder";
import type { DecisionTree, HelpTopic, HelpTopicSlug } from "@/lib/help/types";

export type TopicSeed = Pick<HelpTopic, "slug" | "label" | "description" | "icon" | "group" | "keywords">;

export const TOPIC_SEEDS: TopicSeed[] = [
  { slug: "account", label: "Account", description: "Profile, settings, and account access", icon: "👤", group: "Account & Security", keywords: ["account", "profile", "settings"] },
  { slug: "authentication", label: "Authentication", description: "Sign in, passwords, and verification codes", icon: "🔐", group: "Account & Security", keywords: ["login", "password", "sign in"] },
  { slug: "buyer", label: "Buyer", description: "Buying, checkout, and buyer protection", icon: "🛒", group: "Marketplace", keywords: ["buy", "purchase", "checkout"] },
  { slug: "seller", label: "Seller", description: "Selling, listings, and seller tools", icon: "🏷️", group: "Marketplace", keywords: ["sell", "listing", "seller"] },
  { slug: "business-accounts", label: "Business Accounts", description: "Business selling and company profiles", icon: "🏢", group: "Business", keywords: ["business", "company", "vat"] },
  { slug: "wholesale", label: "Wholesale", description: "Bulk orders, MOQ, and B2B trade", icon: "📦", group: "Business", keywords: ["wholesale", "bulk", "moq", "rfq"] },
  { slug: "manufacturers", label: "Manufacturers", description: "Verified manufacturers and production", icon: "🏭", group: "Business", keywords: ["manufacturer", "production"] },
  { slug: "suppliers", label: "Suppliers", description: "Verified suppliers and sourcing", icon: "🔗", group: "Business", keywords: ["supplier", "sourcing"] },
  { slug: "orders", label: "Orders", description: "Order tracking, delivery, and issues", icon: "📋", group: "Marketplace", keywords: ["order", "tracking", "delivery"] },
  { slug: "payments", label: "Payments", description: "Checkout, cards, and payment issues", icon: "💳", group: "Payments", keywords: ["payment", "card", "checkout"] },
  { slug: "withdraw", label: "Withdraw", description: "Seller withdrawals and payouts", icon: "💷", group: "Payments", keywords: ["withdraw", "payout", "processing"] },
  { slug: "stripe", label: "Payouts & Bank Setup", description: "Bank account setup and seller payouts", icon: "💠", group: "Payments", keywords: ["payout", "bank", "connect", "stripe"] },
  { slug: "wallet", label: "Wallet", description: "Seller wallet balance and transactions", icon: "👛", group: "Payments", keywords: ["wallet", "balance", "transaction"] },
  { slug: "chat-messages", label: "Chat & Messages", description: "Messaging buyers and sellers", icon: "💬", group: "Communication", keywords: ["chat", "message", "conversation"] },
  { slug: "trust-score", label: "Trust Score", description: "Trust, reputation, and safety signals", icon: "⭐", group: "Trust & Safety", keywords: ["trust", "score", "reputation"] },
  { slug: "verification", label: "Verification", description: "Identity and business verification", icon: "✅", group: "Trust & Safety", keywords: ["verify", "identity", "kyc"] },
  { slug: "reports", label: "Reports & Appeals", description: "Report content, scams, and appeals", icon: "🚩", group: "Trust & Safety", keywords: ["report", "appeal", "scam"] },
  { slug: "shipping", label: "Shipping", description: "Shipping methods and delivery help", icon: "🚚", group: "Marketplace", keywords: ["shipping", "delivery", "postage"] },
  { slug: "returns", label: "Returns", description: "Return requests and seller returns", icon: "↩️", group: "Marketplace", keywords: ["return", "send back"] },
  { slug: "refunds", label: "Refunds", description: "Refund requests and buyer protection", icon: "💸", group: "Marketplace", keywords: ["refund", "money back"] },
  { slug: "subscriptions", label: "Subscriptions", description: "Seller and business subscription plans", icon: "🔄", group: "Monetization", keywords: ["subscription", "plan", "premium"] },
  { slug: "promoted-listings", label: "Promoted Listings", description: "Promote listings for more visibility", icon: "📣", group: "Monetization", keywords: ["promoted", "advertise"] },
  { slug: "featured-listings", label: "Featured Listings", description: "Featured placement on ROVEXO", icon: "✨", group: "Monetization", keywords: ["featured", "highlight"] },
  { slug: "bump-listings", label: "Bump Listings", description: "Refresh listings in search results", icon: "⬆️", group: "Monetization", keywords: ["bump", "refresh"] },
  { slug: "auto", label: "Auto", description: "Vehicles, parts, and automotive listings", icon: "🚗", group: "Verticals", keywords: ["car", "auto", "vehicle"] },
  { slug: "license-plate-search", label: "License Plate Search", description: "Find parts by registration plate", icon: "🔢", group: "Verticals", keywords: ["plate", "registration"] },
  { slug: "vin-search", label: "VIN Search", description: "Find parts by vehicle identification number", icon: "🆔", group: "Verticals", keywords: ["vin", "vehicle id"] },
  { slug: "property", label: "Property", description: "Property listings and enquiries", icon: "🏠", group: "Verticals", keywords: ["property", "rent", "real estate"] },
  { slug: "jobs", label: "Jobs", description: "Job listings and applications", icon: "💼", group: "Verticals", keywords: ["job", "hire", "career"] },
  { slug: "services", label: "Services", description: "Service listings and bookings", icon: "🛠️", group: "Verticals", keywords: ["service", "booking"] },
  { slug: "business-directory", label: "Business Directory", description: "Discover verified businesses", icon: "📇", group: "Business", keywords: ["directory", "company list"] },
  { slug: "company-profiles", label: "Company Profiles", description: "Public business and company pages", icon: "🏛️", group: "Business", keywords: ["company profile", "storefront"] },
  { slug: "request-quote", label: "Request Quote", description: "RFQ and quote requests", icon: "📝", group: "Business", keywords: ["quote", "rfq", "request quote"] },
  { slug: "request-part", label: "Request Part", description: "Request hard-to-find parts", icon: "🔧", group: "Verticals", keywords: ["request part", "part finder"] },
  { slug: "request-services", label: "Request Services", description: "Request professional services", icon: "📞", group: "Verticals", keywords: ["request service"] },
  { slug: "safety", label: "Safety", description: "Community safety and scam prevention", icon: "🛡️", group: "Trust & Safety", keywords: ["safety", "scam", "fraud"] },
  { slug: "privacy", label: "Privacy", description: "Privacy settings and data use", icon: "🔒", group: "Policies", keywords: ["privacy", "data"] },
  { slug: "policies", label: "Policies", description: "Platform rules and policies", icon: "📜", group: "Policies", keywords: ["policy", "rules", "terms"] },
  { slug: "support", label: "Support", description: "Contact ROVEXO Support", icon: "🎧", group: "Help", keywords: ["support", "contact", "help"] },
  { slug: "other", label: "Other", description: "General help and navigation", icon: "❓", group: "Help", keywords: ["other", "general"] },
];

export const HELP_TOPICS: HelpTopic[] = TOPIC_SEEDS.map((topic, index) => ({
  ...topic,
  relatedTopics: [],
  relatedFeatures: [],
  relatedPolicies: [],
  searchRanking: 100 - index,
  visible: true,
}));

export function getHelpTopic(slug: string): HelpTopic | undefined {
  return HELP_TOPICS.find((topic) => topic.slug === slug);
}

export function getHelpTopicsByGroup(group: string): HelpTopic[] {
  return HELP_TOPICS.filter((topic) => topic.group === group && topic.visible);
}

export const HELP_TOPIC_GROUPS = [...new Set(HELP_TOPICS.map((topic) => topic.group))];

export function buildGenericDecisionTree(seed: TopicSeed): DecisionTree {
  const solutionId = `${seed.slug}-overview`;
  return tree(
    seed.slug as HelpTopicSlug,
    `${seed.label} help`,
    "root",
    [
      node("root", `What do you need help with for ${seed.label.toLowerCase()}?`, [
        option("overview", `Overview of ${seed.label}`, { solutionId }),
        option("articles", "Browse related articles", { articleSlug: seed.slug === "privacy" ? "privacy-policy" : undefined, solutionId }),
        option("support", "Contact Support", { solutionId: `${seed.slug}-support` }),
      ]),
    ],
    [
      solution(solutionId, {
        title: `${seed.label} on ROVEXO`,
        overview: seed.description,
        steps: [
          `Open the ${seed.label} section from Help Center or your account dashboard.`,
          "Follow the on-screen guidance for your specific issue.",
          "Contact Support if the guided steps do not resolve your issue.",
        ],
        requirements: [],
        processingTime: "Varies by issue",
        commonMistakes: ["Skipping verification or setup steps"],
        troubleshooting: [`Search Help Center for "${seed.keywords[0] ?? seed.label}"`],
        relatedQuestions: [],
        relatedTopics: [],
        relatedFeatures: [],
        relatedPolicies: [],
        faqs: [],
        lastUpdated: "2025-06-19",
      }),
      solution(`${seed.slug}-support`, {
        title: `Contact Support — ${seed.label}`,
        overview: "Complete guided troubleshooting before opening a support ticket.",
        steps: [
          "Review the suggested articles in this category.",
          "Gather screenshots and order or transaction IDs if relevant.",
          "Contact Support from the Help Center resolution flow.",
        ],
        requirements: ["Completed guided troubleshooting"],
        processingTime: "Support responds within 1 business day",
        commonMistakes: ["Opening duplicate tickets"],
        troubleshooting: [],
        relatedQuestions: [],
        relatedTopics: ["support"],
        relatedFeatures: [{ label: "Contact Support", href: "/support" }],
        relatedPolicies: [],
        faqs: [],
        lastUpdated: "2025-06-19",
      }),
    ],
  );
}
