import {
  ADMIN_NAV,
  SUPER_ADMIN_NAV_LINK,
  type NavLink,
} from "@/lib/navigation/map";
import { SUPER_ADMIN_NAV } from "@/lib/super-admin/nav";
import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import type { UserProfile } from "@/lib/profile/types";
import type {
  MobileHubContext,
  MobileHubSection,
  MobilePrimaryHub,
  MobilePrimaryHubId,
  MobileTile,
  MobileBadgeKey,
} from "@/lib/mobile-ui/types";

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

function dedupeTiles(tiles: MobileTile[]): MobileTile[] {
  const seen = new Set<string>();
  return tiles.filter((entry) => {
    const key = `${entry.href}::${entry.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** ROVEXO v1.0 — Buy Hub (design system locked). */
export function getBuyHubTiles(): MobileTile[] {
  return [
    tile("/orders", "Orders", "Track purchases", "orders"),
    tile("/cart", "Cart", "Items ready to checkout", "cart"),
    tile("/saved", "Saved", "Wishlist items", "saved"),
    tile("/search", "Search", "Find anything"),
    tile("/auctions", "Auctions", "Live bidding"),
    tile("/messages", "Messages", "Buyer & seller chats", "messages"),
    tile("/notifications", "Notifications", "Alerts & activity", "notifications"),
    tile("/trust", "Trust", "Score & safety"),
    tile("/assistant", "AI Assistant", "Help & guidance"),
    tile("/plans", "Premium", "Subscriptions & plans"),
    tile("/categories", "Categories", "Explore marketplace"),
    tile("/support", "Support", "Contact us"),
  ];
}

/** ROVEXO v1.0 — Sell Hub (design system locked). */
export function getSellHubTiles(profile: UserProfile): MobileTile[] {
  return [
    tile("/seller/dashboard", "Seller Dashboard", profile.isSeller ? "Performance & overview" : "Preview seller tools"),
    tile("/seller/listings", "My Listings", "Manage inventory"),
    tile("/seller/orders", "Seller Orders", "Fulfillment & shipping", "orders"),
    tile("/seller/wallet", "Wallet", "Balance & withdrawals", "wallet-payout"),
    tile("/seller/analytics", "Analytics", "Views, sales & trends"),
    tile(MIGRATION_CENTER_PATH, "Bring Your Item", "Import your store"),
    tile("/sell/new", "Publish Wizard", "Step-by-step listing"),
    tile("/seller/tax", "Tax", "VAT & registration"),
  ];
}

/** ROVEXO v1.0 — Business Hub (design system locked). */
export function getBusinessHubTiles(profile: UserProfile, context?: MobileHubContext): MobileTile[] {
  const tiles: MobileTile[] = [
    ...(context?.storeSlug
      ? [tile(`/store/${context.storeSlug}`, "Company profile", "Public store page")]
      : []),
    tile("/business/center", "Business Centre", "Hub for B2B tools"),
    tile("/wholesale", "Wholesale", "MOQ, RFQ & bulk pricing"),
    tile("/business/dashboard", "Dashboard", "Revenue & orders"),
    tile("/business/analytics", "Analytics", "Insights & reports"),
    tile("/business/directory", "Directory", "Verified companies"),
    tile("/plans", "Plans", "Business subscriptions"),
    tile("/business/inventory", "Inventory", "SKU & stock management"),
  ];

  if (profile.isSuperAdmin) {
    tiles.push(
      tile(SUPER_ADMIN_NAV_LINK.href, SUPER_ADMIN_NAV_LINK.label, SUPER_ADMIN_NAV_LINK.subtitle ?? ""),
      ...SUPER_ADMIN_NAV.flatMap((section) =>
        section.items.slice(0, 2).map((item) =>
          tile(item.href, item.label, item.description ?? ""),
        ),
      ),
    );
  } else if (profile.isAdmin) {
    tiles.push(...fromNav(ADMIN_NAV));
  }

  return dedupeTiles(tiles);
}

/** ROVEXO v1.0 — Support Hub (design system locked). */
export function getSupportHubTiles(): MobileTile[] {
  return [
    tile("/help", "Help", "Guides & troubleshooting"),
    tile("/resolution", "Resolution", "Disputes & cases"),
    tile("/help/policies", "Policies", "Platform rules"),
    tile("/help/faq", "FAQ", "Common questions"),
    tile("/trust", "Trust Centre", "Score & safety"),
    tile("/legal", "Legal", "Platform information"),
    tile("/help/privacy-policy", "Privacy", "Data & privacy"),
    tile("/help/terms-of-service", "Terms", "Platform terms"),
    tile("/assistant", "AI Assistant", "Help & guidance"),
    tile("/support", "Contact Support", "Open a support ticket"),
  ];
}

export function getMobilePrimaryHubs(
  profile: UserProfile,
  context?: MobileHubContext,
): MobilePrimaryHub[] {
  return [
    {
      id: "buy",
      label: "Buy",
      subtitle: "Orders, cart, saved & discovery",
      tiles: getBuyHubTiles(),
    },
    {
      id: "sell",
      label: "Sell",
      subtitle: profile.isSeller ? "Listings, orders & wallet" : "Start selling on ROVEXO",
      tiles: getSellHubTiles(profile),
    },
    {
      id: "business",
      label: "Business",
      subtitle: "B2B tools, wholesale & analytics",
      tiles: getBusinessHubTiles(profile, context),
    },
    {
      id: "support",
      label: "Support",
      subtitle: "Help, trust, policies & tickets",
      tiles: getSupportHubTiles(),
    },
  ];
}

export function getMobilePrimaryHub(
  id: MobilePrimaryHubId,
  profile: UserProfile,
  context?: MobileHubContext,
): MobilePrimaryHub | undefined {
  return getMobilePrimaryHubs(profile, context).find((hub) => hub.id === id);
}

function superAdminHub(): MobileHubSection[] {
  return SUPER_ADMIN_NAV.map((section) => ({
    id: section.id,
    title: section.title,
    tiles: section.items.map((item) =>
      tile(item.href, item.label, item.description ?? ""),
    ),
  }));
}

/** @deprecated Use getMobilePrimaryHubs */
export function getAccountHubSections(profile: UserProfile): MobileHubSection[] {
  return getMobilePrimaryHubs(profile).map((hub) => ({
    id: hub.id,
    title: hub.label,
    tiles: hub.tiles,
  }));
}

export function getSupportHubSections(): MobileHubSection[] {
  return [{ id: "support", title: "Support", tiles: getSupportHubTiles() }];
}

export function getSellerHubSections(profile: UserProfile): MobileHubSection[] {
  return [{ id: "sell", title: "Sell", tiles: getSellHubTiles(profile) }];
}

export function getBusinessHubSections(profile: UserProfile, context?: MobileHubContext): MobileHubSection[] {
  return [{ id: "business", title: "Business", tiles: getBusinessHubTiles(profile, context) }];
}

export function getTrustHubSections(): MobileHubSection[] {
  return [
    {
      id: "trust",
      title: "Trust Centre",
      tiles: [
        tile("/trust", "Trust Centre", "Score & safety"),
        tile("/trust/verification", "Verification", "Identity & seller checks"),
      ],
    },
  ];
}

export function getSuperAdminHubSections(): MobileHubSection[] {
  return superAdminHub();
}

export function getHelpHubQuickTiles(): MobileTile[] {
  return getSupportHubTiles().filter((entry) =>
    ["/help", "/help/faq", "/help/policies", "/assistant", "/resolution", "/trust", "/support"].includes(
      entry.href,
    ),
  );
}

export function getAdminHubSections(): MobileHubSection[] {
  return [{ id: "admin", title: "Administration", tiles: fromNav(ADMIN_NAV) }];
}

export function getPlansHubSections(profile: UserProfile): MobileHubSection[] {
  const business = getBusinessHubTiles(profile).filter((entry) =>
    ["/plans", "/wholesale", "/business/dashboard"].includes(entry.href),
  );
  const sell = getSellHubTiles(profile).filter((entry) => entry.href === "/plans");
  return [
    {
      id: "plans-nav",
      title: "Premium",
      tiles: dedupeTiles([...sell, ...business, tile("/account", "Account", "Manage subscription")]),
    },
  ];
}

export function getWholesaleHubSections(profile: UserProfile): MobileHubSection[] {
  return [
    {
      id: "wholesale",
      title: "Wholesale",
      tiles: getBusinessHubTiles(profile).filter((entry) =>
        ["/wholesale", "/business/inventory", "/business/directory", "/plans", "/business/center", "/trust"].some(
          (href) => entry.href.startsWith(href),
        ),
      ),
    },
  ];
}

export function getCategoriesNavSections(): MobileHubSection[] {
  return [
    {
      id: "browse",
      title: "Browse",
      tiles: getBuyHubTiles().filter((entry) =>
        ["/search", "/saved", "/cart", "/orders", "/categories", "/auctions"].includes(entry.href),
      ),
    },
  ];
}
