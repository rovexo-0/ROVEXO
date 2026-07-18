import type { MobileBadgeKey, MobileTile } from "@/lib/mobile-ui/types";
function tile(
  href: string,
  label: string,
  subtitle: string,
  badge?: MobileBadgeKey,
): MobileTile {
  return { href, label, subtitle, badge };
}

export const QUICK_ACCESS_TILES: MobileTile[] = [
  tile("/orders", "Orders", "Track purchases", "orders"),
  tile("/inbox", "Inbox", "Messages & notifications", "messages"),
  tile("/inbox?tab=notifications", "Notifications", "Alerts & activity", "notifications"),
  tile("/saved", "Saved", "Wishlist items", "saved"),
  tile("/trust", "Trust Centre", "Score & safety"),
  tile("/resolution", "Resolution Centre", "Disputes & cases"),
  tile("/help", "Help Centre", "Guides & support"),
  tile("/support", "Support", "Contact us"),
  tile("/plans", "Premium Plans", "Subscriptions"),
  tile("/categories", "Browse Categories", "Explore marketplace"),
];

export const BUYER_TOOLS_TILES: MobileTile[] = [
  tile("/cart", "Cart", "Items ready to checkout", "cart"),
  tile("/saved?sort=recently-viewed", "Recently Viewed", "Items you browsed"),
  tile("/search", "Saved Searches", "Your saved queries"),
  tile("/search?q=&deals=1", "Deals & Discounts", "Best offers"),
];

export function getSellerDashboardTiles(): MobileTile[] {
  return [
    tile("/seller", "Selling", "Performance & overview"),
    tile("/seller/listings", "My Listings", "Manage inventory"),
    tile("/seller/orders", "Seller Orders", "Fulfillment & shipping", "orders"),
    tile("/wallet", "Wallet", "Balance & withdrawals", "wallet-payout"),
    tile("/seller/analytics", "Seller Analytics", "Views, sales & trends"),
    tile("/seller/performance", "Seller Performance", "Reputation Engine & level"),
    tile("/seller/trust", "Trust Score", "Reputation & improvements"),
    tile("/seller/tax", "Tax Registration", "VAT & tax settings"),
    tile("/sell", "Sell Item", "Create a new listing"),
    tile("/sell/new", "Publish Listing", "Listing creation wizard"),
  ];
}

export const ACCOUNT_DASHBOARD_TILES: MobileTile[] = [
  tile("/account/profile", "Profile", "Name, avatar & email"),
  tile("/account/addresses", "Addresses", "Shipping & billing"),
  tile("/wallet/payment-methods", "Payment Methods", "Cards & checkout"),
  tile("/account/preferences/language", "Language", "Locale & region"),
  tile("/account/security", "Security", "Password & 2FA"),
  tile("/account/privacy", "Privacy", "Visibility & marketing"),
  tile("/notifications/settings", "Notification Settings", "Push & email", "notifications"),
  tile("/help", "Help Centre", "Guides & troubleshooting"),
  tile("/help/faq", "FAQ", "Common questions"),
  tile("/help/policies", "Policies", "Terms & platform rules"),
  tile("/account/settings", "Settings", "Account & privacy"),
  tile("/legal", "About ROVEXO", "Legal & policies"),
];

/** @deprecated Use QUICK_ACCESS_TILES — hub navigation removed from account dashboard. */
export const QUICK_ACCESS_HUBS = [] as const;

/** @deprecated Use BUYER_TOOLS_TILES for the account dashboard buyer section. */
export function getBuyerDashboardTiles(): MobileTile[] {
  return BUYER_TOOLS_TILES;
}
