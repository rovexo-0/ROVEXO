import type { CategoryMatchResult } from "@/lib/ai-camera/types";

const MAX_TITLE_LENGTH = 80;

export type ContentContext = {
  productType: string;
  brand?: string | null;
  color?: string | null;
  size?: string | null;
  model?: string | null;
  material?: string | null;
  condition?: string | null;
};

function truncateTitle(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_TITLE_LENGTH - 1).trim()}…`;
}

function joinTitleParts(parts: Array<string | null | undefined>): string {
  return truncateTitle(parts.filter(Boolean).join(" "));
}

export function buildUkTitleSuggestions(context: ContentContext): string[] {
  const { productType, brand, color, size, model, material, condition } = context;
  const baseBrand = brand?.trim() || null;
  const titles = new Set<string>();

  titles.add(
    joinTitleParts([baseBrand, model, productType, color, size, condition && `– ${condition}`]),
  );
  titles.add(joinTitleParts([baseBrand, productType, color, size]));
  titles.add(joinTitleParts([productType, color, material, size]));
  titles.add(joinTitleParts([baseBrand, productType, condition]));
  titles.add(joinTitleParts([productType, size, color]));

  return [...titles]
    .filter((title) => title.length >= 3)
    .slice(0, 3);
}

export type DescriptionContext = ContentContext & {
  defects?: string[];
  accessories?: string[];
};

export function buildDescriptionSuggestions(context: DescriptionContext): string[] {
  const sentences: string[] = [];
  const productLabel = context.productType.toLowerCase();

  if (context.productType) {
    sentences.push(`Selling a ${productLabel}.`);
  }
  if (context.brand) {
    sentences.push(`Brand: ${context.brand}.`);
  }
  if (context.color) {
    sentences.push(`Colour: ${context.color}.`);
  }
  if (context.material) {
    sentences.push(`Material: ${context.material}.`);
  }
  if (context.size) {
    sentences.push(`Size: ${context.size}.`);
  }
  if (context.model) {
    sentences.push(`Model: ${context.model}.`);
  }
  if (context.accessories?.length) {
    sentences.push(`Includes ${context.accessories.join(", ")}.`);
  }
  if (context.defects?.length) {
    sentences.push(`${context.defects.join("; ")} visible in the photos.`);
  }

  const primary = sentences.join(" ");
  const descriptions = new Set<string>();

  if (primary.trim().length >= 10) {
    descriptions.add(primary);
  }

  const short = sentences.slice(0, 3).join(" ");
  if (short.trim().length >= 10) {
    descriptions.add(short);
  }

  const factual = [
    context.brand ? `${context.brand} ${context.productType}.` : context.productType,
    context.color ? `${context.color}.` : null,
    context.size ? `Size ${context.size}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (factual.trim().length >= 10) {
    descriptions.add(factual);
  }

  return [...descriptions].slice(0, 3);
}

export function buildBrandSuggestions(brand: string | null | undefined): string[] {
  if (brand?.trim()) return [brand.trim()];
  return [];
}

export function topCategorySuggestions(matches: CategoryMatchResult[]): CategoryMatchResult[] {
  return matches.slice(0, 5);
}
