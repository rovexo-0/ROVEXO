/**
 * ROVEXO SEARCH BAR ICON FREEZE — Profile Icons Family
 * Stroke 1.9 · viewBox 24 · size 20px · currentColor · no fills · no emoji
 * Same family as ProfileMenuIcons — only size is 20 (search bar contract).
 */

export const SEARCH_BAR_ICON_SIZE_PX = 20 as const;
export const SEARCH_BAR_ICON_STROKE = 1.9 as const;
export const SEARCH_BAR_HEIGHT_PX = 44 as const;
export const SEARCH_BAR_RADIUS_PX = 16 as const;
export const SEARCH_BAR_TEXT_PX = 14 as const;

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  width: SEARCH_BAR_ICON_SIZE_PX,
  height: SEARCH_BAR_ICON_SIZE_PX,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: SEARCH_BAR_ICON_STROKE,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  style: {
    display: "block" as const,
    width: SEARCH_BAR_ICON_SIZE_PX,
    height: SEARCH_BAR_ICON_SIZE_PX,
  },
};

/** Left — Search icon (Profile Icons Family · 20×20) */
export function SearchBarSearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.5 16.5 21 21" />
    </svg>
  );
}

/** Right — Camera Search icon (Profile Icons Family · 20×20). Not Lens / AI / chat. */
export function SearchBarCameraIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 8.5h3l1.4-2h6.2l1.4 2H19.5A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-8a1.5 1.5 0 0 1 1.5-1.5Z" />
      <circle cx="12" cy="14" r="3.2" />
    </svg>
  );
}

/** Right — Close / X (Profile Icons Family · 20×20) */
export function SearchBarCloseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export const SEARCH_BAR_ICON_FREEZE = {
  version: "1.0",
  status: "PERMANENT_FREEZE",
  family: "Profile Icons Family",
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
  forbidden: [
    "different family",
    "different stroke",
    "different thickness",
    "different padding",
    "different size",
    "AI Camera",
    "Google Lens style",
    "Chat style camera",
    "multiple camera systems",
  ],
} as const;
