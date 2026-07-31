"use client";

import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import type { SettingsMenuIcon } from "@/lib/account-center/settings-menu";
import {
  SETTINGS_ICON_TONE_COLORS,
  type SettingsIconTone,
} from "@/lib/settings/settings-v1";

/**
 * Settings icons — One Product freeze + Profile accent tones.
 * Colour is inline (SSR + first paint) — never wait on CSS chunk load.
 */
const SETTINGS_TO_ACCOUNT_ICON: Record<SettingsMenuIcon, AccountIconName> = {
  user: "profile",
  location: "address",
  "credit-card": "payment",
  bell: "notifications",
  lock: "security",
  people: "following",
  phone: "support",
  shield: "verification",
  star: "reviews",
  megaphone: "promotions",
  wallet: "wallet",
  settings: "settings",
  moon: "settings",
  globe: "language",
  headset: "accessibility",
  document: "legal",
  info: "help",
  logout: "security",
};

export function SettingsMenuIconGlyph({
  name,
  tone,
  danger = false,
}: {
  name: SettingsMenuIcon;
  tone?: SettingsIconTone;
  danger?: boolean;
}) {
  const resolvedTone: SettingsIconTone = danger
    ? "soft-red"
    : tone ?? "purple";
  const color = SETTINGS_ICON_TONE_COLORS[resolvedTone];

  return (
    <span
      className={`ac-canonical__menu-icon settings-canonical__icon settings-canonical__icon--${resolvedTone}`}
      style={{ color, display: "inline-flex", width: 24, height: 24 }}
      aria-hidden
      data-settings-icon={name}
      data-settings-tone={resolvedTone}
    >
      <AccountIcon
        name={SETTINGS_TO_ACCOUNT_ICON[name] ?? "settings"}
        className="settings-canonical__icon-svg"
      />
    </span>
  );
}
