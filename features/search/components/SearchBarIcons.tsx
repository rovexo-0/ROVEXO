/**
 * ROVEXO SEARCH BAR ICONS — global emoji system (20px box, Search bar contract).
 */

import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

export const SEARCH_BAR_ICON_SIZE_PX = 20 as const;
export const SEARCH_BAR_ICON_STROKE = 1.9 as const;
export const SEARCH_BAR_HEIGHT_PX = 44 as const;
export const SEARCH_BAR_RADIUS_PX = 16 as const;
export const SEARCH_BAR_TEXT_PX = 16 as const;

type IconProps = { className?: string };

export function SearchBarSearchIcon({ className }: IconProps) {
  return (
    <PlatformEmoji
      emoji={PLATFORM_EMOJI.search}
      className={className}
      width={SEARCH_BAR_ICON_SIZE_PX}
      height={SEARCH_BAR_ICON_SIZE_PX}
    />
  );
}

export function SearchBarCameraIcon({ className }: IconProps) {
  return (
    <PlatformEmoji
      emoji={PLATFORM_EMOJI.camera}
      className={className}
      width={SEARCH_BAR_ICON_SIZE_PX}
      height={SEARCH_BAR_ICON_SIZE_PX}
    />
  );
}

export function SearchBarCloseIcon({ className }: IconProps) {
  return (
    <PlatformEmoji
      emoji={PLATFORM_EMOJI.close}
      className={className}
      width={SEARCH_BAR_ICON_SIZE_PX}
      height={SEARCH_BAR_ICON_SIZE_PX}
    />
  );
}

export const SEARCH_BAR_ICON_FREEZE = {
  version: "1.0",
  status: "PERMANENT_FREEZE",
  family: "Platform Emoji",
  sizePx: SEARCH_BAR_ICON_SIZE_PX,
  stroke: SEARCH_BAR_ICON_STROKE,
  barHeightPx: SEARCH_BAR_HEIGHT_PX,
  barRadiusPx: SEARCH_BAR_RADIUS_PX,
  textPx: SEARCH_BAR_TEXT_PX,
  layout: {
    left: "Search Icon",
    center: "Search for items or members",
    right: ["Camera Search Icon", "X button"],
  },
} as const;
