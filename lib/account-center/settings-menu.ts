/**
 * ROVEXO Settings hub — Sprint 1 canonical foundation v1.0.
 * Flat sections. Light theme only. UI inventory SSOT.
 */

export type SettingsRowKind = "link" | "toggle" | "meta" | "action";

export type SettingsToggleKey =
  | "pushEnabled"
  | "emailMessages"
  | "orders"
  | "emailMarketing";

export type SettingsMenuIcon =
  | "mail"
  | "phone"
  | "user"
  | "lock"
  | "shield"
  | "eye"
  | "ban"
  | "download"
  | "trash"
  | "bell"
  | "credit-card"
  | "landmark"
  | "percent"
  | "file-text"
  | "scroll-text"
  | "cookie"
  | "scale"
  | "help-circle"
  | "message-circle"
  | "flag"
  | "info"
  | "hash";

export type SettingsMenuRow = {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  icon: SettingsMenuIcon;
  kind?: SettingsRowKind;
  /** NotificationSettings field when kind === "toggle". */
  toggleKey?: SettingsToggleKey;
  comingSoon?: boolean;
  /** Static meta value (About). */
  value?: string;
  /** Destructive row style. */
  destructive?: boolean;
  /** Opens Delete Account flow. */
  action?: "delete-account";
};

export type SettingsMenuSection = {
  id: string;
  title: string;
  rows: SettingsMenuRow[];
};

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
          id: "email",
          title: "Email",
          subtitle: "Account email address",
          href: href("/account/profile"),
          icon: "mail",
        },
        {
          id: "phone",
          title: "Phone Number",
          subtitle: "Mobile number for verification",
          href: href("/account/profile"),
          icon: "phone",
        },
        {
          id: "username",
          title: "Username",
          subtitle: "Public username",
          href: href("/account/profile"),
          icon: "user",
        },
        {
          id: "change-password",
          title: "Change Password",
          subtitle: "Update your password",
          href: href("/account/security"),
          icon: "lock",
        },
        {
          id: "two-factor",
          title: "Two-Factor Authentication",
          subtitle: "Add an extra layer of security",
          href: href("/account/security"),
          icon: "shield",
          comingSoon: true,
        },
      ],
    },
    {
      id: "privacy",
      title: "PRIVACY",
      rows: [
        {
          id: "profile-visibility",
          title: "Profile Visibility",
          subtitle: "Who can see your profile",
          href: href("/account/privacy"),
          icon: "eye",
        },
        {
          id: "blocked-users",
          title: "Blocked Users",
          subtitle: "People you've blocked",
          href: href("/account/blocked-users"),
          icon: "ban",
        },
        {
          id: "download-data",
          title: "Download My Data",
          subtitle: "Request a copy of your data",
          href: "/support?category=data-export",
          icon: "download",
        },
        {
          id: "delete-account",
          title: "Delete Account",
          subtitle: "Permanently delete your account",
          icon: "trash",
          kind: "action",
          action: "delete-account",
          destructive: true,
        },
      ],
    },
    {
      id: "notifications",
      title: "NOTIFICATIONS",
      rows: [
        {
          id: "push-notifications",
          title: "Push Notifications",
          kind: "toggle",
          toggleKey: "pushEnabled",
          icon: "bell",
        },
        {
          id: "email-notifications",
          title: "Email Notifications",
          kind: "toggle",
          toggleKey: "emailMessages",
          icon: "mail",
        },
        {
          id: "order-updates",
          title: "Order Updates",
          kind: "toggle",
          toggleKey: "orders",
          icon: "bell",
        },
        {
          id: "marketing-emails",
          title: "Marketing Emails",
          kind: "toggle",
          toggleKey: "emailMarketing",
          icon: "mail",
        },
      ],
    },
    {
      id: "payments",
      title: "PAYMENTS",
      rows: [
        {
          id: "payment-methods",
          title: "Payment Methods",
          subtitle: "Cards and checkout options",
          href: href("/wallet/payment-methods"),
          icon: "credit-card",
        },
        {
          id: "bank-account",
          title: "Connected Bank Account",
          subtitle: "Payout bank details",
          href: href("/wallet/bank-account"),
          icon: "landmark",
        },
        {
          id: "platform-fees",
          title: "Platform Fees",
          subtitle: "Read-only fee information",
          href: "/legal/platform-fee-policy",
          icon: "percent",
        },
      ],
    },
    {
      id: "legal",
      title: "LEGAL",
      rows: [
        {
          id: "terms",
          title: "Terms & Conditions",
          href: "/legal/terms-and-conditions",
          icon: "file-text",
        },
        {
          id: "privacy-policy",
          title: "Privacy Policy",
          href: "/legal/privacy-policy",
          icon: "scroll-text",
        },
        {
          id: "cookie-policy",
          title: "Cookie Policy",
          href: "/legal/cookie-policy",
          icon: "cookie",
        },
        {
          id: "marketplace-rules",
          title: "Marketplace Rules",
          href: "/legal/community-guidelines",
          icon: "scale",
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
          href: "/help",
          icon: "help-circle",
        },
        {
          id: "contact",
          title: "Contact Support",
          href: "/support",
          icon: "message-circle",
        },
        {
          id: "report",
          title: "Report a Problem",
          href: "/support?category=report",
          icon: "flag",
        },
      ],
    },
  ];
}
