/**
 * Sell picker presentation enrichment — UI only.
 * Does not change Attribute Engine, draft fields, IDs, validation, or publish.
 */
import type { SelectionOption } from "@/lib/sell/attribute-options";
import { SELL_QUICK_CONDITIONS } from "@/lib/sell/sell-condition-options";
import {
  CANONICAL_PARCEL_SIZES_V1,
  formatCanonicalMaxDimensionsLine,
} from "@/lib/shipping/canonical-parcel-size-v1";

export const SELL_PICKER_PRESENTATION_V1 = {
  version: "1.1",
  scope: "SellOptionPicker / SellCategoryPicker / ParcelPicker visual enrichment only",
  freeze: "CANONICAL_PREMIUM_PICKER_DESIGN_FROZEN",
  notes: "V1.1 — no search on Brand/Material/Colour/Parcel; colour single compact grid; brand logos + dedupe",
} as const;

/** Popular colour grid — presentation order only; ids match Catalog Master. */
export const COLOUR_POPULAR_IDS = [
  "Black",
  "White",
  "Grey",
  "Gold",
  "Red",
  "Blue",
  "Green",
  "Pink",
  "Multi-colour",
  "Other",
] as const;

/** Parcel card presentation — max dimensions from canonical Parcel Size SSOT only. */
function buildParcelCardPresentation(): Record<
  string,
  { title: string; subtitle: string; maxDimensions: string }
> {
  const out: Record<string, { title: string; subtitle: string; maxDimensions: string }> = {};
  for (const def of CANONICAL_PARCEL_SIZES_V1.filter((row) => row.customerFacing)) {
    out[def.id] = {
      title: def.sellLabel,
      subtitle: def.sellSubtitle,
      maxDimensions: formatCanonicalMaxDimensionsLine(def),
    };
  }
  return out;
}

export const PARCEL_CARD_PRESENTATION = buildParcelCardPresentation();

export const PARCEL_PACKAGING_GUIDE =
  "Choose the smallest size that fits your item safely. Accurate size keeps shipping fair for buyers." as const;

/** Official-looking marks via favicon domain (fallback = monogram). */
const BRAND_LOGO_DOMAIN: Record<string, string> = {
  nike: "nike.com",
  adidas: "adidas.com",
  puma: "puma.com",
  "new balance": "newbalance.com",
  converse: "converse.com",
  vans: "vans.com",
  reebok: "reebok.com",
  "under armour": "underarmour.com",
  "the north face": "thenorthface.com",
  "levi's": "levis.com",
  levis: "levis.com",
  "h&m": "hm.com",
  hm: "hm.com",
  zara: "zara.com",
  primark: "primark.com",
  apple: "apple.com",
  samsung: "samsung.com",
  sony: "sony.com",
  ikea: "ikea.com",
  gucci: "gucci.com",
  "louis vuitton": "louisvuitton.com",
  louisvuitton: "louisvuitton.com",
  chanel: "chanel.com",
  dior: "dior.com",
  rolex: "rolex.com",
  casio: "casio.com",
  bosch: "bosch.com",
  makita: "makita.com",
  dewalt: "dewalt.com",
  "de walt": "dewalt.com",
  lego: "lego.com",
  canon: "canon.com",
  nikon: "nikon.com",
  microsoft: "microsoft.com",
  logitech: "logitech.com",
  next: "next.co.uk",
  google: "google.com",
  dell: "dell.com",
  hp: "hp.com",
  lenovo: "lenovo.com",
  bose: "bose.com",
  dyson: "dyson.com",
  jbl: "jbl.com",
  philips: "philips.com",
  nintendo: "nintendo.com",
  uniqlo: "uniqlo.com",
  mango: "mango.com",
  "tommy hilfiger": "tommy.com",
  "calvin klein": "calvinklein.com",
  "ralph lauren": "ralphlauren.com",
  timberland: "timberland.com",
  "dr. martens": "drmartens.com",
  "dr martens": "drmartens.com",
  asos: "asos.com",
  lg: "lg.com",
  huawei: "huawei.com",
  xiaomi: "mi.com",
  anker: "anker.com",
  razer: "razer.com",
  garmin: "garmin.com",
  gopro: "gopro.com",
  patagonia: "patagonia.com",
  lacoste: "lacoste.com",
  jordan: "nike.com",
  skechers: "skechers.com",
  columbia: "columbia.com",
  crocs: "crocs.com",
  decathlon: "decathlon.co.uk",
};

const CONDITION_COPY: Record<string, string> = {
  "New with tags": "Brand new, never worn, with original tags",
  New: "Brand new, never worn, without tags",
  "Like New": "Worn once or twice, like new",
  Excellent: "Minimal signs of wear",
  "Very Good": "Light signs of wear",
  Good: "Visible signs of wear, still good",
  Fair: "Visible signs of wear, still usable",
};

const CONDITION_TONE: Record<string, string> = {
  "New with tags": "#16A34A",
  New: "#22C55E",
  "Like New": "#0EA5E9",
  Excellent: "#9333EA",
  "Very Good": "#EAB308",
  Good: "#F97316",
  Fair: "#F97316",
};

export type SellPickerVisualKind =
  | "brand"
  | "material"
  | "condition"
  | "colour"
  | "compatibility"
  | "generic";

export function resolveSellPickerVisualKind(attributeId: string | undefined, title: string): SellPickerVisualKind {
  const id = (attributeId ?? "").toLowerCase();
  if (id === "brand") return "brand";
  if (id === "material" || id === "covermaterial") return "material";
  if (id === "condition") return "condition";
  if (id === "colour" || id === "color") return "colour";
  if (id === "compatibility") return "compatibility";
  const t = title.toLowerCase();
  if (t.startsWith("brand")) return "brand";
  if (t.startsWith("material")) return "material";
  if (t.startsWith("condition")) return "condition";
  if (t.startsWith("colour") || t.startsWith("color")) return "colour";
  if (t.includes("compatible")) return "compatibility";
  return "generic";
}

export function brandMonogram(label: string): string {
  const clean = label.replace(/[^a-zA-Z0-9]/g, " ").trim();
  if (!clean || /^no brand$/i.test(label)) return "—";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export function brandLogoUrl(label: string): string | null {
  const key = label.trim().toLowerCase();
  const domain = BRAND_LOGO_DOMAIN[key];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function conditionDescription(label: string): string | undefined {
  return CONDITION_COPY[label];
}

export function conditionTone(label: string): string {
  return CONDITION_TONE[label] ?? "#9333EA";
}

export function materialGlyphKey(label: string): string {
  const k = label.trim().toLowerCase();
  if (k.includes("cotton")) return "cotton";
  if (k.includes("polyester") || k.includes("nylon") || k.includes("acrylic") || k.includes("elastane") || k.includes("viscose"))
    return "synthetic";
  if (k.includes("wool") || k.includes("cashmere")) return "wool";
  if (k.includes("silk")) return "silk";
  if (k.includes("linen")) return "linen";
  if (k.includes("leather") || k.includes("suede")) return "leather";
  if (k.includes("denim")) return "denim";
  if (k.includes("metal") || k.includes("steel")) return "metal";
  if (k.includes("wood") || k.includes("oak") || k.includes("pine")) return "wood";
  if (k.includes("glass")) return "glass";
  if (k.includes("foam") || k.includes("memory")) return "foam";
  return "fabric";
}

export type EnrichedPickerOption = SelectionOption & {
  description?: string;
  logoUrl?: string | null;
  monogram?: string;
  tone?: string;
  materialKey?: string;
};

export function enrichPickerOption(
  kind: SellPickerVisualKind,
  option: SelectionOption,
): EnrichedPickerOption {
  if (kind === "brand") {
    return {
      ...option,
      logoUrl: brandLogoUrl(option.label),
      monogram: brandMonogram(option.label),
    };
  }
  if (kind === "condition") {
    return {
      ...option,
      description: conditionDescription(option.label),
      tone: conditionTone(option.label),
    };
  }
  if (kind === "material") {
    return {
      ...option,
      materialKey: materialGlyphKey(option.label),
    };
  }
  if (kind === "colour") {
    return { ...option };
  }
  return { ...option };
}

export function allSectionTitle(kind: SellPickerVisualKind, title: string): string {
  if (kind === "material") return "All materials";
  if (kind === "brand") return "All brands";
  if (kind === "condition") return "All conditions";
  if (kind === "colour") return "All colours";
  return `All ${title.replace(/\s*\(.*?\)\s*/g, "").trim()}`.trim();
}

/** Ensures known quick conditions keep presentation copy even if options arrive as plain labels. */
export function assertConditionPresentationCoverage(): boolean {
  return SELL_QUICK_CONDITIONS.every((c) => Boolean(CONDITION_COPY[c]));
}
