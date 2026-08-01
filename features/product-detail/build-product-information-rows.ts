/**
 * Builds Product Information rows for View Item (FINAL PRODUCT INFORMATION CERTIFICATION).
 *
 * Dynamic field engine — configurable map, render only when populated.
 * Order locked by PRODUCT_INFORMATION_FIELD_MAP_V1.
 * Stock lives only under price (ProductStockStatus) — never duplicated here.
 */
import { formatInboxRelativeTime } from "@/lib/messages/utils";
import type { ProductDetail } from "@/lib/products/types";
import type { ProductInfoRow } from "@/features/product-detail/ProductInformationRows";
import { PRODUCT_INFORMATION_FIELD_MAP_V1 } from "@/lib/product-detail/product-information-field-map-v1";
import { resolveProductInformationValuesV1 } from "@/lib/product-detail/parse-listing-attribute-notes-v1";

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildProductInformationRows(product: ProductDetail): ProductInfoRow[] {
  const attrs = resolveProductInformationValuesV1({
    colour: product.colour,
    material: product.material,
    size: product.size,
    storage: product.storage,
    network: product.network,
    season: product.season,
    compatibility: product.compatibility,
    description: product.description,
  });

  const categoryLabel = product.categoryBreadcrumbs?.length
    ? product.categoryBreadcrumbs.map((crumb) => crumb.name).join(" · ")
    : null;

  const values: Record<string, string | null> = {
    category: nonEmpty(categoryLabel),
    brand: nonEmpty(product.brand),
    condition: nonEmpty(product.condition),
    material: nonEmpty(attrs.material),
    colour: nonEmpty(attrs.colour),
    size: nonEmpty(attrs.size),
    storage: nonEmpty(attrs.storage),
    network: nonEmpty(attrs.network),
    season: nonEmpty(attrs.season),
    compatibility: nonEmpty(attrs.compatibility),
    uploaded: product.createdAt ? nonEmpty(formatInboxRelativeTime(product.createdAt)) : null,
  };

  const rows: ProductInfoRow[] = [];

  for (const field of PRODUCT_INFORMATION_FIELD_MAP_V1) {
    const value = values[field.id];
    if (!value) continue;

    if (field.id === "category") {
      rows.push({
        id: field.id,
        label: field.label,
        value,
        href: product.categoryId
          ? `/search?category=${encodeURIComponent(product.categoryId)}`
          : null,
        valueTone: product.categoryId ? "primary" : "default",
      });
      continue;
    }

    if (field.id === "brand") {
      rows.push({
        id: field.id,
        label: field.label,
        value,
        href: `/search?q=${encodeURIComponent(value)}`,
        valueTone: "primary",
      });
      continue;
    }

    rows.push({
      id: field.id,
      label: field.label,
      value,
    });
  }

  return rows;
}
