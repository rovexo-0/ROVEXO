/**
 * ROVEXO Catalog Master — Canonical Attribute Name Registry V4 (COD SÂNGE).
 * DATA ONLY — Pattern / Style / Colour labels normalize to one official spelling globally.
 * Leaf categories continue to reference official names (no UI change).
 */

export function normalizeAttributeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export const CANONICAL_PATTERN_ALIAS_MAP: Readonly<Record<string, string>> = {
  solid: "Solid",
  quilted: "Quilted",
  textured: "Textured",
  striped: "Striped",
  stripes: "Striped",
  floral: "Floral",
  geometric: "Geometric",
  embroidered: "Embroidered",
  embroidery: "Embroidered",
  jacquard: "Jacquard",
  damask: "Damask",
  checked: "Checked",
  check: "Checked",
  abstract: "Abstract",
  "hotel stripe": "Hotel Stripe",
  "piping edge": "Piping Edge",
  "mesh panel": "Mesh Panel",
  "jersey knit": "Jersey Knit",
  "two-tone": "Two-Tone",
  "two tone": "Two-Tone",
  boucle: "Bouclé",
  "bouclé": "Bouclé",
  velvet: "Velvet",
};

export const CANONICAL_STYLE_ALIAS_MAP: Readonly<Record<string, string>> = {
  "u-shape": "U-Shape",
  "u shape": "U-Shape",
  "c-shape": "C-Shape",
  "c shape": "C-Shape",
  "j-shape": "J-Shape",
  "j shape": "J-Shape",
  "g-shape": "G-Shape",
  "g shape": "G-Shape",
  "v-shaped": "V-Shaped",
  "v shaped": "V-Shaped",
  contoured: "Contoured",
  cervical: "Cervical",
  modern: "Modern",
  scandinavian: "Scandinavian",
  coastal: "Coastal",
  farmhouse: "Farmhouse",
  luxury: "Luxury",
  inflatable: "Inflatable",
  "classic bed pillow": "Classic Bed Pillow",
  "hotel style": "Hotel Style",
  "firm support": "Firm Support",
  "soft plush": "Soft Plush",
  "full body": "Full Body",
  "scatter cushion": "Scatter Cushion",
  lumbar: "Lumbar",
};

function resolveFromMap(
  raw: string,
  map: Readonly<Record<string, string>>,
): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const key = normalizeAttributeKey(trimmed);
  return map[key] ?? trimmed.replace(/\s+/g, " ").trim();
}

export function resolveCanonicalPatternName(raw: string): string {
  return resolveFromMap(raw, CANONICAL_PATTERN_ALIAS_MAP);
}

export function resolveCanonicalStyleName(raw: string): string {
  return resolveFromMap(raw, CANONICAL_STYLE_ALIAS_MAP);
}

export function canonicalizeAttributeList(
  values: readonly string[],
  resolve: (raw: string) => string,
): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const official = resolve(value);
    if (!official) continue;
    const key = normalizeAttributeKey(official);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(official);
  }
  return out;
}
