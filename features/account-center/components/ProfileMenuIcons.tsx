/**
 * Profile menu icons — PROFILE ICON SYSTEM density + global emoji glyphs.
 */

import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PROFILE_ICON_COLORS, PROFILE_ICON_SIZE_PX, type ProfileIconId } from "@/lib/account-center/profile-icon-system-v1";
import { PROFILE_ICON_EMOJI } from "@/lib/icons/platform-emoji-v1";

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
  const color = PROFILE_ICON_COLORS[iconId];
  return (
    <span
      className={className ?? "ac-canonical__menu-icon ac-canonical__menu-emoji"}
      style={{ color }}
      aria-hidden
      data-profile-icon={iconId}
    >
      <PlatformEmoji emoji={PROFILE_ICON_EMOJI[iconId]} width={PROFILE_ICON_SIZE_PX} height={PROFILE_ICON_SIZE_PX} />
    </span>
  );
}

/** @deprecated Prefer ProfileMenuIcon — colour SSOT for Balance module inheritance. */
export const PROFILE_BALANCE_ICON = {
  color: PROFILE_ICON_COLORS.balance,
  sizePx: PROFILE_ICON_SIZE_PX,
} as const;
