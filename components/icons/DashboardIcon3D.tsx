"use client";

import { useId, type ReactElement } from "react";
import { BottomNavIcon3D, type BottomNavIconType } from "@/components/icons/BottomNavIcon3D";
import { cn } from "@/lib/cn";

export type DashboardIconType =
  | BottomNavIconType
  | "orders"
  | "cart"
  | "messages"
  | "notifications"
  | "settings"
  | "listings"
  | "wallet"
  | "analytics"
  | "trust"
  | "help"
  | "support"
  | "business"
  | "inventory"
  | "wholesale"
  | "plans"
  | "security"
  | "addresses"
  | "payment"
  | "shipping"
  | "auctions"
  | "resolution"
  | "categories"
  | "tax"
  | "admin"
  | "buy-hub"
  | "sell-hub"
  | "business-hub"
  | "support-hub";

type DashboardIcon3DProps = {
  type: DashboardIconType;
  className?: string;
  size?: number;
};

const BOTTOM_NAV_TYPES = new Set<BottomNavIconType>(["home", "search", "sell", "saved", "account"]);

function IconDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-blue-top`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bfdbfe" />
        <stop offset="40%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id={`${uid}-blue-mid`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id={`${uid}-chrome`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="38%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id={`${uid}-glass`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#eff6ff" stopOpacity="0.98" />
        <stop offset="55%" stopColor="#93c5fd" stopOpacity="0.88" />
        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.72" />
      </linearGradient>
      <linearGradient id={`${uid}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
        <stop offset="45%" stopColor="#ffffff" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${uid}-green`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bbf7d0" />
        <stop offset="50%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
      <linearGradient id={`${uid}-amber`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id={`${uid}-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e9d5ff" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#6b21a8" />
      </linearGradient>
      <filter id={`${uid}-shadow`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#0f172a" floodOpacity="0.28" />
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#3b82f6" floodOpacity="0.22" />
      </filter>
      <radialGradient id={`${uid}-ambient`} cx="35%" cy="28%" r="65%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function Plate({ uid }: { uid: string }) {
  return (
    <>
      <circle cx="12" cy="12.5" r="9.2" fill={`url(#${uid}-blue-mid)`} opacity="0.12" />
      <ellipse cx="10.2" cy="9.4" rx="4.8" ry="3.1" fill={`url(#${uid}-ambient)`} />
    </>
  );
}

function BoxIcon({ uid, fill = "blue-top" }: { uid: string; fill?: "blue-top" | "green" | "amber" | "purple" }) {
  const gradient =
    fill === "green" ? `${uid}-green` : fill === "amber" ? `${uid}-amber` : fill === "purple" ? `${uid}-purple` : `${uid}-blue-top`;
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      <rect x="5.5" y="7" width="13" height="11" rx="2.2" fill={`url(#${gradient})`} />
      <rect x="5.5" y="7" width="13" height="11" rx="2.2" fill={`url(#${uid}-shine)`} opacity="0.35" />
      <path d="M5.5 9.8h13" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.8" />
      <rect x="7.2" y="11.5" width="4.2" height="0.9" rx="0.45" fill="#ffffff" opacity="0.65" />
      <rect x="7.2" y="13.4" width="6.5" height="0.9" rx="0.45" fill="#ffffff" opacity="0.45" />
    </g>
  );
}

function HubFolderIcon({ uid, fill }: { uid: string; fill: "blue-top" | "green" | "amber" | "purple" }) {
  const gradient = `${uid}-${fill}`;
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      <path d="M4.5 9.2h5.2l1.4 1.6h8.4a1.2 1.2 0 0 1 1.2 1.2v7.2a1.2 1.2 0 0 1-1.2 1.2H5.7a1.2 1.2 0 0 1-1.2-1.2V10.4a1.2 1.2 0 0 1 1-1.2Z" fill={`url(#${gradient})`} />
      <path d="M4.5 9.2h5.2l1.4 1.6h8.4a1.2 1.2 0 0 1 1.2 1.2v7.2a1.2 1.2 0 0 1-1.2 1.2H5.7a1.2 1.2 0 0 1-1.2-1.2V10.4a1.2 1.2 0 0 1 1-1.2Z" fill={`url(#${uid}-shine)`} opacity="0.3" />
    </g>
  );
}

function StarIcon({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      <path d="M12 5.8l1.6 3.5 3.8.45-2.8 2.5.85 3.7L12 14.2l-3.45 1.85.85-3.7-2.8-2.5 3.8-.45L12 5.8Z" fill={`url(#${uid}-amber)`} />
      <path d="M12 5.8l1.6 3.5 3.8.45-2.8 2.5.85 3.7L12 14.2l-3.45 1.85.85-3.7-2.8-2.5 3.8-.45L12 5.8Z" fill={`url(#${uid}-shine)`} opacity="0.35" />
    </g>
  );
}

function WalletIcon({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      <rect x="4.8" y="8.2" width="14.4" height="9.2" rx="2" fill={`url(#${uid}-green)`} />
      <rect x="4.8" y="8.2" width="14.4" height="9.2" rx="2" fill={`url(#${uid}-shine)`} opacity="0.3" />
      <circle cx="15.8" cy="12.8" r="1.5" fill="#ffffff" opacity="0.85" />
    </g>
  );
}

function ChartIcon({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      <rect x="5.5" y="12" width="2.8" height="6.5" rx="0.8" fill={`url(#${uid}-blue-top)`} />
      <rect x="9.6" y="9.2" width="2.8" height="9.3" rx="0.8" fill={`url(#${uid}-purple)`} />
      <rect x="13.7" y="6.8" width="2.8" height="11.7" rx="0.8" fill={`url(#${uid}-green)`} />
    </g>
  );
}

function ChatIcon({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      <path d="M5.5 7.5h11a2 2 0 0 1 2 2v5.2a2 2 0 0 1-2 2H9.8L6.8 18.5V9.5a2 2 0 0 1-1.3-2Z" fill={`url(#${uid}-blue-top)`} />
      <path d="M5.5 7.5h11a2 2 0 0 1 2 2v5.2a2 2 0 0 1-2 2H9.8L6.8 18.5V9.5a2 2 0 0 1-1.3-2Z" fill={`url(#${uid}-shine)`} opacity="0.32" />
      <circle cx="9.2" cy="12" r="0.75" fill="#ffffff" />
      <circle cx="12" cy="12" r="0.75" fill="#ffffff" />
      <circle cx="14.8" cy="12" r="0.75" fill="#ffffff" />
    </g>
  );
}

function BellIcon({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      <path d="M12 5.2c-2.4 0-4.3 1.9-4.3 4.3v3.2l-1.2 2h11l-1.2-2V9.5c0-2.4-1.9-4.3-4.3-4.3Z" fill={`url(#${uid}-amber)`} />
      <path d="M9.8 17.8h4.4a1.6 1.6 0 0 1-4.4 0Z" fill={`url(#${uid}-chrome)`} />
    </g>
  );
}

function GearIcon({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      <circle cx="12" cy="12" r="3.2" fill={`url(#${uid}-glass)`} />
      <circle cx="12" cy="12" r="6.2" fill="none" stroke={`url(#${uid}-chrome)`} strokeWidth="2.2" />
      <circle cx="12" cy="12" r="6.2" fill={`url(#${uid}-shine)`} opacity="0.2" />
    </g>
  );
}

function ShieldIcon({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      <path d="M12 4.8 6.5 7v5.2c0 3.4 2.4 5.8 5.5 6.8 3.1-1 5.5-3.4 5.5-6.8V7L12 4.8Z" fill={`url(#${uid}-green)`} />
      <path d="M12 4.8 6.5 7v5.2c0 3.4 2.4 5.8 5.5 6.8 3.1-1 5.5-3.4 5.5-6.8V7L12 4.8Z" fill={`url(#${uid}-shine)`} opacity="0.3" />
    </g>
  );
}

function CartIcon({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      <path d="M5.5 6.5h1.8l2.2 9.2h8.2l2-6.2H8.2" fill="none" stroke={`url(#${uid}-blue-top)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10.2" cy="18.2" r="1.2" fill={`url(#${uid}-purple)`} />
      <circle cx="16.2" cy="18.2" r="1.2" fill={`url(#${uid}-purple)`} />
    </g>
  );
}

const CUSTOM_RENDERERS: Record<Exclude<DashboardIconType, BottomNavIconType>, (uid: string) => ReactElement> = {
  orders: (uid) => <BoxIcon uid={uid} fill="blue-top" />,
  cart: (uid) => <CartIcon uid={uid} />,
  messages: (uid) => <ChatIcon uid={uid} />,
  notifications: (uid) => <BellIcon uid={uid} />,
  settings: (uid) => <GearIcon uid={uid} />,
  listings: (uid) => <BoxIcon uid={uid} fill="purple" />,
  wallet: (uid) => <WalletIcon uid={uid} />,
  analytics: (uid) => <ChartIcon uid={uid} />,
  trust: (uid) => <ShieldIcon uid={uid} />,
  help: (uid) => <BoxIcon uid={uid} fill="amber" />,
  support: (uid) => <ChatIcon uid={uid} />,
  business: (uid) => <HubFolderIcon uid={uid} fill="purple" />,
  inventory: (uid) => <BoxIcon uid={uid} fill="green" />,
  wholesale: (uid) => <BoxIcon uid={uid} fill="amber" />,
  plans: (uid) => <WalletIcon uid={uid} />,
  security: (uid) => <ShieldIcon uid={uid} />,
  addresses: (uid) => <BoxIcon uid={uid} fill="blue-top" />,
  payment: (uid) => <WalletIcon uid={uid} />,
  shipping: (uid) => <BoxIcon uid={uid} fill="green" />,
  auctions: (uid) => <StarIcon uid={uid} />,
  resolution: (uid) => <ShieldIcon uid={uid} />,
  categories: (uid) => <BoxIcon uid={uid} fill="purple" />,
  tax: (uid) => <BoxIcon uid={uid} fill="amber" />,
  admin: (uid) => <GearIcon uid={uid} />,
  "buy-hub": (uid) => <HubFolderIcon uid={uid} fill="blue-top" />,
  "sell-hub": (uid) => <HubFolderIcon uid={uid} fill="green" />,
  "business-hub": (uid) => <HubFolderIcon uid={uid} fill="purple" />,
  "support-hub": (uid) => <HubFolderIcon uid={uid} fill="amber" />,
};

export function resolveDashboardIconType(href: string): DashboardIconType {
  if (href === "/orders" || href.startsWith("/orders")) return "orders";
  if (href === "/cart") return "cart";
  if (href.startsWith("/messages")) return "messages";
  if (href.startsWith("/notifications")) return "notifications";
  if (href.startsWith("/settings") || href.startsWith("/account/settings") || href === "/legal") return "settings";
  if (href.startsWith("/seller/listings") || href.startsWith("/sell")) return "listings";
  if (href.startsWith("/seller/wallet") || href === "/plans") return "wallet";
  if (href.includes("analytics")) return "analytics";
  if (href.startsWith("/trust")) return "trust";
  if (href.startsWith("/resolution")) return "resolution";
  if (href.startsWith("/assistant") || href.startsWith("/help")) return "help";
  if (href.startsWith("/support")) return "support";
  if (href.startsWith("/business")) return "business";
  if (href.startsWith("/wholesale")) return "wholesale";
  if (href === "/account/addresses") return "addresses";
  if (href === "/account/payment-methods") return "payment";
  if (href === "/account/security") return "security";
  if (href === "/account/seller/shipping") return "shipping";
  if (href.startsWith("/account")) return "account";
  if (href === "/auctions") return "auctions";
  if (href === "/categories" || href.startsWith("/category") || href.startsWith("/browse")) return "categories";
  if (href.startsWith("/seller/tax")) return "tax";
  if (href.startsWith("/super-admin") || href.startsWith("/admin")) return "admin";
  if (href === "/saved") return "saved";
  if (href === "/search") return "search";
  return "help";
}

export function DashboardIcon3D({ type, className, size = 32 }: DashboardIcon3DProps) {
  const uid = useId().replace(/:/g, "");

  if (BOTTOM_NAV_TYPES.has(type as BottomNavIconType)) {
    return (
      <BottomNavIcon3D
        type={type as BottomNavIconType}
        size="tab"
        className={cn("h-8 w-8", className)}
      />
    );
  }

  const render = CUSTOM_RENDERERS[type as Exclude<DashboardIconType, BottomNavIconType>];

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <IconDefs uid={uid} />
      {render(uid)}
    </svg>
  );
}
