/**
 * ROVEXO Catalog Master — fail-closed validation (Absolute Law XXX).
 */

import { CATALOG_MASTER_V1 } from "@/lib/catalog/catalog-master-v1";
import { CATALOG_COLOURS } from "@/lib/catalog/colours";
import { CATALOG_NO_BRAND, CATALOG_BRANDS } from "@/lib/catalog/brands";
import {
  assertProductTypeBrandsIncludeNoBrand,
  getBrandsForProductType,
} from "@/lib/catalog/brands-by-product-type";
import { CATALOG_SECTORS } from "@/lib/catalog/tree";
import {
  resolveProductTypeAttributes,
  assertAttributeBudget,
} from "@/lib/catalog/product-type-attributes";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";

const ILLEGAL_ROOT_SLUGS = new Set<string>([
  ...CATALOG_MASTER_V1.forbiddenRoots,
  "cars",
  "motorbikes",
  "vans-trucks",
  "boats",
  "tractors",
  "aircraft",
  "real-estate",
  "for-sale",
  "to-rent",
  "live-animals",
]);

const COURIER_INCOMPATIBLE_LEAF_SLUGS = new Set([
  "cars",
  "saloon",
  "hatchback",
  "suv",
  "motorbikes",
  "sports-bikes",
  "panel-vans",
  "lorries",
  "motorhomes",
  "caravans",
  "sailing",
  "motor-boats",
  "jet-skis",
  "aircraft",
  "houses",
  "bungalows",
  "commercial-land",
]);

export type CatalogValidationReport = {
  ok: boolean;
  errors: string[];
  stats: {
    categories: number;
    subcategories: number;
    productTypes: number;
    colours: number;
    brands: number;
  };
};

export function validateCatalogMaster(): CatalogValidationReport {
  const errors: string[] = [];
  const categorySlugs = new Set<string>();
  const subcategorySlugs = new Set<string>();
  const productTypeSlugs = new Set<string>();
  let subcategoryCount = 0;
  let productTypeCount = 0;

  for (const sector of CATALOG_SECTORS) {
    if (categorySlugs.has(sector.slug)) {
      errors.push(`Duplicate category: ${sector.slug}`);
    }
    categorySlugs.add(sector.slug);

    if (ILLEGAL_ROOT_SLUGS.has(sector.slug)) {
      errors.push(`Illegal root category: ${sector.slug}`);
    }

    for (const dept of sector.departments) {
      const subKey = `${sector.slug}/${dept.slug}`;
      if (subcategorySlugs.has(subKey)) {
        errors.push(`Duplicate subcategory: ${subKey}`);
      }
      subcategorySlugs.add(subKey);
      subcategoryCount += 1;

      // Law XXX: no nested groups (max depth Category → Subcategory → Product Type)
      if (dept.groups?.length) {
        errors.push(`Extra hierarchy level forbidden under ${subKey}`);
      }

      for (const [name, slug] of dept.items ?? []) {
        const typeKey = `${subKey}/${slug}`;
        if (productTypeSlugs.has(typeKey)) {
          errors.push(`Duplicate product type: ${typeKey}`);
        }
        productTypeSlugs.add(typeKey);
        productTypeCount += 1;

        if (COURIER_INCOMPATIBLE_LEAF_SLUGS.has(slug)) {
          errors.push(`Courier-incompatible product type: ${typeKey}`);
        }

        const attrs = resolveProductTypeAttributes(slug);
        if (!assertAttributeBudget(attrs)) {
          errors.push(`Attribute budget fail for ${slug} (${attrs.length})`);
        }

        const brands = getBrandsForProductType(slug);
        if (!assertProductTypeBrandsIncludeNoBrand(brands)) {
          errors.push(`Missing No Brand for product type: ${slug}`);
        }

        if (!name.trim()) {
          errors.push(`Empty product type name under ${subKey}`);
        }
      }
    }
  }

  const expectedRoots = CANONICAL_ROOT_CATEGORIES.map((r) => r.slug);
  if (CATALOG_SECTORS.length !== expectedRoots.length) {
    errors.push(
      `Expected ${expectedRoots.length} categories, got ${CATALOG_SECTORS.length}`,
    );
  }
  for (const slug of expectedRoots) {
    if (!categorySlugs.has(slug)) {
      errors.push(`Missing canonical root: ${slug}`);
    }
  }

  // Law XXX: Vehicle Parts must be its own root — never under Electronics
  if (!categorySlugs.has("vehicle-parts")) {
    errors.push("Vehicle Parts & Accessories must be a root category");
  }
  const electronics = CATALOG_SECTORS.find((s) => s.slug === "electronics");
  if (electronics?.departments.some((d) => d.slug === "vehicle-parts")) {
    errors.push("Vehicle Parts must NOT belong under Electronics");
  }

  const colourIds = new Set<string>();
  for (const colour of CATALOG_COLOURS) {
    if (colourIds.has(colour.id)) {
      errors.push(`Duplicate colour: ${colour.id}`);
    }
    colourIds.add(colour.id);
  }
  if (CATALOG_COLOURS.length > 24) {
    errors.push(`Colour database too large: ${CATALOG_COLOURS.length}`);
  }

  if (!CATALOG_BRANDS.includes(CATALOG_NO_BRAND)) {
    errors.push('Brands must include "No Brand"');
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      categories: CATALOG_SECTORS.length,
      subcategories: subcategoryCount,
      productTypes: productTypeCount,
      colours: CATALOG_COLOURS.length,
      brands: CATALOG_BRANDS.length,
    },
  };
}
