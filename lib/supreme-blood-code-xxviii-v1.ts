/**
 * ROVEXO SUPREME BLOOD CODE XXVIII
 * CANONICAL ROOT CATEGORIES — OWNER LOCKED · Absolute Law XXX aligned
 *
 * Exactly 10 courier-safe primary categories on Homepage + Search + Catalog Master.
 * Vehicle Parts & Accessories = own root. Whole vehicles · Property · Business forbidden.
 * SSOT: lib/categories/canonical-root-categories-v1.ts · lib/catalog/
 */

import {
  CANONICAL_ROOT_CATEGORIES_V1,
  CANONICAL_ROOT_CATEGORY_COUNT,
  FORBIDDEN_ROOT_CATEGORY_SLUGS,
} from "@/lib/categories/canonical-root-categories-v1";

export const SUPREME_BLOOD_CODE_XXVIII_V1 = {
  version: "28.1",
  codename: "CANONICAL_ROOT_CATEGORIES",
  status: "OWNER_APPROVED_LOCKED",
  approvedByOwner: true,
  freezeLocked: true,
  permanentlyFrozen: true,
  approvedAt: "2026-07-25",
  lawXxxAlignedAt: "2026-07-25",
  neverRemove: true,
  rootCount: CANONICAL_ROOT_CATEGORY_COUNT,
  forbiddenRoots: FORBIDDEN_ROOT_CATEGORY_SLUGS,
  ssot: "lib/categories/canonical-root-categories-v1.ts",
  catalogSsot: "lib/catalog",
  contract: CANONICAL_ROOT_CATEGORIES_V1,
  surfaces: {
    homepage: "ONLY_10_CANONICAL_ROOTS",
    search: "ONLY_10_CANONICAL_ROOTS",
    catalog: "ONLY_10_CANONICAL_ROOTS",
  } as const,
  rule: "CHANGES_REQUIRE_OWNER_APPROVAL",
} as const;
