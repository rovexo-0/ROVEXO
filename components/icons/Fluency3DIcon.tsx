"use client";

import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/cn";
import {
  BagLineIcon,
  BellLineIcon,
  CartLineIcon,
  ChatLineIcon,
  CheckLineIcon,
  ChevronRightLineIcon,
  CreditCardLineIcon,
  DocumentLineIcon,
  GlobeLineIcon,
  HeartLineIcon,
  LockLineIcon,
  MegaphoneLineIcon,
  MoreLineIcon,
  PeopleLineIcon,
  SearchLineIcon,
  SettingsLineIcon,
  ShieldLineIcon,
  StarLineIcon,
  TagLineIcon,
  TruckLineIcon,
  UserLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import type { Fluency3DIconKey } from "@/lib/icons/fluency-3d-registry";

type Fluency3DIconProps = {
  icon: Fluency3DIconKey | string;
  size?: number;
  className?: string;
  alt?: string;
};

type IconProps = SVGProps<SVGSVGElement>;

function HomeLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function CloseLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function BackGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M15 6 9 12l6 6" />
    </svg>
  );
}

function PlusGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CameraGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}

function LogoutGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 16l4-4-4-4M18 12H9" />
    </svg>
  );
}

const ICON_MAP: Record<string, ComponentType<IconProps>> = {
  home: HomeLineIcon,
  search: SearchLineIcon,
  sell: PlusGlyph,
  saved: HeartLineIcon,
  account: UserLineIcon,
  notifications: BellLineIcon,
  settings: SettingsLineIcon,
  categories: TagLineIcon,
  messages: ChatLineIcon,
  wallet: WalletLineIcon,
  orders: BagLineIcon,
  cart: CartLineIcon,
  shipping: TruckLineIcon,
  reviews: StarLineIcon,
  inventory: TagLineIcon,
  "feature-search": SearchLineIcon,
  "feature-close": CloseLineIcon,
  "feature-back": BackGlyph,
  "feature-bell": BellLineIcon,
  "feature-settings": SettingsLineIcon,
  "feature-share": MegaphoneLineIcon,
  "feature-shield": ShieldLineIcon,
  "feature-chevron-right": ChevronRightLineIcon,
  "feature-chevron-right-sm": ChevronRightLineIcon,
  "feature-verified": ShieldLineIcon,
  "feature-account": UserLineIcon,
  "feature-payment": CreditCardLineIcon,
  "feature-language": GlobeLineIcon,
  "feature-currency": TagLineIcon,
  "feature-appearance": SettingsLineIcon,
  "feature-lock": LockLineIcon,
  "feature-two-factor": LockLineIcon,
  "feature-blocked": ShieldLineIcon,
  "feature-stripe": CreditCardLineIcon,
  "feature-wallet-menu": WalletLineIcon,
  "feature-shipping": TruckLineIcon,
  "feature-terms": DocumentLineIcon,
  "feature-privacy": LockLineIcon,
  "feature-menu": MoreLineIcon,
  "feature-user": UserLineIcon,
  "feature-settings-menu": SettingsLineIcon,
  "feature-listings": TagLineIcon,
  "feature-sales": BagLineIcon,
  "feature-followers": PeopleLineIcon,
  "feature-sign-out": LogoutGlyph,
  "feature-orders-menu": BagLineIcon,
  "feature-messages-menu": ChatLineIcon,
  "feature-notifications-menu": BellLineIcon,
  "feature-help-menu": ChatLineIcon,
  "feature-about-menu": DocumentLineIcon,
  "feature-notif-message": ChatLineIcon,
  "feature-notif-order": BagLineIcon,
  "feature-notif-offer": TagLineIcon,
  "feature-notif-system": BellLineIcon,
  "feature-notif-check": CheckLineIcon,
  "feature-notif-trash": CloseLineIcon,
  "feature-message-read": CheckLineIcon,
  "feature-message-delivered": CheckLineIcon,
  "feature-message-sent": CheckLineIcon,
  "feature-message-search": SearchLineIcon,
  "feature-message-more": MoreLineIcon,
  "feature-message-empty": ChatLineIcon,
  "feature-message-plus": PlusGlyph,
  "feature-message-camera": CameraGlyph,
  "sa-reviews": StarLineIcon,
  "sa-promotions": MegaphoneLineIcon,
  "hub-buy": BagLineIcon,
  "hub-sell": TagLineIcon,
  "hub-business": UserLineIcon,
  "hub-support": ChatLineIcon,
};

/**
 * Absolute Final: Fluency 3D assets removed.
 * Same API, line-icon rendering — one icon family platform-wide.
 */
export function Fluency3DIcon({ icon, size = 32, className, alt = "" }: Fluency3DIconProps) {
  const Icon = ICON_MAP[String(icon)] ?? TagLineIcon;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center text-current", className)}
      style={{ width: size, height: size }}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <Icon className="h-full w-full" />
    </span>
  );
}
