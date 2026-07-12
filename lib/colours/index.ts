/**
 * ROVEXO Colour Database — canonical SSOT.
 * Target: 200+ colours with HEX, RGB, slug, aliases.
 */

import { dedupeByKey, rgbString, slugify } from "@/lib/categories/taxonomy-utils";
import { COLOUR_HUE_MATRIX } from "@/lib/colours/hue-matrix";
import { COLOUR_SPECIAL } from "@/lib/colours/special";

export type MarketplaceColour = {
  id: string;
  label: string;
  slug: string;
  swatch: string;
  rgb: string;
  aliases: readonly string[];
  keywords: readonly string[];
};

function buildColour(
  label: string,
  swatch: string,
  aliases: string[] = [],
): MarketplaceColour {
  const trimmed = label.trim();
  return {
    id: trimmed,
    label: trimmed,
    slug: slugify(trimmed),
    swatch,
    rgb: rgbString(swatch),
    aliases,
    keywords: [trimmed.toLowerCase(), ...aliases.map((a) => a.toLowerCase())],
  };
}

function generateColours(): MarketplaceColour[] {
  const colours: MarketplaceColour[] = [];

  for (const [hue, shades] of COLOUR_HUE_MATRIX) {
    for (const shade of shades) {
      const [name, hex] = shade;
      const aliasList = shade.length > 2 ? (shade[2] ?? []) : [];
      colours.push(buildColour(name, hex, [...aliasList]));
    }
    if (!shades.some(([n]) => n === hue)) {
      const defaultHex = shades[0]?.[1] ?? "#808080";
      colours.push(buildColour(hue, defaultHex));
    }
  }

  for (const entry of COLOUR_SPECIAL) {
    const [name, hex] = entry;
    const aliases = entry.length > 2 ? entry[2] : [];
    colours.push(buildColour(name, hex, [...(aliases ?? [])]));
  }

  return dedupeByKey(colours, (c) => c.id.toLowerCase());
}

export const COLOUR_DATABASE: MarketplaceColour[] = generateColours();

export const MARKETPLACE_COLOURS = COLOUR_DATABASE;
export const MARKETPLACE_PREMIUM_COLOURS = COLOUR_DATABASE;
export const MARKETPLACE_BASIC_COLOURS = COLOUR_DATABASE.slice(0, 20);
export const MARKETPLACE_EXPANDED_COLOURS = COLOUR_DATABASE.slice(20);
export const MARKETPLACE_COLOUR_LABELS = COLOUR_DATABASE.map((c) => c.label);
export const COLOUR_COUNT = COLOUR_DATABASE.length;

const FASHION_IDS = new Set([
  "Black", "White", "Grey", "Navy", "Blue", "Red", "Pink", "Green", "Brown", "Beige",
  "Cream", "Burgundy", "Charcoal", "Ivory", "Multicolour", "Animal Print", "Camouflage",
  "Olive", "Tan", "Khaki", "Mustard", "Coral", "Lilac", "Lavender",
]);

const HOME_IDS = new Set([
  "White", "Cream", "Beige", "Grey", "Charcoal", "Navy", "Blue", "Green", "Brown",
  "Taupe", "Sand", "Ivory", "Gold", "Silver", "Multicolour", "Stone", "Mocha", "Sage",
]);

const ELECTRONICS_IDS = new Set([
  "Black", "White", "Silver", "Grey", "Gold", "Rose Gold", "Blue", "Red", "Green", "Graphite",
  "Space Grey", "Midnight", "Starlight", "Product Red",
]);

const VEHICLE_IDS = new Set([
  "Black", "White", "Silver", "Grey", "Blue", "Red", "Green", "Brown", "Gold", "Bronze",
  "Charcoal", "Navy", "Beige", "Pearl", "Metallic Grey",
]);

function filterScope(ids: Set<string>): MarketplaceColour[] {
  return COLOUR_DATABASE.filter((c) => ids.has(c.id));
}

export const MARKETPLACE_COLOURS_BY_SCOPE = {
  default: COLOUR_DATABASE,
  fashion: filterScope(FASHION_IDS),
  home: filterScope(HOME_IDS),
  bedding: filterScope(HOME_IDS),
  pillows: filterScope(HOME_IDS),
  electronics: filterScope(ELECTRONICS_IDS),
  vehicles: filterScope(VEHICLE_IDS),
} as const;

export function validateColour(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return COLOUR_DATABASE.some(
    (c) => c.id.toLowerCase() === lower || c.aliases.some((a) => a.toLowerCase() === lower),
  );
}

export function findColourByName(name: string): MarketplaceColour | undefined {
  const lower = name.trim().toLowerCase();
  return COLOUR_DATABASE.find(
    (c) => c.id.toLowerCase() === lower || c.aliases.some((a) => a.toLowerCase() === lower),
  );
}
