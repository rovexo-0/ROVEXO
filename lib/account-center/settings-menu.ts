/**
 * ROVEXO Settings hub — SETTINGS v1.0 (PERMANENT LOCK · APPROVED).
 *
 * PROFILE PAGE = MASTER PAGE → SETTINGS v1.0 inherits 100% design.
 * ONLY CONTENT MAY DIFFER. DESIGN NEVER DOES.
 *
 * Inventory (locked): Personal Information · Addresses · Notifications ·
 * Privacy · Security · Verification · Currency · Delete Account.
 *
 * Removed from Settings (live on Profile / Wallet instead):
 * Holiday Mode · Promote · Help Centre · Legal · Sign Out · Payment Methods · Bank Accounts · Language.
 */

import type { SettingsIconTone } from "@/lib/settings/settings-v1";

export type SettingsMenuRow = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: SettingsMenuIcon;
  tone: SettingsIconTone;
};

export type SettingsMenuSection = {
  id: string;
  title: string;
  rows: SettingsMenuRow[];
};

export type SettingsMenuIcon =
  | "user"
  | "location"
  | "credit-card"
  | "bell"
  | "lock"
  | "people"
  | "phone"
  | "shield"
  | "star"
  | "megaphone"
  | "wallet"
  | "settings"
  | "moon"
  | "globe"
  | "headset"
  | "document"
  | "info"
  | "logout";

function withReturn(href: string, returnTo: string | null): string {
  return returnTo ? `${href}?returnTo=${encodeURIComponent(returnTo)}` : href;
}

export function buildSettingsMenuSections(
  returnTo: string | null,
  _options?: { activeListingCount?: number },
): SettingsMenuSection[] {
  void _options;
  const href = (path: string) => withReturn(path, returnTo);

  return [
    {
      id: "account",
      title: "ACCOUNT",
      rows: [
        {
          id: "profile",
          title: "Personal Information",
          subtitle: "Name, photo and username.",
          href: href("/account/profile"),
          icon: "user",
          tone: "purple",
        },
        {
          id: "addresses",
          title: "Addresses",
          subtitle: "Delivery and return addresses.",
          href: href("/account/addresses"),
          icon: "location",
          tone: "blue",
        },
        {
          id: "notifications",
          title: "Notifications",
          subtitle: "Push, email and alerts.",
          href: href("/notifications/settings"),
          icon: "bell",
          tone: "orange",
        },
      ],
    },
    {
      id: "security",
      title: "SECURITY",
      rows: [
        {
          id: "privacy",
          title: "Privacy",
          subtitle: "Privacy controls and data.",
          href: href("/account/privacy"),
          icon: "shield",
          tone: "green",
        },
        {
          id: "security",
          title: "Security",
          subtitle: "Password, devices and sessions.",
          href: href("/account/security"),
          icon: "lock",
          tone: "red",
        },
        {
          id: "verification",
          title: "Verification",
          subtitle: "Identity and business verification.",
          href: href("/account/verification"),
          icon: "shield",
          tone: "rovexo-blue",
        },
      ],
    },
    {
      id: "preferences",
      title: "PREFERENCES",
      rows: [
        {
          id: "currency",
          title: "Currency",
          subtitle: "Display currency.",
          href: href("/account/preferences/currency"),
          icon: "wallet",
          tone: "gold",
        },
      ],
    },
  ];
}
