import type { DashboardIconType } from "@/components/icons/DashboardIcon3D";
import type { BottomNavIconType } from "@/components/icons/BottomNavIcon3D";
import { RovexoIcons } from "@/lib/icons/icons";
import type { RovexoIconRef } from "@/lib/icons/types";

export type { RovexoIconRef };

const DASHBOARD_ICON_MAP: Record<DashboardIconType, RovexoIconRef> = {
  home: RovexoIcons.navigation.home,
  search: RovexoIcons.navigation.search,
  sell: RovexoIcons.navigation.sell,
  saved: RovexoIcons.navigation.saved,
  account: RovexoIcons.navigation.account,
  orders: RovexoIcons.orders.orders,
  cart: RovexoIcons.orders.cart,
  messages: RovexoIcons.chat.messages,
  notifications: RovexoIcons.notifications.bell,
  settings: RovexoIcons.settings.settings,
  listings: RovexoIcons.dashboard.listings,
  wallet: RovexoIcons.dashboard.wallet,
  analytics: RovexoIcons.dashboard.analytics,
  trust: RovexoIcons.dashboard.trust,
  help: RovexoIcons.dashboard.help,
  support: RovexoIcons.dashboard.support,
  business: RovexoIcons.business.business,
  inventory: RovexoIcons.dashboard.inventory,
  wholesale: RovexoIcons.dashboard.wholesale,
  plans: RovexoIcons.dashboard.plans,
  security: RovexoIcons.security.shield,
  addresses: RovexoIcons.dashboard.addresses,
  payment: RovexoIcons.payments.payment,
  shipping: RovexoIcons.shipping.shipping,
  auctions: RovexoIcons.dashboard.auctions,
  resolution: RovexoIcons.dashboard.resolution,
  categories: RovexoIcons.dashboard.categories,
  tax: RovexoIcons.dashboard.tax,
  admin: RovexoIcons.dashboard.admin,
  "buy-hub": RovexoIcons.dashboard["buy-hub"],
  "sell-hub": RovexoIcons.dashboard["sell-hub"],
  "business-hub": RovexoIcons.dashboard["business-hub"],
  "support-hub": RovexoIcons.dashboard["support-hub"],
};

const BOTTOM_NAV_ICON_MAP: Record<BottomNavIconType, RovexoIconRef> = {
  home: RovexoIcons.navigation.home,
  search: RovexoIcons.navigation.search,
  sell: RovexoIcons.navigation.sell,
  saved: RovexoIcons.navigation.saved,
  account: RovexoIcons.navigation.account,
};

export function resolveDashboardGlassIcon(type: DashboardIconType): RovexoIconRef {
  return DASHBOARD_ICON_MAP[type];
}

export function resolveBottomNavGlassIcon(type: BottomNavIconType): RovexoIconRef {
  return BOTTOM_NAV_ICON_MAP[type];
}

export { getRovexoIconPath } from "@/lib/icons/icons";
