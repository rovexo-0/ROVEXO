import { BUMP_DURATIONS, FEATURE_DURATIONS } from "@/lib/promotions/config";

export type MonetizationPlanTier = "free" | "seller_pro" | "business" | "wholesale" | "enterprise";

export type MonetizationPlan = {
  id: string;
  slug: string;
  name: string;
  tier: MonetizationPlanTier;
  priceCents: number;
  interval: string;
  features: string[];
};

export type MonetizationSubscription = {
  id: string;
  userId: string;
  planSlug: string;
  planName: string;
  status: "trialing" | "active" | "past_due" | "cancelled" | "expired";
  currentPeriodEnd: string | null;
};

export type MonetizationProduct = {
  id: string;
  type: "subscription" | "promotion" | "badge" | "rfq_premium" | "advertising";
  title: string;
  description: string;
  priceLabel: string;
  href?: string;
};

export const MONETIZATION_PRODUCTS: MonetizationProduct[] = [
  {
    id: "seller-pro",
    type: "subscription",
    title: "Seller Pro",
    description: "Analytics, promotion discounts, and priority support",
    priceLabel: "£9.99/mo",
    href: "/seller",
  },
  {
    id: "business-plan",
    type: "subscription",
    title: "Business Subscription",
    description: "Verified badge, leads, and business dashboard",
    priceLabel: "£29.99/mo",
    href: "/business/dashboard",
  },
  {
    id: "wholesale-plan",
    type: "subscription",
    title: "Wholesale Subscription",
    description: "Bulk pricing, RFQ, and verified wholesale badge",
    priceLabel: "£49.99/mo",
    href: "/wholesale",
  },
  {
    id: "bump",
    type: "promotion",
    title: "Bump Listings",
    description: "Move listings higher in category results",
    priceLabel: BUMP_DURATIONS[0]?.priceLabel ?? "£1.99",
    href: "/seller/listings",
  },
  {
    id: "featured",
    type: "promotion",
    title: "Featured Listings",
    description: "Highlight listings in discovery sections",
    priceLabel: FEATURE_DURATIONS[0]?.priceLabel ?? "£9.99",
    href: "/seller/listings",
  },
  {
    id: "verified-badge",
    type: "badge",
    title: "Verified Badges",
    description: "Business, wholesale, and manufacturer verification badges",
    priceLabel: "Included with verification",
    href: "/trust",
  },
  {
    id: "rfq-premium",
    type: "rfq_premium",
    title: "RFQ Premium",
    description: "Priority RFQ placement for B2B buyers",
    priceLabel: "£4.99 per RFQ",
    href: "/wholesale",
  },
  {
    id: "premium-ai",
    type: "subscription",
    title: "Premium AI",
    description: "Advanced marketplace assistant capabilities",
    priceLabel: "Enterprise plan",
    href: "/assistant",
  },
];
