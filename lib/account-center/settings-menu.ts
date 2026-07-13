/**
 * ROVEXO Settings hub — canonical menu v1.0 (flat sections).
 * Routes map to existing account surfaces; logical /settings/* names in comments only.
 */

export type SettingsMenuRow = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: SettingsMenuIcon;
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

export function buildSettingsMenuSections(returnTo: string | null): SettingsMenuSection[] {
  const href = (path: string) => withReturn(path, returnTo);

  return [
    {
      id: "account",
      title: "ACCOUNT",
      rows: [
        {
          id: "profile",
          title: "Profile",
          subtitle: "Name, photo, and public profile",
          href: href("/account/profile"),
          icon: "user",
        },
        {
          id: "addresses",
          title: "Addresses",
          subtitle: "Delivery and billing addresses",
          href: href("/account/addresses"),
          icon: "location",
        },
        {
          id: "payment-methods",
          title: "Payment Methods",
          subtitle: "Cards and payment options",
          href: href("/wallet/payment-methods"),
          icon: "credit-card",
        },
        {
          id: "notifications",
          title: "Notifications",
          subtitle: "Alerts, email, and push",
          href: href("/notifications/settings"),
          icon: "bell",
        },
      ],
    },
    {
      id: "security",
      title: "SECURITY",
      rows: [
        {
          id: "privacy-security",
          title: "Privacy & Security",
          subtitle: "Password, privacy, and data",
          href: href("/account/security"),
          icon: "lock",
        },
        {
          id: "connected-accounts",
          title: "Connected Accounts",
          subtitle: "Linked social and sign-in",
          href: href("/account/security"),
          icon: "people",
        },
        {
          id: "devices",
          title: "Devices & Sessions",
          subtitle: "Active devices and logins",
          href: href("/account/security"),
          icon: "phone",
        },
        {
          id: "blocked-users",
          title: "Blocked Users",
          subtitle: "People you've blocked",
          href: href("/account/blocked-users"),
          icon: "people",
        },
      ],
    },
    {
      id: "marketplace",
      title: "MARKETPLACE",
      rows: [
        {
          id: "business-verification",
          title: "Business Verification",
          subtitle: "Company and trade details",
          href: href("/trust"),
          icon: "shield",
        },
        {
          id: "seller-performance",
          title: "Seller Performance",
          subtitle: "Reputation score and achievements",
          href: href("/seller/performance"),
          icon: "star",
        },
        {
          id: "promotion-tools",
          title: "Promotion Tools",
          subtitle: "Boost listings and campaigns",
          href: href("/account/promotion-tools"),
          icon: "megaphone",
        },
        {
          id: "wallet",
          title: "Wallet",
          subtitle: "Balance, payouts, and transactions",
          href: href("/wallet"),
          icon: "wallet",
        },
      ],
    },
    {
      id: "preferences",
      title: "PREFERENCES",
      rows: [
        {
          id: "preferences",
          title: "Preferences",
          subtitle: "Shopping and recommendations",
          href: href("/account/buyer/preferences"),
          icon: "settings",
        },
        {
          id: "appearance",
          title: "Appearance",
          subtitle: "Theme and display",
          href: href("/account/preferences/appearance"),
          icon: "moon",
        },
        {
          id: "language-currency",
          title: "Language & Currency",
          subtitle: "Region, language, and currency",
          href: href("/account/preferences/language"),
          icon: "globe",
        },
        {
          id: "accessibility",
          title: "Accessibility",
          subtitle: "Accessibility options and statement",
          href: "/legal/accessibility-statement",
          icon: "headset",
        },
      ],
    },
    {
      id: "legal",
      title: "LEGAL",
      rows: [
        {
          id: "terms-policies",
          title: "Terms & Policies",
          subtitle: "Terms, privacy, and cookies",
          href: "/legal",
          icon: "document",
        },
        {
          id: "about",
          title: "About ROVEXO",
          subtitle: "App version and information",
          href: "/account/settings/about",
          icon: "info",
        },
      ],
    },
  ];
}
