"use client";

import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import type { SettingsMenuIcon } from "@/lib/account-center/settings-menu";

/**
 * Settings icons — One Product freeze.
 * Same AccountIcon family as My Account / Buying / Selling / Wallet / Messages.
 */
const SETTINGS_TO_ACCOUNT_ICON: Record<SettingsMenuIcon, AccountIconName> = {
  user: "profile",
  location: "shipping",
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
  globe: "settings",
  headset: "help",
  document: "orders",
  info: "help",
  logout: "security",
};

export function SettingsMenuIconGlyph({
  name,
  danger = false,
}: {
  name: SettingsMenuIcon;
  danger?: boolean;
}) {
  const className = danger ? "settings-canonical__danger-icon" : undefined;
  return (
    <span className={`cds-menu-row__icon ac-canonical__menu-icon ${className ?? ""}`.trim()} aria-hidden>
      <AccountIcon name={SETTINGS_TO_ACCOUNT_ICON[name] ?? "settings"} />
    </span>
  );
}
