import { resolveDashboardIconType } from "@/lib/icons/resolve-dashboard-icon-type";
import { RovexoIcons } from "@/lib/icons/icons";
import { resolveDashboardGlassIcon } from "@/lib/icons/resolve";
import type { RovexoIconRef } from "@/lib/icons/types";

const MODULE_ID_ICONS: Record<string, RovexoIconRef> = {
  "buyer-wallet": RovexoIcons.orders.cart,
  "seller-wallet": RovexoIcons.dashboard.wallet,
  "business-wallet": RovexoIcons.business.business,
  transactions: RovexoIcons.dashboard.wallet,
  withdrawals: RovexoIcons.payments.payment,
  protection: RovexoIcons.security.shield,
  "control-center": RovexoIcons.dashboard.admin,
  "marketplace-assistant": RovexoIcons.dashboard.help,
  "buyer-assistant": RovexoIcons.orders.cart,
  "seller-assistant": RovexoIcons.seller.listings,
  "business-assistant": RovexoIcons.business.business,
  "super-admin-assistant": RovexoIcons.dashboard.admin,
  "developer-assistant": RovexoIcons.dashboard.admin,
  "customer-support": RovexoIcons.support.support,
  "automation-center": RovexoIcons.dashboard.settings,
  "prompt-library": RovexoIcons.dashboard.help,
  "provider-manager": RovexoIcons.dashboard.admin,
  "monitoring-center": RovexoIcons.analytics.analytics,
};

function normalizeHref(href: string): string {
  const [path] = href.split("?");
  return path || href;
}

/** Resolve a hub/engine module icon from href or module id. */
export function resolveModuleIcon(options: { href?: string; id?: string }): RovexoIconRef {
  if (options.href) {
    return resolveDashboardGlassIcon(resolveDashboardIconType(normalizeHref(options.href)));
  }
  if (options.id && MODULE_ID_ICONS[options.id]) {
    return MODULE_ID_ICONS[options.id]!;
  }
  return RovexoIcons.misc.help;
}
