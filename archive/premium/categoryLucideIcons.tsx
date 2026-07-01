/**
 * @deprecated Use `getCategoryGlassIcon` from `@/lib/icons` instead.
 */
export { getCategoryGlassIcon as getCategoryLucideIcon } from "@/lib/icons/icons";
export { getCategoryGlassIcon } from "@/lib/icons/icons";

/** @deprecated Glass icons use unified palette — color is baked into SVG. */
export function getCategoryLucideColor(icon: string): string {
  void icon;
  return "transparent";
}
