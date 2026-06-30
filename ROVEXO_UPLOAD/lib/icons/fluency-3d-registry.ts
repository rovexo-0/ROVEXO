export const FLUENCY_3D_ICON_SIZES = [64, 128, 256, 512] as const;
export const FLUENCY_3D_BASE = "/icons/premium-studio";

export type Fluency3DFormat = "avif" | "webp" | "png";

export type Fluency3DIconKey =
  | "home"
  | "search"
  | "sell"
  | "saved"
  | "account"
  | "orders"
  | "cart"
  | "messages"
  | "notifications"
  | "settings"
  | "listings"
  | "wallet"
  | "analytics"
  | "trust"
  | "help"
  | "support"
  | "business"
  | "inventory"
  | "wholesale"
  | "plans"
  | "security"
  | "addresses"
  | "payment"
  | "shipping"
  | "auctions"
  | "resolution"
  | "categories"
  | "tax"
  | "admin"
  | "buy-hub"
  | "sell-hub"
  | "business-hub"
  | "support-hub"
  | "feature-account"
  | "feature-payment"
  | "feature-language"
  | "feature-currency"
  | "feature-appearance"
  | "feature-lock"
  | "feature-two-factor"
  | "feature-blocked"
  | "feature-stripe"
  | "feature-shipping"
  | "feature-terms"
  | "feature-privacy"
  | "feature-settings"
  | "feature-listings"
  | "feature-sales"
  | "feature-followers"
  | "feature-sign-out"
  | "feature-orders-menu"
  | "feature-messages-menu"
  | "feature-notifications-menu"
  | "feature-wallet-menu"
  | "feature-help-menu"
  | "feature-about-menu"
  | "feature-message-sent"
  | "feature-message-delivered"
  | "feature-message-read"
  | "feature-message-search"
  | "feature-message-more"
  | "feature-message-empty"
  | "feature-message-plus"
  | "feature-message-camera"
  | "feature-back"
  | "feature-heart"
  | "feature-heart-filled"
  | "feature-share"
  | "feature-shield"
  | "feature-chevron-right"
  | "feature-verified"
  | "feature-bell"
  | "feature-notif-order"
  | "feature-notif-message"
  | "feature-notif-offer"
  | "feature-notif-system"
  | "feature-notif-trash"
  | "feature-notif-check"
  | "feature-menu"
  | "feature-user"
  | "feature-chevron-right-sm"
  | "feature-close"
  | "hub-buy"
  | "hub-sell"
  | "hub-business"
  | "hub-support"
  | "sa-mission-control"
  | "sa-users"
  | "sa-listings"
  | "sa-categories"
  | "sa-orders"
  | "sa-payments"
  | "sa-wallet"
  | "sa-reports"
  | "sa-analytics"
  | "sa-seo"
  | "sa-platform"
  | "sa-notifications"
  | "sa-trust"
  | "sa-moderation"
  | "sa-reviews"
  | "sa-coupons"
  | "sa-promotions"
  | "sa-email"
  | "sa-support"
  | "sa-monitoring"
  | "sa-production-assets"
  | "sa-premium-design"
  | "sa-operations"
  | "sa-operations-ai"
  | "sa-audit"
  | "sa-certification"
  | "sa-mobile"
  | "sa-omega"
  | "sa-executive-command"
  | "sa-module-registry"
  | "sa-workflows"
  | "sa-recovery"
  | "sa-mission-control-engine"
  | "sa-shipping-engine"
  | "sa-orders-engine"
  | "sa-wallet-engine"
  | "sa-payments-engine"
  | "sa-protection-engine"
  | "sa-messages-engine"
  | "sa-notifications-engine"
  | "sa-analytics-engine"
  | "sa-security-engine"
  | "sa-search-engine"
  | "sa-ai-engine"
  | "sa-integrations-engine"
  | "sa-enterprise-core"
  | "sa-app-studio"
  | "sa-platform-studio"
  | "sa-visual-cms"
  | "sa-theme-manager"
  | "sa-assets"
  | "sa-theme-studio"
  | "sa-menu-builder"
  | "sa-homepage-builder"
  | "sa-banners"
  | "sa-features"
  | "sa-ai-manager"
  | "sa-developer"
  | "sa-quick-listing"
  | "sa-command"
  | "sa-global-search"
  | "sa-activity"
  | "sa-businesses"
  | "sa-verification"
  | "sa-fraud"
  | "sa-featured"
  | "sa-bumps"
  | "sa-auctions"
  | "sa-revenue"
  | "sa-subscriptions"
  | "sa-grants"
  | "sa-visitors"
  | "sa-incidents"
  | "sa-incident-timeline"
  | "sa-compliance"
  | "sa-devices"
  | "sa-security"
  | "sa-audit-logs"
  | "sa-development";

function suffixForSize(size: number): string {
  return size === 512 ? "" : `-${size}`;
}

export function getFluency3DAssetPath(
  key: Fluency3DIconKey | string,
  format: Fluency3DFormat,
  size = 512,
): string {
  return `${FLUENCY_3D_BASE}/${key}${suffixForSize(size)}.${format}`;
}

export function getFluency3DSrcSet(key: Fluency3DIconKey | string, format: Fluency3DFormat): string {
  return FLUENCY_3D_ICON_SIZES.map((s) => `${getFluency3DAssetPath(key, format, s)} ${s}w`).join(", ");
}

export const SUPER_ADMIN_HREF_ICON_KEYS: Record<string, Fluency3DIconKey> = {
  "/super-admin": "sa-mission-control",
  "/super-admin/users": "sa-users",
  "/super-admin/listings": "sa-listings",
  "/super-admin/category-management": "sa-categories",
  "/super-admin/orders": "sa-orders",
  "/super-admin/payments": "sa-payments",
  "/super-admin/wallet": "sa-wallet",
  "/super-admin/reports": "sa-reports",
  "/super-admin/analytics": "sa-analytics",
  "/super-admin/seo": "sa-seo",
  "/super-admin/platform": "sa-platform",
  "/super-admin/notifications": "sa-notifications",
  "/super-admin/trust": "sa-trust",
  "/super-admin/moderation": "sa-moderation",
  "/super-admin/reviews": "sa-reviews",
  "/super-admin/coupons": "sa-coupons",
  "/super-admin/promotions": "sa-promotions",
  "/super-admin/email": "sa-email",
  "/super-admin/support": "sa-support",
  "/super-admin/monitoring": "sa-monitoring",
  "/super-admin/production-assets": "sa-production-assets",
  "/super-admin/premium-design": "sa-premium-design",
  "/super-admin/operations": "sa-operations",
  "/super-admin/operations/ai": "sa-operations-ai",
  "/super-admin/audit": "sa-audit",
  "/super-admin/certification": "sa-certification",
  "/super-admin/mobile-distribution": "sa-mobile",
  "/super-admin/mobile/omega": "sa-omega",
  "/super-admin/mobile/omega/executive-command": "sa-executive-command",
  "/super-admin/module-registry": "sa-module-registry",
  "/super-admin/workflows": "sa-workflows",
  "/super-admin/recovery": "sa-recovery",
  "/super-admin/mission-control-engine": "sa-mission-control-engine",
  "/super-admin/shipping-engine": "sa-shipping-engine",
  "/super-admin/orders-engine": "sa-orders-engine",
  "/super-admin/wallet-engine": "sa-wallet-engine",
  "/super-admin/payments-engine": "sa-payments-engine",
  "/super-admin/protection-engine": "sa-protection-engine",
  "/super-admin/messages-engine": "sa-messages-engine",
  "/super-admin/notifications-engine": "sa-notifications-engine",
  "/super-admin/analytics-engine": "sa-analytics-engine",
  "/super-admin/security-engine": "sa-security-engine",
  "/super-admin/search-engine": "sa-search-engine",
  "/super-admin/ai-engine": "sa-ai-engine",
  "/super-admin/integrations-engine": "sa-integrations-engine",
  "/super-admin/enterprise-core": "sa-enterprise-core",
  "/super-admin/app-studio": "sa-app-studio",
  "/super-admin/platform-studio": "sa-platform-studio",
  "/super-admin/visual-cms": "sa-visual-cms",
  "/super-admin/theme-manager": "sa-theme-manager",
  "/super-admin/assets": "sa-assets",
  "/super-admin/theme-studio": "sa-theme-studio",
  "/super-admin/menu-builder": "sa-menu-builder",
  "/super-admin/homepage-builder": "sa-homepage-builder",
  "/super-admin/banners": "sa-banners",
  "/super-admin/features": "sa-features",
  "/super-admin/ai-manager": "sa-ai-manager",
  "/super-admin/developer": "sa-developer",
  "/super-admin/quick-listing": "sa-quick-listing",
  "/super-admin/command": "sa-command",
  "/super-admin/search": "sa-global-search",
  "/super-admin/activity": "sa-activity",
  "/super-admin/businesses": "sa-businesses",
  "/super-admin/verification": "sa-verification",
  "/super-admin/fraud": "sa-fraud",
  "/super-admin/featured": "sa-featured",
  "/super-admin/bumps": "sa-bumps",
  "/super-admin/auctions": "sa-auctions",
  "/super-admin/revenue": "sa-revenue",
  "/super-admin/subscriptions": "sa-subscriptions",
  "/super-admin/grants": "sa-grants",
  "/super-admin/visitors": "sa-visitors",
  "/super-admin/mobile/incidents": "sa-incidents",
  "/super-admin/incidents/timeline": "sa-incident-timeline",
  "/super-admin/compliance": "sa-compliance",
  "/super-admin/mobile-distribution/devices": "sa-devices",
  "/super-admin/security": "sa-security",
  "/super-admin/audit/logs": "sa-audit-logs",
};

export function resolveSuperAdminIconKey(href: string): Fluency3DIconKey {
  if (SUPER_ADMIN_HREF_ICON_KEYS[href]) {
    return SUPER_ADMIN_HREF_ICON_KEYS[href];
  }

  const match = Object.entries(SUPER_ADMIN_HREF_ICON_KEYS)
    .filter(([path]) => href.startsWith(`${path}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];

  return match?.[1] ?? "sa-mission-control";
}

const HUB_ICON_KEYS: Record<string, Fluency3DIconKey> = {
  buy: "hub-buy",
  sell: "hub-sell",
  business: "hub-business",
  support: "hub-support",
};

export function resolveHubIconKey(hub: string): Fluency3DIconKey {
  return HUB_ICON_KEYS[hub] ?? "hub-support";
}
