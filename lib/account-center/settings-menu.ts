/**
 * ROVEXO Settings hub — UK Public Launch Simplification v1.0
 *
 * PROFILE PAGE = MASTER PAGE → Settings inherits 100% design.
 * ONLY CONTENT / NAVIGATION MAY DIFFER. DESIGN NEVER DOES.
 *
 * Navigation-only removals (backends retained): Verification, Marketplace prefs,
 * Finance entries, Report a Problem, Feedback.
 * Accessibility lives in Legal Centre (not Settings → Account).
 */

import type { SettingsIconTone } from "@/lib/settings/settings-v1";
import { PHASE_C3_SETTINGS_IA_V1 } from "@/lib/settings/phase-c3-settings-information-architecture-v1";

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

const R = PHASE_C3_SETTINGS_IA_V1.routes;

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
          href: href(R.personalInformation),
          icon: "user",
          tone: "purple",
        },
        {
          id: "security",
          title: "Security",
          subtitle: "Password, sessions and devices.",
          href: href(R.security),
          icon: "lock",
          tone: "red",
        },
        {
          id: "privacy",
          title: "Privacy",
          subtitle: "Privacy controls, GDPR and data rights.",
          href: href(R.privacy),
          icon: "shield",
          tone: "green",
        },
        {
          id: "notifications",
          title: "Notifications",
          subtitle: "Push, email and marketplace alerts.",
          href: href(R.notifications),
          icon: "bell",
          tone: "orange",
        },
        {
          id: "addresses",
          title: "Addresses",
          subtitle: "Delivery and return addresses.",
          href: href(R.addresses),
          icon: "location",
          tone: "blue",
        },
        {
          id: "currency",
          title: "Currency & Region",
          subtitle: "United Kingdom · GBP · English.",
          href: href(R.currency),
          icon: "globe",
          tone: "gold",
        },
        {
          id: "blocked-users",
          title: "Blocked Users",
          subtitle: "Manage blocked members.",
          href: href(R.blockedUsers),
          icon: "people",
          tone: "red",
        },
      ],
    },
    {
      id: "support",
      title: "SUPPORT",
      rows: [
        {
          id: "help",
          title: "Help Centre",
          subtitle: "Guides, FAQs and support.",
          href: href(R.help),
          icon: "info",
          tone: "red",
        },
      ],
    },
    {
      id: "legal",
      title: "LEGAL",
      rows: [
        {
          id: "legal-information",
          title: "Legal Information",
          subtitle: "Official ROVEXO Legal Centre — all policies.",
          href: href(R.legalIndex),
          icon: "document",
          tone: "purple",
        },
        {
          id: "hmrc",
          title: "HMRC Reporting",
          subtitle: "UK digital platform reporting.",
          href: href(R.hmrc),
          icon: "document",
          tone: "rovexo-blue",
        },
      ],
    },
  ];
}
