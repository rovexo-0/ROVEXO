/** Brands we may extract from filenames, labels, or OCR-like tokens — never invented. */
const KNOWN_BRANDS = [
  "Apple",
  "Samsung",
  "Sony",
  "LG",
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "New Balance",
  "Converse",
  "Vans",
  "Timberland",
  "North Face",
  "Levi's",
  "Coach",
  "Dyson",
  "Bose",
  "JBL",
  "Amazon",
  "Google",
  "Microsoft",
  "Dell",
  "HP",
  "Lenovo",
  "Asus",
  "Acer",
  "Huawei",
  "OnePlus",
  "Xiaomi",
  "Garmin",
  "Fitbit",
  "Rolex",
  "Casio",
  "Seiko",
  "Citizen",
  "Maxi-Cosi",
  "Britax",
  "Graco",
  "Cybex",
  "Joie",
  "Bugaboo",
  "Silver Cross",
  "IKEA",
  "Specialized",
  "Trek",
  "Cannondale",
  "Giant",
  "LEGO",
  "Hasbro",
  "Mattel",
  "Fisher-Price",
  "Philips",
  "Panasonic",
  "TCL",
  "Hisense",
] as const;

const NORMALIZED_BRANDS = KNOWN_BRANDS.map((brand) => ({
  label: brand,
  token: brand.toLowerCase().replace(/[^a-z0-9]+/g, ""),
}));

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function detectBrandFromText(
  sources: string[],
  confidenceScale = 0.94,
): DetectedBrand | null {
  const haystack = sources.join(" ").toLowerCase();
  if (!haystack.trim()) return null;

  for (const entry of NORMALIZED_BRANDS) {
    const spaced = entry.label.toLowerCase();
    if (haystack.includes(spaced) || haystack.includes(entry.token)) {
      return { value: entry.label, confidence: confidenceScale };
    }
  }

  for (const source of sources) {
    const tokens = source.split(/[\s_\-./]+/).filter(Boolean);
    for (const token of tokens) {
      const normalized = normalizeToken(token);
      if (normalized.length < 3) continue;
      const match = NORMALIZED_BRANDS.find((entry) => entry.token === normalized);
      if (match) {
        return { value: match.label, confidence: confidenceScale * 0.95 };
      }
    }
  }

  return null;
}

export type DetectedBrand = {
  value: string;
  confidence: number;
};
