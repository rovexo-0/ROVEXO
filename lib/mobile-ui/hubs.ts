import {
  ADMIN_NAV,
  BUYER_NAV,
  SHARED_NAV,
  type NavLink,
} from "@/lib/navigation/map";
import { SUPER_ADMIN_NAV } from "@/lib/super-admin/nav";
import { TRUST_CENTER_SECTIONS } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";
import type { MobileHubSection, MobileTile, MobileBadgeKey } from "@/lib/mobile-ui/types";

function tile(
  href: string,
  label: string,
  subtitle: string,
  badge?: MobileBadgeKey,
): MobileTile {
  return { href, label, subtitle, badge };
}

function fromNav(links: NavLink[], badges?: Partial<Record<string, MobileBadgeKey>>): MobileTile[] {
  return links.map((link) =>
    tile(link.href, link.label, link.subtitle ?? "", badges?.[link.href]),
  );
}

const BUYER_HUB: MobileTile[] = [
  tile("/orders", "Orders", "Track purchases", "orders"),
  tile("/cart", "Cart", "Ready to checkout", "cart"),
  tile("/saved", "Saved", "Wishlist items", "saved"),
  tile("/messages", "Messages", "Buyer & seller chats", "messages"),
  tile("/notifications", "Notifications", "Alerts & activity", "notifications"),
  tile("/search", "Recently Viewed", "Continue browsing"),
  tile("/saved", "Saved Searches", "Your search alerts"),
  tile("/search?q=offers", "Offers", "Deals & promotions"),
  tile("/resolution", "Resolution Centre", "Disputes & cases"),
  tile("/trust", "Trust Centre", "Score & safety"),
  tile("/assistant", "AI Assistant", "Help & guidance"),
  tile("/categories", "Categories", "Browse marketplace"),
  tile("/plans", "Premium", "Plans & subscriptions"),
  tile("/seller/wallet", "Wallet", "Balance & payouts", "wallet-payout"),
];

const SELLER_HUB: MobileTile[] = [
  tile("/seller/dashboard", "Seller Dashboard", "Performance overview"),
  tile("/seller/listings", "My Listings", "Manage inventory"),
  tile("/seller/orders", "Seller Orders", "Fulfillment", "orders"),
  tile("/seller/wallet", "Wallet", "Balance & payouts", "wallet-payout"),
  tile("/seller/analytics", "Analytics", "Views & sales"),
  tile("/seller/trust", "Trust Score", "Reputation"),
  tile("/seller/tax", "Tax Registration", "VAT & tax"),
  tile("/plans", "Promotions", "Featured & bumps"),
  tile("/seller/analytics", "Performance", "30-day metrics"),
  tile("/sell", "Sell Item", "Create listing"),
];

const BUSINESS_HUB: MobileTile[] = [
  tile("/business/dashboard", "Business Dashboard", "Revenue & orders"),
  tile("/business/inventory", "Products", "SKU & stock"),
  tile("/business/dashboard", "Orders", "Business orders"),
  tile("/business/inventory", "Warehouse", "Stock management"),
  tile("/business/dashboard", "Invoices", "Billing records"),
  tile("/seller/listings", "Marketing", "Promotions"),
  tile("/business/analytics", "Reports", "Business reports"),
  tile("/business/analytics", "Analytics", "Insights"),
  tile("/messages", "Leads", "Buyer conversations"),
  tile("/business/center", "Team", "Business hub"),
  tile("/settings", "Settings", "Business preferences"),
];

const COMPANY_HUB: MobileTile[] = [
  tile("/business/dashboard", "Company Dashboard", "Company overview"),
  tile("/business/center", "Employees", "Team access"),
  tile("/business/inventory", "Products", "Catalogue"),
  tile("/business/dashboard", "Orders", "Company orders"),
  tile("/business/inventory", "Warehouse", "Inventory"),
  tile("/business/analytics", "Analytics", "Company metrics"),
  tile("/business/dashboard", "Invoices", "Finance"),
  tile("/seller/listings", "Marketing", "Campaigns"),
  tile("/settings", "Settings", "Company settings"),
];

const SUPPORT_HUB: MobileTile[] = [
  tile("/help", "Help Centre", "Guides & articles"),
  tile("/help/faq", "FAQ", "Common questions"),
  tile("/help/policies", "Policies", "Platform rules"),
  tile("/help/terms-of-service", "Terms", "Terms of service"),
  tile("/help/privacy-policy", "Privacy", "Privacy policy"),
  tile("/assistant", "AI Assistant", "Guided help"),
  tile("/support", "Open Ticket", "Contact support"),
  tile("/support", "My Tickets", "Ticket history"),
  tile("/support", "Contact Support", "Get help"),
  tile("/resolution", "Resolution Centre", "Disputes"),
];

function superAdminHub(): MobileHubSection[] {
  return SUPER_ADMIN_NAV.map((section) => ({
    id: section.id,
    title: section.title,
    tiles: section.items.map((item) =>
      tile(item.href, item.label, item.description ?? ""),
    ),
  }));
}

export function getAccountHubSections(profile: UserProfile): MobileHubSection[] {
  const quick = BUYER_HUB.slice(0, 14);
  const sections: MobileHubSection[] = [{ id: "quick-access", title: "Quick Access", tiles: quick }];

  const buyerExtra = fromNav(
    BUYER_NAV.filter((l) => !quick.some((q) => q.href === l.href && q.label === l.label)),
    { "/cart": "cart", "/orders": "orders", "/saved": "saved" },
  );
  if (buyerExtra.length) {
    sections.push({ id: "buyer", title: "Buyer", tiles: buyerExtra });
  }

  if (profile.isSeller) {
    sections.push({ id: "seller", title: "Seller", tiles: SELLER_HUB });
  }

  if (profile.accountType === "business" || profile.isAdmin) {
    sections.push({ id: "business", title: "Business", tiles: BUSINESS_HUB });
    sections.push({ id: "company", title: "Company", tiles: COMPANY_HUB });
  }

  if (profile.isSuperAdmin) {
    sections.push(...superAdminHub());
  } else if (profile.isAdmin) {
    sections.push({ id: "admin", title: "Administration", tiles: fromNav(ADMIN_NAV) });
  }

  sections.push({
    id: "account",
    title: "Account",
    tiles: [
      ...fromNav(SHARED_NAV, {
        "/messages": "messages",
        "/notifications": "notifications",
      }),
      tile("/settings", "Settings", "Preferences & privacy"),
      tile("/legal", "About ROVEXO", "Platform information"),
    ],
  });

  return sections;
}

export function getSupportHubSections(): MobileHubSection[] {
  return [{ id: "support", title: "Support", tiles: SUPPORT_HUB }];
}

export function getSellerHubSections(): MobileHubSection[] {
  return [{ id: "seller", title: "Seller Tools", tiles: SELLER_HUB }];
}

export function getBusinessHubSections(): MobileHubSection[] {
  return [
    { id: "business", title: "Business", tiles: BUSINESS_HUB },
    { id: "company", title: "Company", tiles: COMPANY_HUB },
  ];
}

export function getTrustHubSections(): MobileHubSection[] {
  return [
    {
      id: "trust",
      title: "Trust Centre",
      tiles: TRUST_CENTER_SECTIONS.map((s) => tile(s.href, s.title, s.description)),
    },
    {
      id: "trust-quick",
      title: "Quick Access",
      tiles: [
        tile("/resolution", "Resolution Centre", "Disputes"),
        tile("/assistant", "AI Assistant", "Guided help"),
        tile("/help", "Help Centre", "Articles"),
        tile("/support", "Contact Support", "Open ticket"),
      ],
    },
  ];
}

export function getSuperAdminHubSections(): MobileHubSection[] {
  return superAdminHub();
}

export function getHelpHubQuickTiles(): MobileTile[] {
  return SUPPORT_HUB.filter((t) =>
    ["/help", "/help/faq", "/help/policies", "/assistant", "/resolution", "/trust", "/support"].includes(
      t.href,
    ),
  );
}

export function getAdminHubSections(): MobileHubSection[] {
  return [{ id: "admin", title: "Administration", tiles: fromNav(ADMIN_NAV) }];
}

export function getPlansHubSections(): MobileHubSection[] {
  return [
    {
      id: "plans-nav",
      title: "Premium",
      tiles: [
        tile("/plans", "Plans", "Subscriptions & premium"),
        tile("/seller/listings", "Promotions", "Featured listings"),
        tile("/business/dashboard", "Business", "Business tools"),
        tile("/wholesale", "Wholesale", "B2B trade"),
        tile("/help", "Help", "Premium support"),
        tile("/account", "Account", "Manage subscription"),
      ],
    },
  ];
}

export function getWholesaleHubSections(): MobileHubSection[] {
  return [
    {
      id: "wholesale",
      title: "Wholesale",
      tiles: [
        tile("/business/inventory", "Bulk pricing", "Volume tiers"),
        tile("/business/directory", "Directory", "Verified suppliers"),
        tile("/plans", "Wholesale plans", "B2B subscriptions"),
        tile("/help/category/wholesale", "Wholesale help", "Guides"),
        tile("/trust", "Verification", "Trade verification"),
        tile("/business/center", "Business center", "Company hub"),
      ],
    },
  ];
}

export function getCategoriesNavSections(): MobileHubSection[] {
  return [
    {
      id: "browse",
      title: "Browse",
      tiles: [
        tile("/search", "Search", "Find anything"),
        tile("/saved", "Saved", "Wishlist"),
        tile("/cart", "Cart", "Checkout"),
        tile("/orders", "Orders", "Purchases"),
      ],
    },
  ];
}

export { BUYER_HUB, SELLER_HUB, BUSINESS_HUB, SUPPORT_HUB };
