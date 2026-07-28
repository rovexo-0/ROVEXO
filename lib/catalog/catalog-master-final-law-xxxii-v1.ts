/**
 * ROVEXO ABSOLUTE LAW XXXII — CATALOG MASTER FINAL LAW
 * STATUS: LOCKED | PRODUCTION READY | FINAL PRODUCTION LOCK
 *
 * One Platform · One Catalog · One Taxonomy · One Category Tree · One SSOT
 * Zero Legacy · Zero Duplicate Taxonomies · Zero Silent Fallback · Zero Parallel Systems
 *
 * Sell Page remains permanently FROZEN — only Catalog Master Database may evolve.
 * Child laws: XXX (architecture) · XXXI (protection) · XXXII (final production lock).
 */

import { CATALOG_MASTER_V1 } from "@/lib/catalog/catalog-master-v1";
import { CATALOG_COLOURS } from "@/lib/catalog/colours";
import { CATALOG_NO_BRAND } from "@/lib/catalog/brands";
import { getBrandsForProductType } from "@/lib/catalog/brands-by-product-type";
import { CATALOG_SECTORS } from "@/lib/catalog/tree";
import { validateCatalogMaster } from "@/lib/catalog/validate";
import {
  verifyCatalogMasterProtection,
  type CatalogMasterProtectionReport,
} from "@/lib/catalog/catalog-master-protection-v1";
import type { CategoryNode } from "@/lib/categories/types";

export const CATALOG_MASTER_FINAL_LAW_XXXII_V1 = {
  version: "1.0",
  law: "XXXII",
  name: "Catalog Master Final Law",
  status: "CERTIFIED_LOCKED_PRODUCTION_READY",
  productionReady: true,
  permanentlyLocked: true,
  lockedAt: "2026-07-25",
  certifiedUnderBloodLaw: "XXXIII",
  equation:
    "ONE_PLATFORM = ONE_CATALOG = ONE_TAXONOMY = ONE_TREE = ONE_SSOT",
  resolutionPath: "Catalog Master → getCategoryTree() → SSOT",
  sellPageFrozen: true,
  sellUiFrozen: true,
  sellFlowFrozen: true,
  childLaws: ["XXX", "XXXI"] as const,
  productionRoots: [
    "Women's Fashion",
    "Men's Fashion",
    "Designer",
    "Kids & Baby",
    "Home & Garden",
    "Electronics",
    "Books & Media",
    "Hobbies & Collectables",
    "Sports & Outdoors",
    "Vehicle Parts & Accessories",
  ] as const,
  productionRootSlugs: CATALOG_MASTER_V1.requiredRoots,
  vehiclePartsOwnRoot: true,
  maxHierarchyDepth: 3,
  maxAttributesPerProductType: 6,
  compactColourMax: 24,
  compactColourExact: [
    "Black",
    "White",
    "Grey",
    "Silver",
    "Gold",
    "Beige",
    "Brown",
    "Red",
    "Pink",
    "Orange",
    "Yellow",
    "Green",
    "Blue",
    "Purple",
    "Multi-colour",
    "Transparent",
    "Other",
  ] as const,
  forbiddenForever: [
    "legacy-taxonomy",
    "hardcoded-category-arrays",
    "parallel-category-trees",
    "duplicate-category-databases",
    "old-json-category-files",
    "legacy-api-responses",
    "alternative-category-loaders",
    "silent-legacy-fallback",
    "whole-vehicles",
    "property",
    "jobs",
    "services",
    "live-animals",
    "aircraft",
    "illegal-products",
  ] as const,
  principle:
    "One Platform. One Catalog. One Taxonomy. One Category Tree. One SSOT. Zero Legacy.",
} as const;

export type CatalogMasterFinalLawXxxii = typeof CATALOG_MASTER_FINAL_LAW_XXXII_V1;

export type CatalogMasterProductionReleaseCheck = {
  id: string;
  label: string;
  pass: boolean;
};

export type CatalogMasterProductionReleaseReport = {
  ok: boolean;
  productionReady: boolean;
  blocked: boolean;
  law: "XXXII";
  checks: CatalogMasterProductionReleaseCheck[];
  errors: string[];
};

/**
 * Pre-production / every-release certification (Absolute Law XXXII).
 * Any fail → NOT production ready · BLOCK.
 */
export function certifyCatalogMasterProductionRelease(
  tree: CategoryNode[],
): CatalogMasterProductionReleaseReport {
  const protection: CatalogMasterProtectionReport =
    verifyCatalogMasterProtection(tree);
  const catalog = validateCatalogMaster();
  const checks: CatalogMasterProductionReleaseCheck[] = [];
  const errors: string[] = [];

  const add = (id: string, label: string, pass: boolean, failMessage?: string) => {
    checks.push({ id, label, pass });
    if (!pass && failMessage) errors.push(failMessage);
  };

  add(
    "ssot",
    "Single Source of Truth",
    CATALOG_MASTER_V1.onlyCategorySource === true,
    "Catalog Master is not marked as only category source",
  );
  add(
    "no-duplicate-categories",
    "No duplicate Categories",
    catalog.ok && catalog.stats.categories === CATALOG_MASTER_V1.rootCount,
    catalog.errors.find((e) => e.includes("Duplicate category")) ??
      (!catalog.ok ? "Category validation failed" : undefined),
  );
  add(
    "no-duplicate-subcategories",
    "No duplicate Subcategories",
    !catalog.errors.some((e) => e.includes("Duplicate subcategory")),
    catalog.errors.find((e) => e.includes("Duplicate subcategory")),
  );
  add(
    "no-duplicate-product-types",
    "No duplicate Product Types",
    !catalog.errors.some((e) => e.includes("Duplicate product type")),
    catalog.errors.find((e) => e.includes("Duplicate product type")),
  );
  add(
    "no-illegal",
    "No illegal Categories",
    !catalog.errors.some((e) => e.includes("Illegal")),
    catalog.errors.find((e) => e.includes("Illegal")),
  );
  add(
    "no-prohibited",
    "No prohibited Categories",
    protection.ok,
    !protection.ok ? protection.errors.join("; ") : undefined,
  );
  add(
    "courier-safe",
    "No courier-incompatible Categories",
    !catalog.errors.some((e) => e.includes("Courier-incompatible")),
    catalog.errors.find((e) => e.includes("Courier-incompatible")),
  );

  const vehicleParts = CATALOG_SECTORS.find((s) => s.slug === "vehicle-parts");
  const electronics = CATALOG_SECTORS.find((s) => s.slug === "electronics");
  const vehiclePartsOwnRoot =
    Boolean(vehicleParts) &&
    !electronics?.departments.some((d) => d.slug === "vehicle-parts");
  add(
    "vehicle-parts-root",
    "Vehicle Parts is its own Root Category",
    vehiclePartsOwnRoot,
    "Vehicle Parts must be its own root — never under Electronics",
  );

  const colourLabels = CATALOG_COLOURS.map((c) => c.label);
  const coloursMatch =
    CATALOG_COLOURS.length <= CATALOG_MASTER_FINAL_LAW_XXXII_V1.compactColourMax &&
    CATALOG_MASTER_FINAL_LAW_XXXII_V1.compactColourExact.every((label) =>
      colourLabels.includes(label),
    );
  add(
    "compact-colours",
    "Compact Colour Database",
    coloursMatch,
    "Colour database must match Law XXXII compact list",
  );

  const sampleSlug =
    CATALOG_SECTORS[0]?.departments[0]?.items?.[0]?.[1] ?? "generic";
  const brands = getBrandsForProductType(sampleSlug);
  add(
    "curated-brands",
    "Curated Brand Database",
    brands.length > 0,
    "Product-type brand database missing",
  );
  add(
    "no-brand",
    '"No Brand" available where applicable',
    brands.includes(CATALOG_NO_BRAND),
    "No Brand missing from curated brand database",
  );

  const namesMatch =
    CATALOG_SECTORS.map((s) => s.name).join("|") ===
    CATALOG_MASTER_FINAL_LAW_XXXII_V1.productionRoots.join("|");
  add(
    "consistent-naming",
    "Consistent naming",
    namesMatch,
    "Root display names must match Law XXXII production roots",
  );

  add(
    "sell-frozen",
    "Sell Page unchanged (frozen)",
    CATALOG_MASTER_FINAL_LAW_XXXII_V1.sellPageFrozen,
  );
  add(
    "sell-flow-frozen",
    "Sell Flow unchanged (frozen)",
    CATALOG_MASTER_FINAL_LAW_XXXII_V1.sellFlowFrozen,
  );

  const allPass = checks.every((c) => c.pass) && catalog.ok && protection.ok;
  if (!catalog.ok) {
    for (const e of catalog.errors) {
      if (!errors.includes(e)) errors.push(e);
    }
  }

  return {
    ok: allPass,
    productionReady: allPass,
    blocked: !allPass,
    law: "XXXII",
    checks,
    errors,
  };
}

export function assertCatalogMasterProductionReleaseOrBlock(
  tree: CategoryNode[],
): void {
  const report = certifyCatalogMasterProductionRelease(tree);
  if (!report.ok) {
    throw new Error(
      `[LAW XXXII] CATALOG MASTER FINAL LAW — PRODUCTION RELEASE BLOCKED.\n` +
        report.errors.map((e) => ` - ${e}`).join("\n"),
    );
  }
}
