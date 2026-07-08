import { RovexoIcons } from "@/lib/icons/icons";
import type { RovexoIconRef } from "@/lib/icons/types";

const TRUST_SECTION_ICONS: Record<string, RovexoIconRef> = {
  score: RovexoIcons.actions.star,
  "buyer-protection": RovexoIcons.security.shield,
  "seller-protection": RovexoIcons.seller.listings,
  "business-protection": RovexoIcons.business.business,
  verification: RovexoIcons.badges.verified,
  disputes: RovexoIcons.dashboard.resolution,
  reports: RovexoIcons.dashboard.resolution,
  security: RovexoIcons.security.shield,
  safety: RovexoIcons.dashboard.trust,
  policies: RovexoIcons.dashboard.help,
  appeals: RovexoIcons.support.support,
};

export function resolveTrustSectionIcon(sectionId: string): RovexoIconRef {
  return TRUST_SECTION_ICONS[sectionId] ?? RovexoIcons.dashboard.trust;
}
