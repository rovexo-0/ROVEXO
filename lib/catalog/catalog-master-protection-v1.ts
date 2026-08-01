/**
 * ROVEXO ABSOLUTE LAW XXXI — CATALOG MASTER PROTECTION
 * STATUS: OWNER APPROVED | PERMANENT | FAIL CLOSED
 *
 * Catalog Master is the ONLY category source inside ROVEXO.
 * Zero legacy arrays · Zero DB taxonomy trees · Zero parallel catalogs · Zero silent fallback.
 *
 * Resolution path (mandatory):
 *   Catalog Master → getCategoryTree() → Single Source of Truth
 */

import { CATALOG_MASTER_V1 } from "@/lib/catalog/catalog-master-v1";
import { validateCatalogMaster } from "@/lib/catalog/validate";
import { isCatalogMasterRootTree } from "@/lib/categories/is-catalog-master-tree";
import type { CategoryNode } from "@/lib/categories/types";

export const CATALOG_MASTER_PROTECTION_V1 = {
  version: "1.0",
  law: "XXXI",
  name: "Catalog Master Protection",
  status: "PERMANENT_FAIL_CLOSED",
  equation: "ONE_CATALOG_MASTER = ONLY_CATEGORY_SOURCE",
  resolutionPath: "Catalog Master → getCategoryTree() → SSOT",
  forbidden: [
    "legacy-category-arrays",
    "hardcoded-category-lists",
    "old-database-taxonomy-trees",
    "old-json-category-files",
    "duplicate-category-trees",
    "parallel-category-databases",
    "legacy-cache-versions",
    "silent-legacy-fallback",
  ] as const,
  cacheKeyPrefix: "rovexo:category-tree:catalog-master",
  /** Changing Catalog Master version/law/content invalidates all previous caches. */
  cacheEpoch: `${CATALOG_MASTER_V1.version}:${CATALOG_MASTER_V1.contentRevision}:${CATALOG_MASTER_V1.law}:xxxi:xxxii:xxxiii`,
  finalLaw: "XXXII",
  bloodLaw: "XXXIII",
} as const;

export type CatalogMasterProtectionFailure = {
  ok: false;
  errors: string[];
  blocked: true;
};

export type CatalogMasterProtectionSuccess = {
  ok: true;
  blocked: false;
  rootCount: number;
  cacheEpoch: string;
};

export type CatalogMasterProtectionReport =
  | CatalogMasterProtectionSuccess
  | CatalogMasterProtectionFailure;

/** Session / client cache key — Catalog Master only. Legacy keys forbidden. */
export function getCatalogMasterCacheKey(): string {
  return `${CATALOG_MASTER_PROTECTION_V1.cacheKeyPrefix}:${CATALOG_MASTER_PROTECTION_V1.cacheEpoch}`;
}

export function assertCatalogMasterTreeOrThrow(
  tree: CategoryNode[],
  context = "category-tree",
): asserts tree is CategoryNode[] {
  if (!isCatalogMasterRootTree(tree)) {
    throw new Error(
      `[LAW XXXI] BLOCKED: ${context} is not Catalog Master. ` +
        `Legacy / parallel category sources are forbidden. Fail closed.`,
    );
  }
}

/**
 * Startup + runtime gate. Fail closed — never silently accept legacy taxonomy.
 */
export function verifyCatalogMasterProtection(
  tree: CategoryNode[],
): CatalogMasterProtectionReport {
  const errors: string[] = [];
  const catalogReport = validateCatalogMaster();

  if (!catalogReport.ok) {
    errors.push(...catalogReport.errors.map((e) => `catalog: ${e}`));
  }

  if (!isCatalogMasterRootTree(tree)) {
    errors.push("Category tree roots do not match Catalog Master");
  }

  if (tree.length !== CATALOG_MASTER_V1.rootCount) {
    errors.push(
      `Expected ${CATALOG_MASTER_V1.rootCount} roots, got ${tree.length}`,
    );
  }

  const slugs = new Set(tree.map((node) => node.slug));
  for (const forbidden of CATALOG_MASTER_V1.forbiddenRoots) {
    if (slugs.has(forbidden)) {
      errors.push(`Forbidden legacy root present: ${forbidden}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, blocked: true };
  }

  return {
    ok: true,
    blocked: false,
    rootCount: tree.length,
    cacheEpoch: CATALOG_MASTER_PROTECTION_V1.cacheEpoch,
  };
}

/**
 * Application start gate. Throws → blocks loading. Never falls back to legacy.
 */
export function assertCatalogMasterProtectionOrBlock(tree: CategoryNode[]): void {
  const report = verifyCatalogMasterProtection(tree);
  if (!report.ok) {
    throw new Error(
      `[LAW XXXII / XXXI] CATALOG MASTER PROTECTION FAILED — LOADING BLOCKED.\n` +
        report.errors.map((e) => ` - ${e}`).join("\n"),
    );
  }
}

/** Convenience: protect the live SSOT tree from getCategoryTree(). */
export function runCatalogMasterStartupGate(getTree: () => CategoryNode[]): void {
  assertCatalogMasterProtectionOrBlock(getTree());
}
