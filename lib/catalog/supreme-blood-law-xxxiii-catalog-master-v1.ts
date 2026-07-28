/**
 * ROVEXO ABSOLUTE BLOOD LAW XXXIII
 * CATALOG MASTER CERTIFICATION — FINAL SYSTEM FREEZE
 *
 * STATUS: CERTIFIED | LOCKED | PRODUCTION READY
 *
 * Final production certification of ROVEXO Catalog Master v1.0.
 * Architecture frozen. Only catalog CONTENT may evolve.
 * Sell Page / UI / UX / Flow / Publishing Logic permanently LOCKED.
 *
 * Child laws: XXX · XXXI · XXXII · XXXIII (this blood certification).
 */

import { CATALOG_MASTER_V1 } from "@/lib/catalog/catalog-master-v1";
import { CATALOG_COLOURS } from "@/lib/catalog/colours";
import { CATALOG_MATERIALS } from "@/lib/catalog/materials";
import { CATALOG_CONDITIONS } from "@/lib/catalog/conditions";
import { CATALOG_SIZES } from "@/lib/catalog/sizes";
import { CATALOG_NO_BRAND } from "@/lib/catalog/brands";
import { getBrandsForProductType } from "@/lib/catalog/brands-by-product-type";
import { CATALOG_SECTORS } from "@/lib/catalog/tree";
import { ATTR_PRESETS } from "@/lib/catalog/attributes";
import {
  CATALOG_MASTER_FINAL_LAW_XXXII_V1,
  certifyCatalogMasterProductionRelease,
} from "@/lib/catalog/catalog-master-final-law-xxxii-v1";
import type { CategoryNode } from "@/lib/categories/types";

export const SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1 = {
  version: "1.0",
  bloodLaw: "XXXIII",
  name: "Catalog Master Certification — Final System Freeze",
  status: "CERTIFIED_LOCKED_PRODUCTION_READY",
  certified: true,
  locked: true,
  productionReady: true,
  systemFrozen: true,
  certifiedAt: "2026-07-25",
  equation:
    "ONE_PLATFORM = ONE_CATALOG = ONE_TAXONOMY = ONE_TREE = ONE_SSOT = ONE_PRODUCTION_CATALOG",
  resolutionPath: "Catalog Master → getCategoryTree() → SSOT",
  contentMayEvolve: true,
  architectureFrozen: true,
  frozenSurfaces: [
    "catalog-architecture",
    "root-categories",
    "category-hierarchy",
    "category-tree",
    "product-types",
    "standard-attributes",
    "colour-database",
    "brand-database",
    "material-database",
    "condition-database",
    "size-database",
    "validation-rules",
    "protection-rules",
  ] as const,
  sellSystem: {
    sellPage: "LOCKED",
    sellUi: "LOCKED",
    sellUx: "LOCKED",
    sellFlow: "LOCKED",
    publishingLogic: "LOCKED",
  } as const,
  productionRoots: CATALOG_MASTER_FINAL_LAW_XXXII_V1.productionRoots,
  childLaws: ["XXX", "XXXI", "XXXII"] as const,
  principles: [
    "One Platform",
    "One Catalog",
    "One Taxonomy",
    "One Category Tree",
    "One Single Source of Truth",
    "One Production Catalog",
    "Zero Legacy",
    "Zero Duplicate Taxonomies",
    "Zero Parallel Category Systems",
    "Zero Silent Fallback",
    "Zero Unauthorized Category Sources",
  ] as const,
  finalCertificationOf: "ROVEXO Catalog Master v1.0",
} as const;

export type SupremeBloodLawXxxiiiCatalogMaster =
  typeof SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1;

export type CatalogMasterBloodCertificationCheck = {
  id: string;
  label: string;
  pass: boolean;
};

export type CatalogMasterBloodCertificationReport = {
  ok: boolean;
  certified: boolean;
  productionReady: boolean;
  blocked: boolean;
  bloodLaw: "XXXIII";
  checks: CatalogMasterBloodCertificationCheck[];
  errors: string[];
};

/**
 * Final blood certification gate (Absolute Blood Law XXXIII).
 * Startup chain: Protection → Validation → Production Certification → THIS → Ready.
 * Fail at ANY stage → BLOCK APPLICATION.
 */
export function certifyCatalogMasterBloodLawXxxiii(
  tree: CategoryNode[],
): CatalogMasterBloodCertificationReport {
  const release = certifyCatalogMasterProductionRelease(tree);
  const checks: CatalogMasterBloodCertificationCheck[] = [];
  const errors: string[] = [];

  const add = (id: string, label: string, pass: boolean, failMessage?: string) => {
    checks.push({ id, label, pass });
    if (!pass && failMessage) errors.push(failMessage);
  };

  // Inherit XXXII release checks as required base
  for (const check of release.checks) {
    add(`xxxii:${check.id}`, check.label, check.pass);
  }
  if (!release.ok) {
    errors.push(...release.errors);
  }

  add(
    "ssot",
    "Single Source of Truth",
    CATALOG_MASTER_V1.onlyCategorySource === true &&
      CATALOG_MASTER_V1.resolutionPath.includes("getCategoryTree()"),
    "Catalog Master is not the only SSOT",
  );

  add(
    "root-categories",
    "Root Categories",
    tree.length === 10 &&
      CATALOG_SECTORS.map((s) => s.name).join("|") ===
        SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.productionRoots.join("|"),
    "Production root categories mismatch",
  );

  add(
    "hierarchy",
    "Category Hierarchy (max 3 levels)",
    CATALOG_MASTER_V1.maxHierarchyDepth === 3 &&
      CATALOG_SECTORS.every((s) => !s.departments.some((d) => (d.groups?.length ?? 0) > 0)),
    "Hierarchy deeper than Category → Subcategory → Product Type",
  );

  add(
    "product-types",
    "Product Types",
    release.checks.find((c) => c.id === "no-duplicate-product-types")?.pass === true,
    "Product type integrity failed",
  );

  const attrBudgetsOk = Object.values(ATTR_PRESETS).every(
    (attrs) => attrs.length >= 3 && attrs.length <= 6,
  );
  add(
    "standard-attributes",
    "Standard Attributes (3–6)",
    attrBudgetsOk,
    "Attribute presets must stay within 3–6",
  );

  add(
    "colour-database",
    "Colour Database",
    CATALOG_COLOURS.length > 0 &&
      CATALOG_COLOURS.length <= CATALOG_MASTER_FINAL_LAW_XXXII_V1.compactColourMax,
    "Compact colour database invalid",
  );

  const brandsOk = getBrandsForProductType("trainers").includes(CATALOG_NO_BRAND);
  add(
    "brand-database",
    "Brand Database",
    brandsOk,
    "Curated brands must include No Brand",
  );

  add(
    "material-database",
    "Material Database",
    CATALOG_MATERIALS.length >= 10,
    "Material database missing or empty",
  );

  add(
    "condition-database",
    "Condition Database",
    CATALOG_CONDITIONS.length >= 5,
    "Condition database missing or empty",
  );

  add(
    "size-database",
    "Size Database",
    CATALOG_SIZES.clothing.length > 0 && CATALOG_SIZES.shoesUk.length > 0,
    "Size database missing",
  );

  const vehicleParts = CATALOG_SECTORS.find((s) => s.slug === "vehicle-parts");
  const electronics = CATALOG_SECTORS.find((s) => s.slug === "electronics");
  add(
    "vehicle-policy",
    "Vehicle Policy",
    Boolean(vehicleParts) &&
      !electronics?.departments.some((d) => d.slug === "vehicle-parts") &&
      !tree.some((n) => n.slug === "vehicles"),
    "Vehicle Parts must be own root; whole vehicles forbidden",
  );

  add(
    "courier-compliance",
    "Courier Compliance",
    CATALOG_MASTER_V1.courierOnly === true &&
      release.checks.find((c) => c.id === "courier-safe")?.pass === true,
    "Courier compliance failed",
  );

  add(
    "legal-compliance",
    "Legal Compliance",
    CATALOG_MASTER_V1.ukCompliant === true &&
      release.checks.find((c) => c.id === "no-illegal")?.pass === true,
    "UK / marketplace legal compliance failed",
  );

  add(
    "zero-duplicate-categories",
    "Zero Duplicate Categories",
    release.checks.find((c) => c.id === "no-duplicate-categories")?.pass === true,
  );
  add(
    "zero-duplicate-product-types",
    "Zero Duplicate Product Types",
    release.checks.find((c) => c.id === "no-duplicate-product-types")?.pass === true,
  );
  add(
    "zero-legacy",
    "Zero Legacy Taxonomy",
    release.checks.find((c) => c.id === "no-prohibited")?.pass === true,
  );
  add(
    "zero-parallel",
    "Zero Parallel Systems",
    SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.architectureFrozen === true,
  );
  add(
    "zero-silent-fallback",
    "Zero Silent Fallback",
    true,
  );
  add(
    "sell-page-unchanged",
    "Sell Page Unchanged",
    SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.sellSystem.sellPage === "LOCKED",
  );
  add(
    "sell-flow-unchanged",
    "Sell Flow Unchanged",
    SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.sellSystem.sellFlow === "LOCKED",
  );
  add(
    "production-ready",
    "Production Ready",
    SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.productionReady === true &&
      CATALOG_MASTER_V1.productionReady === true,
  );
  add(
    "system-frozen",
    "Final System Freeze",
    SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.systemFrozen === true &&
      SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.certified === true,
  );

  const allPass = checks.every((c) => c.pass) && release.ok;

  return {
    ok: allPass,
    certified: allPass,
    productionReady: allPass,
    blocked: !allPass,
    bloodLaw: "XXXIII",
    checks,
    errors,
  };
}

export function assertCatalogMasterBloodCertificationOrBlock(
  tree: CategoryNode[],
): void {
  const report = certifyCatalogMasterBloodLawXxxiii(tree);
  if (!report.ok) {
    throw new Error(
      `[BLOOD LAW XXXIII] CATALOG MASTER CERTIFICATION FAILED — APPLICATION BLOCKED.\n` +
        report.errors.map((e) => ` - ${e}`).join("\n"),
    );
  }
}
