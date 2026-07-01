export type IconThemeMode = "glass" | "standard";

/**
 * Platform-wide icon theme. Change `mode` to switch the entire UI icon system.
 * `glass` — Premium 3D frameless glass SVGs (default).
 * `standard` — Permanent WebP/PNG fallback for category assets.
 */
export const IconTheme = {
  mode: "glass" as IconThemeMode,
} as const;

export function isGlassIconMode(): boolean {
  return IconTheme.mode === "glass";
}

export function isStandardIconMode(): boolean {
  return IconTheme.mode === "standard";
}

/** @deprecated Use `isStandardIconMode` */
export const isLegacyIconMode = isStandardIconMode;
