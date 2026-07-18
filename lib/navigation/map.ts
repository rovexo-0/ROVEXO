import type { UserProfile } from "@/lib/profile/types";
import { SUPER_ADMIN_PRIMARY_NAV } from "@/lib/super-admin/nav";
export type NavLink = {
  href: string;
  label: string;
  subtitle?: string;
};

export const BUYER_NAV: NavLink[] = [
  { href: "/orders", label: "Orders", subtitle: "Track & manage purchases" },
  { href: "/cart", label: "Cart", subtitle: "Items ready to checkout" },
  { href: "/saved", label: "Saved", subtitle: "Wishlist & saved items" },
  { href: "/resolution", label: "Resolution Centre", subtitle: "Disputes & protection cases" },
  { href: "/trust", label: "Trust Center", subtitle: "Score, verification & safety" },
  { href: "/help", label: "Help Centre", subtitle: "Guides & troubleshooting" },
  { href: "/plans", label: "Plans & Premium", subtitle: "Subscriptions & promotions" },
  { href: "/support", label: "Contact Support", subtitle: "Open a support ticket" },
  { href: "/categories", label: "Browse Categories", subtitle: "Explore the marketplace" },
];

export const SELLER_NAV: NavLink[] = [
  { href: "/seller", label: "Selling", subtitle: "Performance & overview" },
  { href: "/seller/listings", label: "My Listings", subtitle: "Manage inventory" },
  { href: "/seller/review-center", label: "Review Center", subtitle: "Listings under moderation" },
  { href: "/seller/orders", label: "Selling Orders", subtitle: "Fulfillment & shipping" },
  { href: "/wallet", label: "Wallet", subtitle: "Balance & withdrawals" },
  { href: "/seller/analytics", label: "Analytics", subtitle: "Views, sales & trends" },
  { href: "/seller/performance", label: "Seller Performance", subtitle: "Reputation Engine & level" },
  { href: "/seller/trust", label: "Trust Score", subtitle: "Reputation & improvements" },
  { href: "/seller/tax", label: "Tax Registration", subtitle: "VAT & tax settings" },
  { href: "/sell", label: "Sell Item", subtitle: "Create a new listing" },
  { href: "/sell/new", label: "Publish Listing", subtitle: "Listing creation wizard" },
];

export const BUSINESS_NAV: NavLink[] = [
  { href: "/business/dashboard", label: "Business Store", subtitle: "Store hub" },
  { href: "/business/analytics", label: "Analytics", subtitle: "Insights & reports" },
  { href: "/business/orders", label: "Orders", subtitle: "Fulfilment workspace" },
  { href: "/business/wallet", label: "Wallet", subtitle: "Balance & payouts" },
  { href: "/business/inventory", label: "Inventory", subtitle: "SKU & stock management" },
  { href: "/business/promotions", label: "Promotions", subtitle: "Boost listings" },
  { href: "/business/reviews", label: "Reviews", subtitle: "Seller review centre" },
  { href: "/business/shipping", label: "Shipping", subtitle: "Seller shipping settings" },
  { href: "/business/returns", label: "Returns", subtitle: "Returns & refunds" },
  { href: "/business/verification", label: "Verification", subtitle: "Business verification" },
  { href: "/business/policies", label: "Policies", subtitle: "Business seller terms" },
  { href: "/business/reports", label: "Reports", subtitle: "Analytics & reporting" },
  { href: "/seller/performance", label: "Performance", subtitle: "Reputation & level" },
  { href: "/account/followers", label: "Followers", subtitle: "Store followers" },
  { href: "/account/settings", label: "Settings", subtitle: "Account preferences" },
  { href: "/support", label: "Contact", subtitle: "Support" },
  { href: "/about", label: "About", subtitle: "About ROVEXO" },
];

export const SHARED_NAV: NavLink[] = [
  { href: "/inbox", label: "Inbox", subtitle: "Messages & notifications" },
  { href: "/inbox?tab=notifications", label: "Notifications", subtitle: "Alerts & activity" },
  { href: "/notifications/settings", label: "Notification Settings", subtitle: "Push & email preferences" },
  { href: "/settings", label: "Settings", subtitle: "Account & privacy" },
  { href: "/help", label: "Help Centre", subtitle: "Guides & troubleshooting" },
  { href: "/help/faq", label: "FAQ", subtitle: "Common questions" },
  { href: "/help/policies", label: "Policies", subtitle: "Terms & platform rules" },
];

export const SUPER_ADMIN_NAV_LINK: NavLink = {
  href: "/super-admin",
  label: "Super Admin",
  subtitle: "Platform control centre",
};

/**
 * @deprecated LEGACY. The `/admin/*` tree redirects to `/super-admin` (see
 * `app/admin/layout.tsx`). Retained temporarily to avoid regressions; will be
 * migrated to the Super Admin Command Center. Do not add new entries.
 */
export const ADMIN_NAV: NavLink[] = [
  { href: "/admin", label: "Admin Dashboard", subtitle: "Orders & promotions overview" },
  { href: "/admin/operations", label: "Production Operations", subtitle: "Health, cron & errors" },
  { href: "/admin/analytics", label: "Platform Analytics", subtitle: "Cross-platform metrics" },
  { href: "/admin/help", label: "Help Admin", subtitle: "Help centre analytics" },
  { href: "/admin/trust", label: "Trust Admin", subtitle: "Verification queue" },
  { href: "/admin/business", label: "Business Admin", subtitle: "Verified business profiles" },
  { href: "/admin/wholesale", label: "Wholesale Admin", subtitle: "Wholesale trade accounts" },
  { href: "/admin/monetization", label: "Monetization", subtitle: "Revenue & subscriptions" },
  { href: "/admin/orders", label: "Admin Orders", subtitle: "Order management" },
  { href: "/admin/promotions", label: "Promotions", subtitle: "Featured & bump campaigns" },
  { href: "/admin/moderation", label: "Moderation", subtitle: "Reports queue" },
  { href: "/admin/categories", label: "Categories", subtitle: "Category tree admin" },
  { href: "/admin/seo", label: "SEO Admin", subtitle: "Sitemap & audit" },
  { href: "/admin/protection", label: "Protection Cases", subtitle: "Dispute administration" },
];

export const HELP_NAV: NavLink[] = [
  { href: "/help", label: "Help Home" },
  { href: "/help/faq", label: "FAQ" },
  { href: "/help/policies", label: "Policies" },
  { href: "/support", label: "Contact Support" },
  { href: "/about", label: "About Us" },
  { href: "/legal", label: "Legal Centre" },
  { href: "/resolution", label: "Resolution Centre" },
  { href: "/trust", label: "Trust Center" },
];

export function getNavigationSections(profile: UserProfile) {
  const sections: Array<{ id: string; title: string; links: NavLink[] }> = [
    { id: "buying", title: "Buying", links: BUYER_NAV },
    { id: "selling", title: "Selling", links: SELLER_NAV },
  ];

  if (profile.capabilities.hasBusinessVerification || profile.isAdmin) {
    sections.push({ id: "business", title: "Business tools", links: BUSINESS_NAV });
  }

  sections.push({ id: "shared", title: "Account", links: SHARED_NAV });

  if (profile.isSuperAdmin) {
    sections.push({
      id: "super-admin",
      title: "Super Admin",
      links: SUPER_ADMIN_PRIMARY_NAV.map((item) => ({
        href: item.href,
        label: item.label,
        subtitle: item.description,
      })),
    });
  } else if (profile.isAdmin) {
    sections.push({ id: "admin", title: "Administration", links: ADMIN_NAV });
  }

  return sections;
}

export const ALL_PUBLIC_ROUTES = [
  "/",
  "/search",
  "/categories",
  "/cart",
  "/saved",
  "/account",
  "/orders",
  "/messages",
  "/inbox",
  "/notifications",
  "/settings",
  "/help",
  "/help/faq",
  "/help/policies",
  "/support",
  "/trust",
  "/about",
  "/legal",
  "/plans",
  "/wholesale",
  "/business/center",
  "/business/directory",
  "/resolution",
  "/sell",
  "/sell/new",
  "/import",
  "/import-wizard",
  "/seller/migration",
  "/seller/connectors",
  "/seller",
  "/business/dashboard",
  "/admin",
  "/super-admin",
] as const;
