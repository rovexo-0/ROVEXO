import { RovexoIcons } from "@/lib/icons/icons";
import type { HelpTopicSlug } from "@/lib/help/types";
import type { RovexoIconRef } from "@/lib/icons/types";

const HELP_TOPIC_ICONS: Record<HelpTopicSlug, RovexoIconRef> = {
  account: RovexoIcons.account.user,
  authentication: RovexoIcons.security.shield,
  buyer: RovexoIcons.orders.cart,
  seller: RovexoIcons.seller.listings,
  "business-accounts": RovexoIcons.business.business,
  wholesale: RovexoIcons.dashboard.wholesale,
  manufacturers: RovexoIcons.business.business,
  suppliers: RovexoIcons.dashboard.inventory,
  orders: RovexoIcons.orders.orders,
  payments: RovexoIcons.payments.payment,
  withdraw: RovexoIcons.dashboard.wallet,
  stripe: RovexoIcons.payments.payment,
  wallet: RovexoIcons.dashboard.wallet,
  "chat-messages": RovexoIcons.chat.messages,
  "trust-score": RovexoIcons.dashboard.trust,
  verification: RovexoIcons.badges.verified,
  reports: RovexoIcons.dashboard.resolution,
  shipping: RovexoIcons.shipping.shipping,
  returns: RovexoIcons.dashboard.resolution,
  refunds: RovexoIcons.payments.payment,
  subscriptions: RovexoIcons.dashboard.plans,
  "promoted-listings": RovexoIcons.dashboard.plans,
  "featured-listings": RovexoIcons.actions.star,
  "bump-listings": RovexoIcons.actions["arrow-right"],
  auto: RovexoIcons.categories.vehicles,
  "license-plate-search": RovexoIcons.categories.autoparts,
  "vin-search": RovexoIcons.categories.autoparts,
  property: RovexoIcons.categories.property,
  jobs: RovexoIcons.categories.services,
  services: RovexoIcons.categories.services,
  "business-directory": RovexoIcons.dashboard.business,
  "company-profiles": RovexoIcons.business.business,
  "request-quote": RovexoIcons.dashboard.plans,
  "request-part": RovexoIcons.categories.autoparts,
  "request-services": RovexoIcons.categories.services,
  safety: RovexoIcons.security.shield,
  privacy: RovexoIcons.security.shield,
  policies: RovexoIcons.dashboard.help,
  support: RovexoIcons.support.support,
  other: RovexoIcons.misc.help,
};

export function resolveHelpTopicIcon(slug: HelpTopicSlug): RovexoIconRef {
  return HELP_TOPIC_ICONS[slug] ?? RovexoIcons.misc.help;
}
