/**
 * Enterprise marketplace colour database — SSOT for Sell attributes and filters.
 */

export type MarketplaceColour = {
  id: string;
  label: string;
  swatch: string;
};

export const MARKETPLACE_COLOURS: MarketplaceColour[] = [
  { id: "Black", label: "Black", swatch: "#111827" },
  { id: "White", label: "White", swatch: "#f9fafb" },
  { id: "Grey", label: "Grey", swatch: "#9ca3af" },
  { id: "Silver", label: "Silver", swatch: "#cbd5e1" },
  { id: "Charcoal", label: "Charcoal", swatch: "#374151" },
  { id: "Beige", label: "Beige", swatch: "#e7d8b1" },
  { id: "Cream", label: "Cream", swatch: "#fef3c7" },
  { id: "Brown", label: "Brown", swatch: "#92400e" },
  { id: "Tan", label: "Tan", swatch: "#d2b48c" },
  { id: "Red", label: "Red", swatch: "#ef4444" },
  { id: "Burgundy", label: "Burgundy", swatch: "#7f1d1d" },
  { id: "Rose", label: "Rose", swatch: "#fb7185" },
  { id: "Pink", label: "Pink", swatch: "#ec4899" },
  { id: "Orange", label: "Orange", swatch: "#f59e0b" },
  { id: "Yellow", label: "Yellow", swatch: "#eab308" },
  { id: "Gold", label: "Gold", swatch: "#d4af37" },
  { id: "Green", label: "Green", swatch: "#22c55e" },
  { id: "Olive", label: "Olive", swatch: "#84cc16" },
  { id: "Teal", label: "Teal", swatch: "#14b8a6" },
  { id: "Blue", label: "Blue", swatch: "#2563eb" },
  { id: "Navy", label: "Navy", swatch: "#1e3a8a" },
  { id: "Sky Blue", label: "Sky Blue", swatch: "#38bdf8" },
  { id: "Purple", label: "Purple", swatch: "#7c3aed" },
  { id: "Lilac", label: "Lilac", swatch: "#c4b5fd" },
  { id: "Bronze", label: "Bronze", swatch: "#a16207" },
  { id: "Copper", label: "Copper", swatch: "#b45309" },
  { id: "Transparent", label: "Transparent", swatch: "#e5e7eb" },
  { id: "Multicolour", label: "Multicolour", swatch: "#a3a3a3" },
  { id: "Camouflage", label: "Camouflage", swatch: "#4d7c0f" },
  { id: "Animal Print", label: "Animal Print", swatch: "#78716c" },
];

export const MARKETPLACE_COLOUR_LABELS = MARKETPLACE_COLOURS.map((colour) => colour.label);
