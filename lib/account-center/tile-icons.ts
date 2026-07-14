import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { MARKETPLACE_CONNECTORS_PATH } from "@/lib/seller/marketplace/config";
import type { AccountCenterModuleId } from "@/lib/account-center/modules";

export type TileIconStyle = {
  emoji: string;
  background: string;
};

const QUICK_ACCESS_ICONS: Record<AccountCenterModuleId, TileIconStyle> = {
  buying: { emoji: "🛍️", background: "rgb(147 51 234 / 0.08)" },
  selling: { emoji: "🏪", background: "#f0fdf4" },
  account: { emoji: "👤", background: "#fff7ed" },
};

const HREF_ICONS: Record<string, TileIconStyle> = {
  "/seller/listings": { emoji: "📦", background: "rgb(147 51 234 / 0.08)" },
  "/seller/orders": { emoji: "📋", background: "#f0fdf4" },
  "/seller/wallet": { emoji: "💳", background: "#faf5ff" },
  "/seller/analytics": { emoji: "📈", background: "#fff7ed" },
  "/sell": { emoji: "➕", background: "rgb(147 51 234 / 0.08)" },
  [MARKETPLACE_CONNECTORS_PATH]: { emoji: "🌍", background: "#f0fdf4" },
  [MIGRATION_CENTER_PATH]: { emoji: "🚚", background: "#fef3c7" },
  "/seller/tax": { emoji: "🧾", background: "#f8fafc" },
  "/plans": { emoji: "📢", background: "#fce7f3" },
  "/support": { emoji: "🎧", background: "#ecfeff" },
  "/orders": { emoji: "📋", background: "rgb(147 51 234 / 0.08)" },
  "/inbox": { emoji: "💬", background: "#f0fdf4" },
  "/messages": { emoji: "💬", background: "#f0fdf4" },
  "/saved": { emoji: "❤️", background: "#fce7f3" },
  "/notifications": { emoji: "🔔", background: "#fff7ed" },
  "/trust": { emoji: "🛡️", background: "rgb(147 51 234 / 0.08)" },
  "/resolution": { emoji: "⚖️", background: "#f8fafc" },
  "/help/buying-buyer-protection": { emoji: "🛡️", background: "rgb(147 51 234 / 0.08)" },
  "/cart": { emoji: "🛒", background: "#f0fdf4" },
  "/search": { emoji: "🔍", background: "#faf5ff" },
  "/categories": { emoji: "📂", background: "#fff7ed" },
  "/auctions": { emoji: "🔨", background: "#fef3c7" },
  "/account/profile": { emoji: "👤", background: "rgb(147 51 234 / 0.08)" },
  "/account/addresses": { emoji: "📍", background: "#f0fdf4" },
  "/wallet/payment-methods": { emoji: "💳", background: "#faf5ff" },
  "/account/seller/shipping": { emoji: "📦", background: "#ecfeff" },
  "/account/preferences/language": { emoji: "🌐", background: "#ecfeff" },
  "/account/security": { emoji: "🔒", background: "#fef2f2" },
  "/account/privacy": { emoji: "🛡️", background: "rgb(147 51 234 / 0.08)" },
  "/notifications/settings": { emoji: "🔔", background: "#fff7ed" },
  "/account/settings": { emoji: "👥", background: "#f3f4f6" },
  "/business/dashboard": { emoji: "📊", background: "rgb(147 51 234 / 0.08)" },
  "/business/analytics": { emoji: "📈", background: "#f0fdf4" },
  "/business/directory": { emoji: "🏢", background: "#faf5ff" },
  "/wholesale": { emoji: "📦", background: "#fff7ed" },
  "/business/inventory": { emoji: "📋", background: "#ecfeff" },
  "/business/center": { emoji: "💼", background: "rgb(147 51 234 / 0.08)" },
};

const DEFAULT_ICON: TileIconStyle = { emoji: "📌", background: "#f3f4f6" };

/** Dedicated sell-flow icons (AI Category, Free Delivery share /sell). */
const SELL_FLOW_ICONS: Record<string, TileIconStyle> = {
  "AI Category": { emoji: "✨", background: "#faf5ff" },
  "Free Delivery": { emoji: "🚚", background: "#f0fdf4" },
  Password: { emoji: "🔑", background: "#fef2f2" },
};

export function getQuickAccessIcon(moduleId: AccountCenterModuleId): TileIconStyle {
  return QUICK_ACCESS_ICONS[moduleId];
}

export function getTileIcon(href: string, label?: string): TileIconStyle {
  if (label && SELL_FLOW_ICONS[label]) return SELL_FLOW_ICONS[label]!;

  if (HREF_ICONS[href]) return HREF_ICONS[href]!;

  const prefixMatch = Object.keys(HREF_ICONS).find(
    (key) => key !== "/" && (href === key || href.startsWith(`${key}/`)),
  );
  if (prefixMatch) return HREF_ICONS[prefixMatch]!;

  if (href.startsWith("/store/")) return { emoji: "🏪", background: "rgb(147 51 234 / 0.08)" };
  if (href.startsWith("/help/")) return { emoji: "📖", background: "#f8fafc" };
  if (href.startsWith("/seller/migration") || href.startsWith("/import") || href.startsWith("/account/bring-your-item")) {
    return HREF_ICONS[MIGRATION_CENTER_PATH]!;
  }

  return DEFAULT_ICON;
}
