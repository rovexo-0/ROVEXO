/**
 * Help Centre icons — Master Icon System (Profile stroke family + accent colours).
 * UI only. No new icon packs.
 */

import type { AccountIconName } from "@/components/account/AccountIcons";
import { MASTER_ICON_COLORS } from "@/lib/design-system/master-icon-system-v1";

export type HelpCentreIconSpec = {
  icon: AccountIconName;
  color: string;
};

/** Category grid — one official glyph + Profile/Master accent per category. */
export const HELP_CENTRE_CATEGORY_ICONS: Record<string, HelpCentreIconSpec> = {
  Buying: { icon: "orders", color: MASTER_ICON_COLORS.orange },
  Selling: { icon: "listings", color: MASTER_ICON_COLORS.purple },
  "Payments & Wallet": { icon: "wallet", color: MASTER_ICON_COLORS.cyan },
  Shipping: { icon: "shipping", color: MASTER_ICON_COLORS.orange },
  Orders: { icon: "orders", color: MASTER_ICON_COLORS.orange },
  Account: { icon: "profile", color: MASTER_ICON_COLORS.purple },
  Safety: { icon: "security", color: MASTER_ICON_COLORS.red },
  "Reports & Appeals": { icon: "support", color: MASTER_ICON_COLORS.red },
};

export const HELP_CENTRE_SUPPORT_ICONS = {
  contactSupport: { icon: "messages" as AccountIconName, color: MASTER_ICON_COLORS.blue },
  reportProblem: { icon: "support" as AccountIconName, color: MASTER_ICON_COLORS.red },
  legalCentre: { icon: "legal" as AccountIconName, color: MASTER_ICON_COLORS.blue },
} as const;

export function resolveHelpCategoryIcon(title: string): HelpCentreIconSpec {
  return (
    HELP_CENTRE_CATEGORY_ICONS[title] ?? {
      icon: "help",
      color: MASTER_ICON_COLORS.red,
    }
  );
}
