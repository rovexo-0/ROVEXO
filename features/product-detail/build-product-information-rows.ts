/**
 * Builds Product Information rows for View Item (Attribute Engine v1.0).
 *
 * Rows come from Category Attribute Schema + platform fields (Category, Uploaded).
 * Never hardcode Size / Brand / Material. Missing value → skip. Unsupported → skip.
 */
import { formatInboxRelativeTime } from "@/lib/messages/utils";
import type { ProductDetail } from "@/lib/products/types";
import type { ProductInfoRow } from "@/features/product-detail/ProductInformationRows";
import { resolveProductInformationValuesV1 } from "@/lib/product-detail/parse-listing-attribute-notes-v1";
import {
  leafSlugFromCategoryBreadcrumbs,
  orderedViewItemSchemaFields,
} from "@/lib/product-detail/view-item-attribute-engine-v1";
import { formatSizeForViewItem } from "@/lib/size";
import type { ProductInformationFieldId } from "@/lib/product-detail/product-information-field-map-v1";

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildProductInformationRows(product: ProductDetail): ProductInfoRow[] {
  const leafSlug = leafSlugFromCategoryBreadcrumbs(product.categoryBreadcrumbs);
  const schemaFields = orderedViewItemSchemaFields(leafSlug);

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

  const values: Partial<Record<ProductInformationFieldId, string | null>> = {
    category: nonEmpty(categoryLabel),
    brand: nonEmpty(product.brand),
    condition: nonEmpty(product.condition),
    material: nonEmpty(attrs.material),
    colour: nonEmpty(attrs.colour),
    size: nonEmpty(formatSizeForViewItem(attrs.size) ?? attrs.size),
    storage: nonEmpty(attrs.storage),
    network: nonEmpty(attrs.network),
    season: nonEmpty(attrs.season),
    compatibility: nonEmpty(attrs.compatibility),
    uploaded: product.createdAt ? nonEmpty(formatInboxRelativeTime(product.createdAt)) : null,
  };

  const rows: ProductInfoRow[] = [];

  const categoryValue = values.category;
  if (categoryValue) {
    rows.push({
      id: "category",
      label: "Category",
      value: categoryValue,
      href: product.categoryId
        ? `/search?category=${encodeURIComponent(product.categoryId)}`
        : null,
      valueTone: product.categoryId ? "primary" : "default",
    });
  }

  for (const field of schemaFields) {
    const value = values[field.fieldId];
    if (!value) continue;

    if (field.fieldId === "brand") {
      rows.push({
        id: field.fieldId,
        label: field.label,
        value,
        href: `/search?q=${encodeURIComponent(value)}`,
        valueTone: "primary",
      });
      continue;
    }

    rows.push({
      id: field.fieldId,
      label: field.label,
      value,
    });
  }

  const uploadedValue = values.uploaded;
  if (uploadedValue) {
    rows.push({
      id: "uploaded",
      label: "Uploaded",
      value: uploadedValue,
    });
  }

  return rows;
}
