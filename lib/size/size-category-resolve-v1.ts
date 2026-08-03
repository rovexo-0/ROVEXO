/**
 * Size Engine v1.0 — automatic category → Clothing / Footwear / … (no toggle).
 */

import type { FlatCategoryPath } from "@/lib/categories/types";
import { catalogSizeAttributeDef } from "@/lib/sell/catalog-size-visibility-v1";
import type { SizeEngineKind } from "@/lib/size/size-engine-v1";

function leafSlug(categoryPath: FlatCategoryPath | null): string {
  if (!categoryPath) return "";
  return (
    categoryPath.childCategorySlug?.trim() ||
    categoryPath.segments[categoryPath.segments.length - 1]?.slug?.trim() ||
    categoryPath.subcategorySlug?.trim() ||
    categoryPath.categorySlug?.trim() ||
    ""
  ).toLowerCase();
}

function pathText(categoryPath: FlatCategoryPath | null): string {
  if (!categoryPath) return "";
  return [
    categoryPath.categorySlug,
    categoryPath.subcategorySlug,
    categoryPath.childCategorySlug,
    categoryPath.categoryName,
    categoryPath.subcategoryName,
    categoryPath.childCategoryName,
    ...(categoryPath.segments ?? []).map((segment) => segment.slug),
    ...(categoryPath.segments ?? []).map((segment) => segment.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Resolve Size Engine kind from Sell listing category.
 * Seller never chooses Clothing / Footwear manually.
 */
export function resolveSizeEngineKind(categoryPath: FlatCategoryPath | null): SizeEngineKind {
  const def = catalogSizeAttributeDef(categoryPath);
  switch (def?.options) {
    case "shoeSizes":
      return "footwear";
    case "kidsSizes":
      return "kids";
    case "ringSizes":
      return "rings";
    case "clothingSizes":
      return "clothing";
    default:
      break;
  }

  const text = `${leafSlug(categoryPath)} ${pathText(categoryPath)}`;
  if (
    /\b(shoe|shoes|boot|boots|trainer|trainers|sneaker|sneakers|footwear|sandal|heels|loafer)\b/.test(
      text,
    )
  ) {
    return "footwear";
  }
  if (/\b(ring|rings)\b/.test(text)) return "rings";
  if (/\b(kid|kids|baby|infant|toddler|child)\b/.test(text)) return "kids";
  if (
    /\b(dress|dresses|shirt|shirts|trouser|trousers|jean|jeans|jacket|coat|top|tops|jumper|hoodie|skirt|shorts|clothing|fashion|apparel|uniform|glove|gloves|hat|hats|belt|belts|sportswear|motorcycle|protective)\b/.test(
      text,
    )
  ) {
    return "clothing";
  }

  // Size required but unknown taxonomy → clothing list + custom (never empty).
  return def ? "clothing" : "generic";
}
