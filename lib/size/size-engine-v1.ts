/**
 * ROVEXO Size Engine v1.0 — Canonical SSOT
 *
 * OWNER CERTIFIED UI LOCK · One universal Size Selector · No duplicates
 * Category determines Clothing vs Footwear automatically (no toggle).
 */

export const SIZE_ENGINE_V1 = {
  version: "1.0",
  status: "OWNER_CERTIFIED_UI_LOCK",
  customMaxLength: 50,
  /** Purple selection flash before auto-return (Owner: ≈150–200 ms). */
  autoReturnMs: 180,
  title: "Select size",
  subtitle: "Choose the right fit for you",
} as const;

export type SizeEngineKind = "clothing" | "footwear" | "kids" | "rings" | "generic";

export type SizeType = "standard" | "custom";

/** Persisted + View Item contract (encoded into products.size display string). */
export type SizeSelectionV1 = {
  size_type: SizeType;
  /** Standard: "S" | "UK 5" | kids/ring id. Custom: exact user entry. */
  size_value: string;
  /** EU numeric string when known; null for custom / unmapped. */
  eu_size: string | null;
  /** Exact View Item / listing display string. */
  display: string;
};

export type ClothingSizeId = "XXS" | "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";

export type ClothingSizeRow = {
  id: ClothingSizeId;
  label: ClothingSizeId;
  uk: string;
  eu: string;
  secondary: string;
};

export type FootwearSizeRow = {
  id: string;
  label: string;
  uk: string;
  eu: string;
  secondary: string;
};

export type SimpleSizeRow = {
  id: string;
  label: string;
  secondary?: string;
};

/**
 * Clothing alpha → UK / EU (Owner mockup: S = UK 6 • EU 34).
 * Scale anchored on that certified pair.
 */
export const SIZE_ENGINE_CLOTHING_ROWS: readonly ClothingSizeRow[] = [
  { id: "XXS", label: "XXS", uk: "2", eu: "30", secondary: "UK 2 • EU 30" },
  { id: "XS", label: "XS", uk: "4", eu: "32", secondary: "UK 4 • EU 32" },
  { id: "S", label: "S", uk: "6", eu: "34", secondary: "UK 6 • EU 34" },
  { id: "M", label: "M", uk: "8", eu: "36", secondary: "UK 8 • EU 36" },
  { id: "L", label: "L", uk: "10", eu: "38", secondary: "UK 10 • EU 38" },
  { id: "XL", label: "XL", uk: "12", eu: "40", secondary: "UK 12 • EU 40" },
  { id: "XXL", label: "XXL", uk: "14", eu: "42", secondary: "UK 14 • EU 42" },
  { id: "XXXL", label: "XXXL", uk: "16", eu: "44", secondary: "UK 16 • EU 44" },
] as const;

/** Footwear UK 3–15 → EU (Owner mockup: UK 5 • EU 38 ⇒ EU = UK + 33). */
export const SIZE_ENGINE_FOOTWEAR_ROWS: readonly FootwearSizeRow[] = Array.from(
  { length: 13 },
  (_, index) => {
    const uk = 3 + index;
    const eu = uk + 33;
    return {
      id: `UK ${uk}`,
      label: `UK ${uk}`,
      uk: String(uk),
      eu: String(eu),
      secondary: `UK ${uk} • EU ${eu}`,
    };
  },
);

export const SIZE_ENGINE_KIDS_ROWS: readonly SimpleSizeRow[] = [
  { id: "0–3 m", label: "0–3 m" },
  { id: "3–6 m", label: "3–6 m" },
  { id: "6–12 m", label: "6–12 m" },
  { id: "12–18 m", label: "12–18 m" },
  { id: "18–24 m", label: "18–24 m" },
  { id: "2–3 y", label: "2–3 y" },
  { id: "3–4 y", label: "3–4 y" },
  { id: "4–5 y", label: "4–5 y" },
  { id: "5–6 y", label: "5–6 y" },
  { id: "7–8 y", label: "7–8 y" },
  { id: "9–10 y", label: "9–10 y" },
  { id: "11–12 y", label: "11–12 y" },
  { id: "13–14 y", label: "13–14 y" },
] as const;

export const SIZE_ENGINE_RING_ROWS: readonly SimpleSizeRow[] = [
  "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
].map((id) => ({ id, label: id, secondary: `UK ${id}` }));

export function clothingSectionTitle(): string {
  return "Clothing size (UK / EU)";
}

export function footwearSectionTitle(): string {
  return "Footwear size (UK / EU)";
}

export function kidsSectionTitle(): string {
  return "Kids & baby size";
}

export function ringsSectionTitle(): string {
  return "Ring size (UK)";
}

export function genericSectionTitle(): string {
  return "Size";
}

export function sectionTitleForKind(kind: SizeEngineKind): string {
  switch (kind) {
    case "clothing":
      return clothingSectionTitle();
    case "footwear":
      return footwearSectionTitle();
    case "kids":
      return kidsSectionTitle();
    case "rings":
      return ringsSectionTitle();
    default:
      return genericSectionTitle();
  }
}
