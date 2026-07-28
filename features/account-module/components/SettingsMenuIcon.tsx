"use client";

import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import type { SettingsMenuIcon } from "@/lib/account-center/settings-menu";
import type { SettingsIconTone } from "@/lib/settings/settings-v1";

/**
 * Settings icons — One Product freeze + v1.0 accent tones.
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
  const toneClass = danger
    ? "settings-canonical__icon--soft-red"
    : tone
      ? `settings-canonical__icon--${tone}`
      : "";
  return (
    <span
      className={`cds-menu-row__icon ac-canonical__menu-icon settings-canonical__icon ${toneClass}`.trim()}
      aria-hidden
    >
      <AccountIcon name={SETTINGS_TO_ACCOUNT_ICON[name] ?? "settings"} />
    </span>
  );
}
