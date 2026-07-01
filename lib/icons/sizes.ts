/** Official ROVEXO icon size tokens — one value switches platform-wide via `RovexoIcon`. */
export const RovexoIconSizes = {
  category: 44,
  categoryContainer: 60,
  header: 24,
  bottomNav: 26,
  dashboard: 42,
  hero: 72,
  business: 36,
  settings: 22,
} as const;

export type RovexoIconVariant = keyof typeof RovexoIconSizes;

export function resolveRovexoIconSize(variant?: RovexoIconVariant, explicit?: number): number {
  if (typeof explicit === "number") return explicit;
  if (variant) return RovexoIconSizes[variant];
  return RovexoIconSizes.header;
}
