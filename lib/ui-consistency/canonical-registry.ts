/**
 * ROVEXO Global UI Consistency — canonical shell registry (v1.0).
 * My Account — single `AccountCanonicalShell` + CDS primitives (v2.0 rebuild).
 */

export type UiShellKind =
  | "account-hub"
  | "account-module"
  | "canonical-header"
  | "beta-header-wrapper"
  | "super-admin";

export type UiModuleEntry = {
  module: string;
  route: string;
  shell: UiShellKind;
  headerComponent: string;
  cssNamespace: string;
  status: "canonical" | "wrapped" | "legacy";
};

export const GLOBAL_UI_MODULE_REGISTRY: UiModuleEntry[] = [
  {
    module: "My Account Hub",
    route: "/account",
    shell: "account-hub",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "ac-canonical",
    status: "canonical",
  },
  {
    module: "Account Subpages",
    route: "/account/*",
    shell: "account-module",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "acm",
    status: "canonical",
  },
  {
    module: "Settings & Security",
    route: "/account/settings, /account/security, /account/privacy, …",
    shell: "account-module",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "acm",
    status: "canonical",
  },
  {
    module: "Promotion Tools",
    route: "/account/promotion-tools",
    shell: "account-module",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "promo-v1",
    status: "canonical",
  },
  {
    module: "ROVEXO Ideas",
    route: "/account/ideas",
    shell: "account-module",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "acm",
    status: "canonical",
  },
  {
    module: "Buyer Dashboard",
    route: "/buyer",
    shell: "account-module",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "account-center",
    status: "canonical",
  },
  {
    module: "Seller Dashboard",
    route: "/seller",
    shell: "account-module",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "account-center",
    status: "canonical",
  },
  {
    module: "Wallet",
    route: "/wallet",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "wallet-hub",
    status: "canonical",
  },
  {
    module: "Orders",
    route: "/orders",
    shell: "beta-header-wrapper",
    headerComponent: "BetaPageHeader → CanonicalPageHeader",
    cssNamespace: "orders",
    status: "wrapped",
  },
  {
    module: "Messages",
    route: "/messages",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "msg-v1",
    status: "canonical",
  },
  {
    module: "Notifications",
    route: "/notifications",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "notif-v1",
    status: "canonical",
  },
  {
    module: "Help Centre",
    route: "/help",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "mhub",
    status: "canonical",
  },
  {
    module: "View Item",
    route: "/listing/*",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "pd-v1",
    status: "canonical",
  },
  {
    module: "Checkout",
    route: "/checkout",
    shell: "beta-header-wrapper",
    headerComponent: "CheckoutPageHeader → CanonicalPageHeader",
    cssNamespace: "checkout",
    status: "wrapped",
  },
  {
    module: "My Listings",
    route: "/seller/listings",
    shell: "account-module",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "acm",
    status: "canonical",
  },
  {
    module: "Saved",
    route: "/saved",
    shell: "account-module",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "acm",
    status: "canonical",
  },
  {
    module: "Discovery & SEO",
    route: "/categories, /category/*, /brand/*, /browse/*, /collections/*, /discover/*, /trends/*, /l/*",
    shell: "canonical-header",
    headerComponent: "DiscoveryPageShell → RovexoHeaderV2",
    cssNamespace: "rx-category-index",
    status: "canonical",
  },
  {
    module: "Seller Store",
    route: "/store/*",
    shell: "canonical-header",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "store",
    status: "canonical",
  },
  {
    module: "Auctions",
    route: "/auctions",
    shell: "canonical-header",
    headerComponent: "AccountCanonicalShell → AccountCanonicalHeader",
    cssNamespace: "auctions",
    status: "canonical",
  },
  {
    module: "Legal",
    route: "/legal, /legal/*",
    shell: "canonical-header",
    headerComponent: "CanonicalPageShell",
    cssNamespace: "legal-lock",
    status: "canonical",
  },
  {
    module: "Support",
    route: "/support",
    shell: "canonical-header",
    headerComponent: "CanonicalPageShell",
    cssNamespace: "support",
    status: "canonical",
  },
  {
    module: "Plans",
    route: "/plans",
    shell: "canonical-header",
    headerComponent: "CanonicalPageShell",
    cssNamespace: "plans",
    status: "canonical",
  },
  {
    module: "Resolution Centre",
    route: "/resolution, /resolution/*",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "mhub",
    status: "canonical",
  },
  {
    module: "Trust Center",
    route: "/trust",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "mhub",
    status: "canonical",
  },
  {
    module: "Business Directory",
    route: "/business/directory",
    shell: "canonical-header",
    headerComponent: "CanonicalPageShell",
    cssNamespace: "business",
    status: "canonical",
  },
  {
    module: "Wholesale Center",
    route: "/wholesale",
    shell: "canonical-header",
    headerComponent: "CanonicalPageShell",
    cssNamespace: "wholesale",
    status: "canonical",
  },
  {
    module: "Business Inventory",
    route: "/business/inventory",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "business",
    status: "canonical",
  },
  {
    module: "Seller Compliance",
    route: "/seller/compliance, /seller/tax",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "compliance",
    status: "canonical",
  },
  {
    module: "Marketplace Connectors",
    route: "/seller/marketplace-connectors",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "seller",
    status: "canonical",
  },
  {
    module: "Bring Your Item",
    route: "/account/bring-your-item",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "byi",
    status: "canonical",
  },
  {
    module: "Notification Settings",
    route: "/notifications/settings",
    shell: "canonical-header",
    headerComponent: "CanonicalPageHeader",
    cssNamespace: "notif-v1",
    status: "canonical",
  },
  {
    module: "Analytics",
    route: "/seller/analytics, /business/analytics",
    shell: "canonical-header",
    headerComponent: "AnalyticsHeader → CanonicalPageHeader",
    cssNamespace: "analytics",
    status: "canonical",
  },
  {
    module: "Super Admin",
    route: "/super-admin/*",
    shell: "super-admin",
    headerComponent: "SuperAdminShell / EnterpriseAdminShell",
    cssNamespace: "ea-admin",
    status: "canonical",
  },
];

export const CANONICAL_DESIGN_TOKENS = {
  spacing: "styles/tokens.css (--ds-space-*)",
  typography: "text-display | text-heading | text-title | text-body | text-caption",
  buttons: "components/ui/Button.tsx + buttonVariants",
  cards: "components/ui/Card.tsx + rx-surface-card",
  pageHeader: "components/navigation/CanonicalPageHeader.tsx",
  accountHub: "styles/rovexo/account-canonical-v2.css",
  accountModule: "styles/rovexo/account-module-v1.css",
  rowHeight: "48px menu rows (ac-canonical__row), 44px touch targets",
  borderRadius: "--ds-radius-sm (12px) cards; 14px account section cards",
} as const;

export const DEPRECATED_UI_PATTERNS = [
  "Legacy AccountPageShell / SettingsPageShell (replaced by AccountCanonicalShell)",
  "AccountCenterHeader on module dashboards",
  "ac-hub__* legacy hub classes",
  "PageBack variant=text as primary page header",
  "text-2xl font-bold standalone h1 outside canonical shells",
  "components/Header (legacy discovery header)",
  "StickyPageHeader bespoke shells",
  "Inline rx-page-header clones outside CanonicalPageHeader",
] as const;
