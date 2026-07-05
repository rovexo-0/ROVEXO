/** Hub routes — no back button rendered. */
export const NAVIGATION_HUB_PREFIXES = [
  "/",
  "/buyer",
  "/seller",
  "/account",
  "/business",
  "/business/center",
  "/business/dashboard",
  "/search",
  "/saved",
  "/categories",
  "/super-admin",
] as const;

export type BackRouteConfig = {
  parentHref: string;
  label: string;
};

const EXACT_BACK_ROUTES: Record<string, BackRouteConfig> = {
  "/import": { parentHref: "/account", label: "My Account" },
  "/seller/migration": { parentHref: "/import", label: "Import" },
  "/seller/connectors": { parentHref: "/import", label: "Import" },
  "/seller/listings": { parentHref: "/seller", label: "Seller Dashboard" },
  "/seller/orders": { parentHref: "/seller", label: "Seller Dashboard" },
  "/seller/wallet": { parentHref: "/seller", label: "Seller Dashboard" },
  "/seller/analytics": { parentHref: "/seller", label: "Seller Dashboard" },
  "/seller/tax": { parentHref: "/seller", label: "Seller Dashboard" },
  "/seller/trust": { parentHref: "/seller", label: "Seller Dashboard" },
  "/seller/review-center": { parentHref: "/seller", label: "Seller Dashboard" },
  "/sell": { parentHref: "/seller", label: "Seller Dashboard" },
  "/orders": { parentHref: "/buyer", label: "Buyer Dashboard" },
  "/cart": { parentHref: "/buyer", label: "Buyer Dashboard" },
  "/messages": { parentHref: "/account", label: "Account" },
  "/notifications": { parentHref: "/account", label: "Account" },
  "/trust": { parentHref: "/account", label: "Account" },
  "/resolution": { parentHref: "/account", label: "Account" },
  "/assistant": { parentHref: "/help", label: "Help" },
  "/plans": { parentHref: "/account", label: "Account" },
  "/wholesale": { parentHref: "/business/dashboard", label: "Business Dashboard" },
  "/support": { parentHref: "/help", label: "Help" },
  "/legal": { parentHref: "/", label: "Home" },
  "/help/buying-buyer-protection": { parentHref: "/buyer", label: "Buyer" },
  "/help": { parentHref: "/account", label: "Account" },
  "/help/faq": { parentHref: "/help", label: "Help" },
  "/help/policies": { parentHref: "/help", label: "Help" },
  "/account/settings": { parentHref: "/account", label: "Account" },
  "/account/profile": { parentHref: "/account", label: "Account" },
  "/account/addresses": { parentHref: "/account/settings", label: "Settings" },
  "/account/payment-methods": { parentHref: "/account/settings", label: "Settings" },
  "/account/security": { parentHref: "/account/settings", label: "Settings" },
  "/account/privacy": { parentHref: "/account/settings", label: "Settings" },
  "/account/seller/shipping": { parentHref: "/account/settings", label: "Settings" },
  "/account/blocked-users": { parentHref: "/account/settings", label: "Settings" },
  "/business/inventory": { parentHref: "/business/dashboard", label: "Business Dashboard" },
  "/business/analytics": { parentHref: "/business/dashboard", label: "Business Dashboard" },
  "/business/directory": { parentHref: "/business/dashboard", label: "Business Dashboard" },
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function isNavigationHub(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return NAVIGATION_HUB_PREFIXES.some((hub) => normalized === hub);
}

export function resolveBackRoute(pathname: string): BackRouteConfig | null {
  const normalized = normalizePathname(pathname);

  if (isNavigationHub(normalized)) {
    return null;
  }

  if (EXACT_BACK_ROUTES[normalized]) {
    return EXACT_BACK_ROUTES[normalized];
  }

  if (normalized.startsWith("/import/")) {
    return { parentHref: "/import", label: "Import" };
  }
  if (normalized.startsWith("/seller/migration/")) {
    return { parentHref: "/import", label: "Import" };
  }
  if (normalized.startsWith("/seller/listings/") && normalized.endsWith("/edit")) {
    return { parentHref: "/seller/listings", label: "My Listings" };
  }
  if (normalized.startsWith("/seller/orders/")) {
    return { parentHref: "/seller/orders", label: "Seller Orders" };
  }
  if (normalized.startsWith("/orders/")) {
    return { parentHref: "/orders", label: "Orders" };
  }
  if (normalized.startsWith("/messages/")) {
    return { parentHref: "/messages", label: "Messages" };
  }
  if (normalized.startsWith("/notifications/")) {
    return { parentHref: "/notifications", label: "Notifications" };
  }
  if (normalized.startsWith("/help/")) {
    return { parentHref: "/help", label: "Help" };
  }
  if (normalized.startsWith("/account/preferences/")) {
    return { parentHref: "/account/settings", label: "Settings" };
  }
  if (normalized.startsWith("/checkout/")) {
    return { parentHref: "/cart", label: "Cart" };
  }
  if (normalized.startsWith("/listing/")) {
    return { parentHref: "/", label: "Home" };
  }

  return { parentHref: "/", label: "Home" };
}
