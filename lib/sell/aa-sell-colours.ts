/**
 * Absolute Authority Sell — Colours from Catalog Master SSOT.
 * Presentation / Sell UI unchanged; data source only.
 */

import { CATALOG_COLOURS, type CatalogColour } from "@/lib/catalog/colours";

export type AaSellColour = {
  id: string;
  label: string;
  swatch: string;
};

export const AA_SELL_COLOURS: readonly AaSellColour[] = CATALOG_COLOURS.map(
  (colour: CatalogColour) => ({
    id: colour.id,
    label: colour.label,
    swatch: colour.swatch,
  }),
);

export const AA_SELL_COLOUR_COUNT = AA_SELL_COLOURS.length;
