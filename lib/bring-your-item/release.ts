import { BRING_YOUR_ITEM_PATH, LEGACY_BRING_YOUR_ITEM_PATHS } from "@/lib/bring-your-item/paths";
import type { NavLink } from "@/lib/navigation/map";
import type { MobileTile } from "@/lib/mobile-ui/types";

const BYI_HREFS = new Set<string>([BRING_YOUR_ITEM_PATH, ...LEGACY_BRING_YOUR_ITEM_PATHS]);

function parseEnabledFlag(value: string | undefined): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") return true;
  if (normalized === "0" || normalized === "false" || normalized === "no") return false;
  return null;
}

/**
 * Bring Your Item release gate — independent from marketplace core v1.0.
 *
 * Production default: disabled until BYI achieves PRODUCTION READY certification.
 * Set `NEXT_PUBLIC_BRING_YOUR_ITEM_ENABLED=true` (or `BRING_YOUR_ITEM_ENABLED=true`)
 * only after real eBay validation, full Playwright E2E, and production verification.
 */
export function isBringYourItemEnabled(): boolean {
  const explicit =
    parseEnabledFlag(process.env.NEXT_PUBLIC_BRING_YOUR_ITEM_ENABLED) ??
    parseEnabledFlag(process.env.BRING_YOUR_ITEM_ENABLED);
  if (explicit !== null) return explicit;

  if (process.env.PLAYWRIGHT_E2E === "1" || process.env.VITEST === "true") return true;
  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

export function isBringYourItemHref(href: string): boolean {
  return BYI_HREFS.has(href);
}

export function filterBringYourItemNavLinks(links: NavLink[]): NavLink[] {
  if (isBringYourItemEnabled()) return links;
  return links.filter((link) => !isBringYourItemHref(link.href));
}

export function filterBringYourItemTiles(tiles: MobileTile[]): MobileTile[] {
  if (isBringYourItemEnabled()) return tiles;
  return tiles.filter((tile) => !isBringYourItemHref(tile.href));
}
