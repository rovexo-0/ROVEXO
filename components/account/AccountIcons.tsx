/**
 * ROVEXO v1.0 — My Account / Hub icon set (canonical marketplace line family).
 *
 * Classic · standard · minimalist · professional · marketplace-friendly.
 * Same stroke (1.9), viewBox 24, round caps/joins. Colour via `currentColor`.
 * Homepage / Login / Register are excluded from this catalog (frozen separately).
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
  | "ideas"
  | "promotions"
  | "search"
  | "sell"
  | "categories"
  | "product"
  | "checkout"
  | "tracking"
  | "disputes"
  | "refunds"
  | "directory"
  | "stores"
  | "legal"
  | "trust"
  | "analytics"
  | "inventory"
  | "vat"
  | "recent"
  | "address"
  | "language"
  | "accessibility"
  | "inbox";

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
    <svg {...base} className={className}>
      <path d="M12 20.5 10.7 19.3C6.1 15.1 3 12.3 3 8.9 3 6.2 5.2 4 8 4c1.6 0 3.1.8 4 2 0.9-1.2 2.4-2 4-2 2.8 0 5 2.2 5 4.9 0 3.4-3.1 6.2-7.7 10.4L12 20.5Z" />
    </svg>
  );
}

function Listings({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 4h7.2a2 2 0 0 1 1.42.59l7 7a2 2 0 0 1 0 2.82l-4.8 4.8a2 2 0 0 1-2.82 0l-7-7A2 2 0 0 1 4 10.8V4z" />
      <circle cx="8.5" cy="8.5" r="1.4" />
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
      <path d="M16 12.5h3.2a.8.8 0 0 1 .8.8v1.4a.8.8 0 0 1-.8.8H16a1.5 1.5 0 0 1 0-3z" />
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
      <circle cx="12" cy="17" r="0.7" />
    </svg>
  );
}

function Reviews({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.8 14.4 9l5.6.8-4.1 4 1 5.6L12 16.8 7.1 19.4l1-5.6-4.1-4L9.6 9 12 3.8Z" />
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
      <rect x="4" y="13" width="3.5" height="6" rx="1" />
      <rect x="16.5" y="13" width="3.5" height="6" rx="1" />
      <path d="M19 17v.5a3 3 0 0 1-3 3h-2.5" />
    </svg>
  );
}

function Cart({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
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

function Promotions({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 11v2a4 4 0 0 0 4 4h9.2a3 3 0 0 0 2.8-1.9l1.5-4.1H8.5" />
      <path d="M7 7h11l-1.2-3.2A2 2 0 0 0 14.9 2H9.6A2 2 0 0 0 7.7 3.4L7 7z" />
    </svg>
  );
}

function Search({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function Sell({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3v18" />
      <path d="M8 7h6.5a3 3 0 0 1 0 6H9.5a3 3 0 0 0 0 6H16" />
    </svg>
  );
}

function Categories({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function Product({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="m4 15 4-4 3 3 3-3 6 6" />
      <circle cx="9" cy="9" r="1.4" />
    </svg>
  );
}

function Checkout({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 12 10 18l10-12" />
    </svg>
  );
}

function Tracking({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.2 2" />
    </svg>
  );
}

function Disputes({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 20.5 18H3.5L12 3.5Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.5" r="0.7" />
    </svg>
  );
}

function Refunds({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 10H4.5V7.5" />
      <path d="M4.5 10a7.5 7.5 0 1 1 2.2 5.3" />
      <path d="M12 8v4l2.5 1.5" />
    </svg>
  );
}

function Directory({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 5.5h7.5L13 7.5H20v12H4z" />
      <path d="M8 11h8M8 14.5h5" />
    </svg>
  );
}

function Stores({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9.5 6 4h12l2 5.5" />
      <path d="M4 9.5h16v10.5H4z" />
      <path d="M9.5 20V14h5v6" />
    </svg>
  );
}

function Legal({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 4h7l4 4v12H7z" />
      <path d="M14 4v4h4" />
      <path d="M9.5 12h6M9.5 15.5h6M9.5 19h4" />
    </svg>
  );
}

function Trust({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5l7 2.6v5c0 4.4-3 8-7 9.4-4-1.4-7-5-7-9.4v-5l7-2.6z" />
      <path d="M8.5 12.2h7" />
      <path d="M12 8.8v6.8" />
    </svg>
  );
}

function Analytics({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 19h16" />
      <path d="M7 16V11" />
      <path d="M12 16V7" />
      <path d="M17 16v-4" />
    </svg>
  );
}

function Inventory({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 8.5 12 4l8 4.5v9L12 22 4 17.5z" />
      <path d="M12 13v9" />
      <path d="M4 8.5 12 13l8-4.5" />
    </svg>
  );
}

function Vat({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function Recent({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5l3 1.8" />
    </svg>
  );
}

function Address({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </svg>
  );
}

function Language({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5a14 14 0 0 1 0 17 14 14 0 0 1 0-17Z" />
    </svg>
  );
}

function Accessibility({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="5.5" r="2" />
      <path d="M6.5 9.5h11" />
      <path d="M12 9.5v5.5l-3.5 5" />
      <path d="M12 15l3.5 5" />
    </svg>
  );
}

function Inbox({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 6.5h16v11H4z" />
      <path d="M4 6.5 12 13l8-6.5" />
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
  promotions: Promotions,
  search: Search,
  sell: Sell,
  categories: Categories,
  product: Product,
  checkout: Checkout,
  tracking: Tracking,
  disputes: Disputes,
  refunds: Refunds,
  directory: Directory,
  stores: Stores,
  legal: Legal,
  trust: Trust,
  analytics: Analytics,
  inventory: Inventory,
  vat: Vat,
  recent: Recent,
  address: Address,
  language: Language,
  accessibility: Accessibility,
  inbox: Inbox,
};

export function AccountIcon({ name, className }: { name: AccountIconName; className?: string }) {
  const Glyph = ICONS[name];
  return <Glyph className={className} />;
}
