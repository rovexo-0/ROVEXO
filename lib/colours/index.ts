/**
 * ROVEXO Colour Database — Catalog Master SSOT (compact, reusable).
 * Never expand into hundreds of shade names.
 */

import { CATALOG_COLOURS } from "@/lib/catalog/colours";
import { rgbString, slugify } from "@/lib/categories/taxonomy-utils";

export type MarketplaceColour = {
  id: string;
  label: string;
  slug: string;
  swatch: string;
  rgb: string;
  aliases: readonly string[];
  keywords: readonly string[];
};

export const COLOUR_DATABASE: MarketplaceColour[] = CATALOG_COLOURS.map((colour) => ({
  id: colour.id,
  label: colour.label,
  slug: slugify(colour.label),
  swatch: colour.swatch,
  rgb: colour.swatch.startsWith("#") ? rgbString(colour.swatch) : "rgb(128, 128, 128)",
  aliases: [],
  keywords: [colour.label.toLowerCase()],
}));

export const MARKETPLACE_COLOURS = COLOUR_DATABASE;
export const MARKETPLACE_PREMIUM_COLOURS = COLOUR_DATABASE;
export const MARKETPLACE_BASIC_COLOURS = COLOUR_DATABASE;
export const MARKETPLACE_EXPANDED_COLOURS = COLOUR_DATABASE;
export const MARKETPLACE_COLOUR_LABELS = COLOUR_DATABASE.map((c) => c.label);
export const COLOUR_COUNT = COLOUR_DATABASE.length;

export const MARKETPLACE_COLOURS_BY_SCOPE = {
  fashion: COLOUR_DATABASE,
  home: COLOUR_DATABASE,
  electronics: COLOUR_DATABASE,
  vehicles: COLOUR_DATABASE,
  default: COLOUR_DATABASE,
} as const;

export function validateColour(name: string): boolean {
  const key = name.trim().toLowerCase();
  return COLOUR_DATABASE.some((c) => c.id.toLowerCase() === key || c.label.toLowerCase() === key);
}

export function findColourByName(name: string): MarketplaceColour | undefined {
  const key = name.trim().toLowerCase();
  return COLOUR_DATABASE.find(
    (c) => c.id.toLowerCase() === key || c.label.toLowerCase() === key || c.slug === slugify(name),
  );
}
