/**
 * ROVEXO PROFILE ICON SYSTEM v1.0 — FINAL IMPLEMENTATION LOCK
 * ONLY icons + colours may differ. Typography / spacing / Full Width unchanged.
 */

export const PROFILE_ICON_SYSTEM_NAME = "ROVEXO PROFILE ICON SYSTEM" as const;
export const PROFILE_ICON_SYSTEM_VERSION = "1.0" as const;
export const PROFILE_ICON_SYSTEM_STATUS = "PERMANENTLY LOCKED" as const;
export const PROFILE_ICON_SIZE_PX = 24 as const;

export const PROFILE_ICON_COLORS = {
  favourites: "#FF5FA2",
  settings: "#9333EA",
  ideas: "#FFD54A",
  legal: "#60A5FA",
  help: "#EF4444",
  promote: "#EC4899",
  "holiday-mode": "#22C55E",
  balance: "#06B6D4",
  "my-orders": "#F59E0B",
  logout: "#DC2626",
} as const;

export type ProfileIconId = keyof typeof PROFILE_ICON_COLORS;

export const PROFILE_ICON_KINDS = {
  favourites: "heart",
  settings: "gear",
  ideas: "lightbulb",
  legal: "shield",
  help: "question-mark",
  promote: "megaphone",
  "holiday-mode": "palm-tree",
  balance: "wallet",
  "my-orders": "package",
  logout: "logout",
} as const;

export const PROFILE_ICON_SYSTEM_RULES = {
  sizePx: PROFILE_ICON_SIZE_PX,
  style: ["premium", "minimalist", "elegant", "lightweight", "modern"] as const,
  forbidden: ["emojis", "filled icons", "oversized icons", "inconsistent colours", "custom spacings"] as const,
  onlyIconsAndColoursMayDiffer: true,
  inheritsProfileDesignSystem: true,
  inheritsFullWidth: true,
} as const;

export function profileIconSystemSnapshot() {
  return {
    name: PROFILE_ICON_SYSTEM_NAME,
    version: PROFILE_ICON_SYSTEM_VERSION,
    status: PROFILE_ICON_SYSTEM_STATUS,
    sizePx: PROFILE_ICON_SIZE_PX,
    colors: PROFILE_ICON_COLORS,
    kinds: PROFILE_ICON_KINDS,
    rules: PROFILE_ICON_SYSTEM_RULES,
    goldenRule:
      "PROFILE DESIGN SYSTEM + FULL WIDTH RULE + PREMIUM MINIMALISTIC ICON SYSTEM = FINAL IMPLEMENTATION",
  } as const;
}
