import type { HelpCategory } from "@/lib/help/types";
import { isLegacyHelpTopicSlug } from "@/lib/help/help-content-audience-v1";

export type HelpBreadcrumb = {
  href: string;
  label: string;
};

const CATEGORY_TO_HUB: Partial<Record<HelpCategory, { href: string; label: string }>> = {
  account: { href: "/help/category/account", label: "Account" },
  buying: { href: "/help/category/buyer", label: "Buying" },
  selling: { href: "/help/category/seller", label: "Selling" },
  payments: { href: "/help/category/payments", label: "Payments & Wallet" },
  delivery: { href: "/help/category/shipping", label: "Shipping" },
  chat: { href: "/help/category/safety", label: "Safety" },
  "pro-seller": { href: "/help/category/seller", label: "Selling" },
  "business-accounts": { href: "/help/category/seller", label: "Selling" },
  safety: { href: "/help/category/safety", label: "Safety" },
  "ai-moderation": { href: "/help/category/reports", label: "Reports & Appeals" },
  "prohibited-items": { href: "/help/category/safety", label: "Safety" },
  "community-guidelines": { href: "/help/category/safety", label: "Safety" },
  "reports-appeals": { href: "/help/category/reports", label: "Reports & Appeals" },
  privacy: { href: "/help/policies", label: "Policies" },
  terms: { href: "/help/policies", label: "Policies" },
};

export function helpCategoryBreadcrumb(category: HelpCategory): HelpBreadcrumb {
  return CATEGORY_TO_HUB[category] ?? { href: "/help", label: "Help Centre" };
}

export function helpTopicGuideHref(topicSlug: string | undefined): string | null {
  if (!topicSlug || isLegacyHelpTopicSlug(topicSlug)) {
    return null;
  }
  return `/help/category/${topicSlug}`;
}
