/**
 * Business hub — Absolute Final Freeze (officially locked).
 * Orders · Inventory · Analytics · Wallet · VAT · Store · Promote (Coming Soon).
 * Reviews / Directory / Verification removed from user-facing navigation (engines retained).
 * Ordinary row marks are emoji (PWA_BUSINESS_ACTION_EMOJI) — not AccountIcon / Lucide.
 */
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import { PWA_BUSINESS_ACTION_EMOJI } from "@/lib/business/pwa-business-menu-v1";

export type BusinessMenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  emoji: string;
  badgeKeys?: MobileBadgeKey[];
  comingSoon?: boolean;
  value?: string;
};

export type BusinessMenuSection = {
  id: string;
  title: string;
  items: BusinessMenuItem[];
};

export const BUSINESS_HUB_INTRO = "Manage your business.";

export function buildBusinessMenuSections(_storeSlug?: string | null): BusinessMenuSection[] {
  void _storeSlug;
  return [
    {
      id: "business",
      title: "",
      items: [
        {
          id: "orders",
          title: "Orders",
          href: "/business/orders",
          emoji: PWA_BUSINESS_ACTION_EMOJI.orders,
          badgeKeys: ["orders"],
        },
        { id: "inventory", title: "Inventory", href: "/business/inventory", emoji: PWA_BUSINESS_ACTION_EMOJI.inventory },
        { id: "analytics", title: "Analytics", href: "/business/analytics", emoji: PWA_BUSINESS_ACTION_EMOJI.analytics },
        {
          id: "wallet",
          title: "Wallet",
          href: "/business/wallet",
          emoji: PWA_BUSINESS_ACTION_EMOJI.wallet,
          badgeKeys: ["wallet-payout"],
        },
        { id: "vat", title: "VAT", href: "/business/tax", emoji: PWA_BUSINESS_ACTION_EMOJI.vat },
        { id: "store", title: "Store", href: "/store", emoji: PWA_BUSINESS_ACTION_EMOJI.store },
        {
          id: "promote",
          title: "Promote",
          emoji: PWA_BUSINESS_ACTION_EMOJI.promote,
          comingSoon: true,
          value: "Coming Soon",
        },
      ],
    },
  ];
}
