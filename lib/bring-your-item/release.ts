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
 * Bring Your Item — Absolute Final: Migration + Connectors are live hubs.
 * Default ON. Set `NEXT_PUBLIC_BRING_YOUR_ITEM_ENABLED=false` only to kill-switch.
 */
export function isBringYourItemEnabled(): boolean {
  const explicit =
    parseEnabledFlag(process.env.NEXT_PUBLIC_BRING_YOUR_ITEM_ENABLED) ??
    parseEnabledFlag(process.env.BRING_YOUR_ITEM_ENABLED);
  if (explicit !== null) return explicit;

  return true;
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
