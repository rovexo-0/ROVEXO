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
  "/account/bring-your-item": { parentHref: "/seller", label: "Selling" },
  "/import": { parentHref: "/account/bring-your-item", label: "Bring Your Item" },
  "/seller/migration": { parentHref: "/account/bring-your-item", label: "Bring Your Item" },
  "/seller/connectors": { parentHref: "/seller", label: "Selling" },
  "/seller/compliance": { parentHref: "/seller", label: "Selling" },
  "/seller/listings": { parentHref: "/seller", label: "Selling" },
  "/seller/orders": { parentHref: "/seller", label: "Selling" },
  "/seller/wallet": { parentHref: "/wallet", label: "Wallet" },
  "/seller/analytics": { parentHref: "/seller", label: "Selling" },
  "/seller/tax": { parentHref: "/seller", label: "Selling" },
  "/seller/performance": { parentHref: "/seller", label: "Selling" },
  "/seller/trust": { parentHref: "/seller", label: "Selling" },
  "/seller/review-center": { parentHref: "/seller", label: "Selling" },
  "/sell": { parentHref: "/seller", label: "Selling" },
  "/orders": { parentHref: "/account", label: "My Account" },
  "/wallet": { parentHref: "/account", label: "My Account" },
  "/messages": { parentHref: "/inbox", label: "Inbox" },
  "/inbox": { parentHref: "/account", label: "Account" },
  "/notifications": { parentHref: "/inbox", label: "Inbox" },
  "/trust": { parentHref: "/account", label: "Account" },
  "/resolution": { parentHref: "/account", label: "Account" },
  "/assistant": { parentHref: "/help", label: "Help" },
  "/plans": { parentHref: "/account", label: "Account" },
  "/wholesale": { parentHref: "/business/dashboard", label: "Business tools" },
  "/support": { parentHref: "/help", label: "Help" },
  "/legal": { parentHref: "/", label: "Home" },
  "/help/buying-buyer-protection": { parentHref: "/buyer", label: "Buyer" },
  "/help": { parentHref: "/account", label: "Account" },
  "/help/faq": { parentHref: "/help", label: "Help" },
  "/help/policies": { parentHref: "/help", label: "Help" },
  "/account/settings": { parentHref: "/account", label: "Account" },
  "/account/profile": { parentHref: "/account", label: "Account" },
  "/account/addresses": { parentHref: "/account/settings", label: "Settings" },
  "/wallet/payment-methods": { parentHref: "/wallet", label: "Wallet" },
  "/wallet/bank-account": { parentHref: "/wallet/payment-methods", label: "Payment Methods" },
  "/wallet/payouts": { parentHref: "/wallet", label: "Wallet" },
  "/account/payment-methods": { parentHref: "/wallet", label: "Wallet" },
  "/account/security": { parentHref: "/account/settings", label: "Settings" },
  "/account/privacy": { parentHref: "/account/settings", label: "Settings" },
  "/account/seller/shipping": { parentHref: "/account/settings", label: "Settings" },
  "/account/blocked-users": { parentHref: "/account/settings", label: "Settings" },
  "/business/inventory": { parentHref: "/business/dashboard", label: "Business tools" },
  "/business/analytics": { parentHref: "/business/dashboard", label: "Business tools" },
  "/business/directory": { parentHref: "/business/dashboard", label: "Business tools" },
  "/account/verification": { parentHref: "/account/settings", label: "Settings" },
  "/account/ideas": { parentHref: "/account", label: "My Account" },
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
    return { parentHref: "/account/bring-your-item", label: "Bring Your Item" };
  }
  if (normalized.startsWith("/seller/migration/")) {
    return { parentHref: "/account/bring-your-item", label: "Bring Your Item" };
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
  if (normalized.startsWith("/inbox/conversation/")) {
    return { parentHref: "/inbox", label: "Inbox" };
  }
  if (normalized.startsWith("/messages/")) {
    return { parentHref: "/inbox", label: "Inbox" };
  }
  if (normalized.startsWith("/notifications/")) {
    return { parentHref: "/inbox?tab=notifications", label: "Inbox" };
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
