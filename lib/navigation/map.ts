import type { UserProfile } from "@/lib/profile/types";
import { SUPER_ADMIN_PRIMARY_NAV } from "@/lib/super-admin/nav";
import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";

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
  { href: "/assistant", label: "AI Assistant", subtitle: "Help, search & guidance" },
  { href: "/plans", label: "Plans & Premium", subtitle: "Subscriptions & promotions" },
  { href: "/support", label: "Contact Support", subtitle: "Open a support ticket" },
  { href: "/categories", label: "Browse Categories", subtitle: "Explore the marketplace" },
];

export const SELLER_NAV: NavLink[] = [
  { href: "/seller/dashboard", label: "Seller Dashboard", subtitle: "Performance & overview" },
  { href: "/seller/listings", label: "My Listings", subtitle: "Manage inventory" },
  { href: "/seller/orders", label: "Seller Orders", subtitle: "Fulfillment & shipping" },
  { href: "/seller/wallet", label: "Wallet", subtitle: "Balance & withdrawals" },
  { href: "/seller/analytics", label: "Seller Analytics", subtitle: "Views, sales & trends" },
  { href: MIGRATION_CENTER_PATH, label: "Bring Your Items", subtitle: "Import your entire store" },
  { href: "/seller/connectors", label: "Marketplace Connectors", subtitle: "Connect external stores" },
  { href: "/seller/trust", label: "Trust Score", subtitle: "Reputation & improvements" },
  { href: "/seller/tax", label: "Tax Registration", subtitle: "VAT & tax settings" },
  { href: "/sell", label: "Sell Item", subtitle: "Create a new listing" },
  { href: "/sell/new", label: "Publish Listing", subtitle: "Listing creation wizard" },
];

export const BUSINESS_NAV: NavLink[] = [
  { href: "/business/center", label: "Business Center", subtitle: "Hub for B2B tools" },
  { href: "/business/dashboard", label: "Business Dashboard", subtitle: "Revenue & orders" },
  { href: "/business/inventory", label: "Inventory", subtitle: "SKU & stock management" },
  { href: "/business/analytics", label: "Business Analytics", subtitle: "Insights & reports" },
  { href: "/business/directory", label: "Business Directory", subtitle: "Verified companies" },
  { href: "/wholesale", label: "Wholesale Center", subtitle: "MOQ, RFQ & bulk pricing" },
];

export const SHARED_NAV: NavLink[] = [
  { href: "/messages", label: "Messages", subtitle: "Buyer & seller chats" },
  { href: "/notifications", label: "Notifications", subtitle: "Alerts & activity" },
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

export const ADMIN_NAV: NavLink[] = [
  { href: "/admin", label: "Admin Dashboard", subtitle: "Orders & promotions overview" },
  { href: "/admin/operations", label: "Production Operations", subtitle: "Health, cron & errors" },
  { href: "/admin/analytics", label: "Platform Analytics", subtitle: "Cross-platform metrics" },
  { href: "/admin/help", label: "Help Admin", subtitle: "Help centre analytics" },
  { href: "/admin/trust", label: "Trust Admin", subtitle: "Verification queue" },
  { href: "/admin/business", label: "Business Admin", subtitle: "Business accounts" },
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
  { href: "/assistant", label: "AI Assistant" },
  { href: "/resolution", label: "Resolution Centre" },
  { href: "/trust", label: "Trust Center" },
];

export function getNavigationSections(profile: UserProfile) {
  const sections: Array<{ id: string; title: string; links: NavLink[] }> = [
    { id: "buyer", title: "Buyer Dashboard", links: BUYER_NAV },
  ];

  if (profile.isSeller) {
    sections.push({ id: "seller", title: "Seller Dashboard", links: SELLER_NAV });
  }

  if (profile.accountType === "business" || profile.isAdmin) {
    sections.push({ id: "business", title: "Business Dashboard", links: BUSINESS_NAV });
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
  "/notifications",
  "/settings",
  "/help",
  "/help/faq",
  "/help/policies",
  "/support",
  "/trust",
  "/assistant",
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
  "/seller/dashboard",
  "/business/dashboard",
  "/admin",
  "/super-admin",
] as const;
