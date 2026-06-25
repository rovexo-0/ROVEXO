import {
  ADMIN_NAV,
  BUYER_NAV,
  BUSINESS_NAV,
  HELP_NAV,
  SELLER_NAV,
  SUPER_ADMIN_NAV_LINK,
  type NavLink,
} from "@/lib/navigation/map";
import { SUPER_ADMIN_NAV } from "@/lib/super-admin/nav";
import { TRUST_CENTER_SECTIONS } from "@/lib/trust/types";
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

export function getBuyHubTiles(): MobileTile[] {
  return dedupeTiles([
    ...fromNav(BUYER_NAV, {
      "/orders": "orders",
      "/cart": "cart",
      "/saved": "saved",
    }),
    tile("/search", "Search", "Find anything"),
    tile("/auctions", "Auctions", "Live bidding"),
    tile("/messages", "Messages", "Buyer & seller chats", "messages"),
    tile("/notifications", "Notifications", "Alerts & activity", "notifications"),
    tile("/settings", "Settings", "Account & privacy"),
    tile("/account", "Account", "Profile dashboard"),
  ]);
}

export function getSellHubTiles(profile: UserProfile): MobileTile[] {
  if (profile.isSeller) {
    return dedupeTiles(
      fromNav(SELLER_NAV, {
        "/seller/orders": "orders",
        "/seller/wallet": "wallet-payout",
      }),
    );
  }

  return [
    tile("/sell", "Sell an item", "Create a listing"),
    tile("/help/selling-get-started", "How to sell", "Getting started guide"),
    tile("/help/buying-buyer-protection", "Seller protection", "Safety & coverage"),
    tile("/help/delivery-shipping", "Shipping guide", "Delivery best practices"),
    tile("/plans", "Plans & Premium", "Promotions & tools"),
    tile("/seller/dashboard", "Seller dashboard", "Preview seller tools"),
  ];
}

export function getBusinessHubTiles(profile: UserProfile, context?: MobileHubContext): MobileTile[] {
  const tiles = dedupeTiles([
    ...(context?.storeSlug
      ? [tile(`/store/${context.storeSlug}`, "Company profile", "Public store page")]
      : []),
    ...fromNav(BUSINESS_NAV),
    tile("/plans", "Plans & Premium", "Business subscriptions"),
    tile("/messages", "Messages", "Leads & conversations", "messages"),
  ]);

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

export function getSupportHubTiles(): MobileTile[] {
  return dedupeTiles([
    ...fromNav(HELP_NAV),
    tile("/help/terms-of-service", "Terms of service", "Platform terms"),
    tile("/help/privacy-policy", "Privacy policy", "Data & privacy"),
    tile("/legal", "Legal", "Platform information"),
    ...TRUST_CENTER_SECTIONS.map((section) =>
      tile(section.href, section.title, section.description),
    ),
  ]);
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
      tiles: TRUST_CENTER_SECTIONS.map((section) =>
        tile(section.href, section.title, section.description),
      ),
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
