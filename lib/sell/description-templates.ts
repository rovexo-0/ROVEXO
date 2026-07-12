import type { FlatCategoryPath } from "@/lib/categories/types";
import { leafSlugFromFlatPath } from "@/lib/categories/types";
import type { SupportedDescriptionLocale } from "@/lib/sell/marketplace-knowledge-base";

export type DescriptionTemplateContext = {
  productLabel: string;
  brand?: string | null;
  color?: string | null;
  material?: string | null;
  size?: string | null;
  condition?: string | null;
  categoryPath: FlatCategoryPath;
  locale?: SupportedDescriptionLocale;
};

type TemplateStrings = {
  condition: string;
  colour: string;
  brand: string;
  size: string;
  material: string;
  everydayUse: string;
  seePhotos: string;
};

const TEMPLATE_STRINGS: Record<SupportedDescriptionLocale, TemplateStrings> = {
  en: {
    condition: "Condition",
    colour: "Colour",
    brand: "Brand",
    size: "Size",
    material: "Material",
    everydayUse: "Suitable for everyday use.",
    seePhotos: "Please see all photos for full details.",
  },
  ro: {
    condition: "Stare",
    colour: "Culoare",
    brand: "Brand",
    size: "Mărime",
    material: "Material",
    everydayUse: "Potrivit pentru utilizare zilnică.",
    seePhotos: "Vedeți toate fotografiile pentru detalii complete.",
  },
  fr: {
    condition: "État",
    colour: "Couleur",
    brand: "Marque",
    size: "Taille",
    material: "Matière",
    everydayUse: "Convient pour un usage quotidien.",
    seePhotos: "Veuillez consulter toutes les photos pour plus de détails.",
  },
  de: {
    condition: "Zustand",
    colour: "Farbe",
    brand: "Marke",
    size: "Größe",
    material: "Material",
    everydayUse: "Geeignet für den täglichen Gebrauch.",
    seePhotos: "Bitte alle Fotos für vollständige Details ansehen.",
  },
  es: {
    condition: "Estado",
    colour: "Color",
    brand: "Marca",
    size: "Talla",
    material: "Material",
    everydayUse: "Adecuado para el uso diario.",
    seePhotos: "Consulte todas las fotos para ver todos los detalles.",
  },
  it: {
    condition: "Condizione",
    colour: "Colore",
    brand: "Marca",
    size: "Taglia",
    material: "Materiale",
    everydayUse: "Adatto all'uso quotidiano.",
    seePhotos: "Consultare tutte le foto per i dettagli completi.",
  },
};

const CATEGORY_CLOSING_OVERRIDES: Record<string, keyof TemplateStrings> = {
  pillows: "everydayUse",
  bedding: "everydayUse",
  mattresses: "everydayUse",
  shoes: "everydayUse",
  trainers: "everydayUse",
  phones: "everydayUse",
  tablets: "everydayUse",
};

function categoryClosingKey(categoryPath: FlatCategoryPath): keyof TemplateStrings {
  const leaf = leafSlugFromFlatPath(categoryPath);
  return CATEGORY_CLOSING_OVERRIDES[leaf] ?? "everydayUse";
}

/** Build description from known facts only — never invent or guess. */
export function buildCategoryDescriptionTemplate(context: DescriptionTemplateContext): string {
  const locale = context.locale ?? "en";
  const strings = TEMPLATE_STRINGS[locale];
  const lines: string[] = [];

  const headline = context.productLabel.trim();
  if (headline) {
    lines.push(headline.endsWith(".") ? headline : `${headline}.`);
  }

  if (context.condition?.trim()) {
    lines.push(`${strings.condition}: ${context.condition.trim()}.`);
  }
  if (context.color?.trim()) {
    lines.push(`${strings.colour}: ${context.color.trim()}.`);
  }
  if (context.brand?.trim()) {
    lines.push(`${strings.brand}: ${context.brand.trim()}.`);
  }
  if (context.material?.trim()) {
    lines.push(`${strings.material}: ${context.material.trim()}.`);
  }
  if (context.size?.trim()) {
    lines.push(`${strings.size}: ${context.size.trim()}.`);
  }

  lines.push(strings[categoryClosingKey(context.categoryPath)]);
  lines.push(strings.seePhotos);

  return lines.join("\n\n");
}
