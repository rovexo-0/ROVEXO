/**
 * ROVEXO v1.0 — My Account grid icon set.
 *
 * Clean, colorful line/solid icons that render on pastel tiles. Every glyph uses
 * `currentColor`, so the tile sets the accent colour (see `account-nav.ts`). One
 * shared visual family — consistent stroke weight, rounded joins, 24px viewBox.
 */

import type { ReactElement } from "react";

export type AccountIconName =
  | "profile"
  | "orders"
  | "saved"
  | "listings"
  | "messages"
  | "wallet"
  | "business"
  | "settings"
  | "help"
  | "reviews"
  | "import"
  | "shipping"
  | "returns"
  | "notifications"
  | "security"
  | "following"
  | "payment"
  | "support"
  | "cart"
  | "verification"
  | "ideas";

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function Profile({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function Orders({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2.4" />
      <path d="M8.5 7V5.6A1.6 1.6 0 0 1 10.1 4h3.8a1.6 1.6 0 0 1 1.6 1.6V7" />
      <path d="M3 12h18" />
    </svg>
  );
}

function Saved({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 20.7l-1.3-1.18C6.1 15.35 3 12.55 3 9.1 3 6.3 5.2 4.1 8 4.1c1.58 0 3.1.74 4 1.9.9-1.16 2.42-1.9 4-1.9 2.8 0 5 2.2 5 5 0 3.45-3.1 6.25-7.7 10.42L12 20.7z" />
    </svg>
  );
}

function Listings({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 4h7.2a2 2 0 0 1 1.42.59l7 7a2 2 0 0 1 0 2.82l-4.8 4.8a2 2 0 0 1-2.82 0l-7-7A2 2 0 0 1 4 10.8V4z" />
      <circle cx="8.5" cy="8.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Messages({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V16H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </svg>
  );
}

function Wallet({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17a1 1 0 0 1 1 1v1.5" />
      <rect x="3" y="7.5" width="18" height="12" rx="2.4" />
      <path d="M16 12.5h3.2a.8.8 0 0 1 .8.8v1.4a.8.8 0 0 1-.8.8H16a1.5 1.5 0 0 1 0-3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Business({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9.5 5.2 5.3A1 1 0 0 1 6.16 4.6h11.68a1 1 0 0 1 .96.7L20 9.5" />
      <path d="M4 9.5h16v1a2.5 2.5 0 0 1-4.2 1.83A2.5 2.5 0 0 1 12 12a2.5 2.5 0 0 1-3.8.83A2.5 2.5 0 0 1 4 10.5v-1z" />
      <path d="M5.5 13v6.5h13V13" />
      <path d="M10 19.5V16h4v3.5" />
    </svg>
  );
}

function Settings({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V20a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.9 18.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03z" />
    </svg>
  );
}

function Help({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.5 2.5 0 0 1 4.85.86c0 1.7-2.45 2.24-2.45 3.74" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Reviews({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 3.5l2.62 5.3 5.85.85-4.23 4.13 1 5.82L12 17.9l-5.24 2.7 1-5.82L3.53 9.65l5.85-.85L12 3.5z" />
    </svg>
  );
}

function Import({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 4v9" />
      <path d="M8.5 10.5 12 14l3.5-3.5" />
      <path d="M4 14v3.5A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V14" />
    </svg>
  );
}

function Shipping({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 6.5h10.5a1 1 0 0 1 1 1v8.5H3z" />
      <path d="M14.5 10h3.2a1 1 0 0 1 .82.43l2.1 3a1 1 0 0 1 .18.57V16h-6.3v-6z" />
      <circle cx="7" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
    </svg>
  );
}

function Returns({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 7.5 12 4l8.5 3.5L12 11 3.5 7.5z" />
      <path d="M3.5 7.5v9L12 20l8.5-3.5v-9" />
      <path d="M12 11v9" />
      <path d="M10.4 14.4 8.6 12.9M8.6 12.9l1.8-1.4M8.6 12.9H12a2.4 2.4 0 0 1 0 4.8h-1" />
    </svg>
  );
}

function Notifications({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 5 1.8 6.5 1.8 6.5H4.2S6 14.5 6 9.5z" />
      <path d="M9.8 19a2.3 2.3 0 0 0 4.4 0" />
    </svg>
  );
}

function Security({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5l7 2.6v5c0 4.4-3 8-7 9.4-4-1.4-7-5-7-9.4v-5l7-2.6z" />
      <path d="M9 12l2 2 4-4.2" />
    </svg>
  );
}

function Following({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.4L6 20V5.5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function Payment({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.4" />
      <path d="M3 9.5h18" />
      <path d="M6.5 14.5h4" />
    </svg>
  );
}

function Support({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 13v-1a7 7 0 0 1 14 0v1" />
      <path d="M5 13h1.5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 16.5v-2A1.5 1.5 0 0 1 5.5 13z" fill="currentColor" stroke="none" />
      <path d="M19 13h-1.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1H18a1.5 1.5 0 0 0 1.5-1.5v-2A1.5 1.5 0 0 0 18 13z" fill="currentColor" stroke="none" />
      <path d="M19 17v.5a3 3 0 0 1-3 3h-2.5" />
    </svg>
  );
}

function Cart({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M3 3h2.2l1.4 9.4a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 1.9-1.4L20 7H6.2" />
    </svg>
  );
}

function Verification({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5l7 2.6v5c0 4.4-3 8-7 9.4-4-1.4-7-5-7-9.4v-5l7-2.6z" />
      <path d="M9 12l2 2 4-4.2" />
    </svg>
  );
}

function Ideas({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}

const ICONS: Record<AccountIconName, (props: IconProps) => ReactElement> = {
  profile: Profile,
  orders: Orders,
  saved: Saved,
  listings: Listings,
  messages: Messages,
  wallet: Wallet,
  business: Business,
  settings: Settings,
  help: Help,
  reviews: Reviews,
  import: Import,
  shipping: Shipping,
  returns: Returns,
  notifications: Notifications,
  security: Security,
  following: Following,
  payment: Payment,
  support: Support,
  cart: Cart,
  verification: Verification,
  ideas: Ideas,
};

export function AccountIcon({ name, className }: { name: AccountIconName; className?: string }) {
  const Glyph = ICONS[name];
  return <Glyph className={className} />;
}
