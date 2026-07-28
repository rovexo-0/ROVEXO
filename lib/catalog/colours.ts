/**
 * ROVEXO Catalog Master — Compact Colour Database (ONE reusable list).
 * Never expand into hundreds of shade names.
 */

export type CatalogColour = {
  id: string;
  label: string;
  /** Hex or CSS gradient token for swatches. */
  swatch: string;
};

export const CATALOG_COLOURS: readonly CatalogColour[] = [
  { id: "Black", label: "Black", swatch: "#111111" },
  { id: "White", label: "White", swatch: "#FFFFFF" },
  { id: "Grey", label: "Grey", swatch: "#9CA3AF" },
  { id: "Silver", label: "Silver", swatch: "#C0C0C0" },
  { id: "Gold", label: "Gold", swatch: "#D4AF37" },
  { id: "Beige", label: "Beige", swatch: "#F5F0E6" },
  { id: "Brown", label: "Brown", swatch: "#8B4513" },
  { id: "Red", label: "Red", swatch: "#DC2626" },
  { id: "Pink", label: "Pink", swatch: "#EC4899" },
  { id: "Orange", label: "Orange", swatch: "#F97316" },
  { id: "Yellow", label: "Yellow", swatch: "#EAB308" },
  { id: "Green", label: "Green", swatch: "#16A34A" },
  { id: "Blue", label: "Blue", swatch: "#2563EB" },
  { id: "Purple", label: "Purple", swatch: "#7C3AED" },
  { id: "Multi-colour", label: "Multi-colour", swatch: "linear-gradient(135deg,#ef4444,#3b82f6,#22c55e)" },
  { id: "Transparent", label: "Transparent", swatch: "#E5E7EB" },
  { id: "Other", label: "Other", swatch: "#64748B" },
] as const;

export const CATALOG_COLOUR_COUNT = CATALOG_COLOURS.length;
