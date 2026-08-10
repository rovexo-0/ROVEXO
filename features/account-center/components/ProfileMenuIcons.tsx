/**
 * Profile menu line icons — PROFILE ICON SYSTEM v1.0.
 * Stroke 1.9 · viewBox 24 · colour via currentColor · size 24px.
 * No emojis · no fills · no custom layout.
 */

import type { ReactElement } from "react";
import {
  PROFILE_ICON_COLORS,
  PROFILE_ICON_SIZE_PX,
  type ProfileIconId,
} from "@/lib/account-center/profile-icon-system-v1";

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  width: PROFILE_ICON_SIZE_PX,
  height: PROFILE_ICON_SIZE_PX,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  style: { display: "block", width: PROFILE_ICON_SIZE_PX, height: PROFILE_ICON_SIZE_PX },
};

function Heart({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20.5 10.7 19.3C6.1 15.1 3 12.3 3 8.9 3 6.2 5.2 4 8 4c1.6 0 3.1.8 4 2 0.9-1.2 2.4-2 4-2 2.8 0 5 2.2 5 4.9 0 3.4-3.1 6.2-7.7 10.4L12 20.5Z" />
    </svg>
  );
}

function Gear({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V20a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.9 18.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03z" />
    </svg>
  );
}

function Lightbulb({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}

function Shield({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5l7 2.6v5c0 4.4-3 8-7 9.4-4-1.4-7-5-7-9.4v-5l7-2.6z" />
    </svg>
  );
}

function QuestionMark({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.5 2.5 0 0 1 4.85.86c0 1.7-2.45 2.24-2.45 3.74" />
      <circle cx="12" cy="17" r="0.7" />
    </svg>
  );
}

function Megaphone({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 11v2a4 4 0 0 0 4 4h9.2a3 3 0 0 0 2.8-1.9l1.5-4.1H8.5" />
      <path d="M7 7h11l-1.2-3.2A2 2 0 0 0 14.9 2H9.6A2 2 0 0 0 7.7 3.4L7 7z" />
    </svg>
  );
}

function PalmTree({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 22V10" />
      <path d="M12 10c-2.2-2.8-5.8-3.6-8-3 1.8 1.2 2.6 3.2 2.4 5.2" />
      <path d="M12 10c2.2-2.8 5.8-3.6 8-3-1.8 1.2-2.6 3.2-2.4 5.2" />
      <path d="M12 12c-1.6-1.4-3.8-1.8-5.5-1.2" />
      <path d="M12 12c1.6-1.4 3.8-1.8 5.5-1.2" />
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

function Package({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2.4" />
      <path d="M8.5 7V5.6A1.6 1.6 0 0 1 10.1 4h3.8a1.6 1.6 0 0 1 1.6 1.6V7" />
      <path d="M3 12h18" />
    </svg>
  );
}

function Logout({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

function Moon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20.2 14.2A8.2 8.2 0 0 1 9.8 3.8 7.2 7.2 0 1 0 20.2 14.2z" />
    </svg>
  );
}

const PROFILE_MENU_GLYPHS: Record<ProfileIconId, (props: IconProps) => ReactElement> = {
  favourites: Heart,
  settings: Gear,
  ideas: Lightbulb,
  legal: Shield,
  help: QuestionMark,
  promote: Megaphone,
  "holiday-mode": PalmTree,
  balance: Wallet,
  "my-orders": Package,
  logout: Logout,
  theme: Moon,
};

/** Menu-item id → Profile icon id (Sign Out uses logout). */
export const PROFILE_MENU_ITEM_ICON: Record<string, ProfileIconId> = {
  favourites: "favourites",
  balance: "balance",
  "my-orders": "my-orders",
  "holiday-mode": "holiday-mode",
  promote: "promote",
  settings: "settings",
  ideas: "ideas",
  theme: "theme",
  help: "help",
  legal: "legal",
  logout: "logout",
};

export function ProfileMenuIcon({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const iconId = PROFILE_MENU_ITEM_ICON[id];
  if (!iconId) {
    return (
      <span className={className ?? "ac-canonical__menu-icon"} aria-hidden>
        •
      </span>
    );
  }
  const Glyph = PROFILE_MENU_GLYPHS[iconId];
  const color = PROFILE_ICON_COLORS[iconId];
  return (
    <span
      className={className ?? "ac-canonical__menu-icon ac-canonical__menu-line-icon"}
      style={{ color }}
      aria-hidden
      data-profile-icon={iconId}
    >
      <Glyph />
    </span>
  );
}

/** @deprecated Prefer ProfileMenuIcon — colour SSOT for Balance module inheritance. */
export const PROFILE_BALANCE_ICON = {
  color: PROFILE_ICON_COLORS.balance,
  sizePx: PROFILE_ICON_SIZE_PX,
} as const;
