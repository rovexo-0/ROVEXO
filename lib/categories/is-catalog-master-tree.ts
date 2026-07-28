/**
 * Fail-closed check: tree roots must match Catalog Master (Law XXX).
 * Rejects legacy enterprise dumps (Vehicles, Property, Jobs, …).
 */

import { CATALOG_MASTER_V1 } from "@/lib/catalog/catalog-master-v1";
import type { CategoryNode } from "@/lib/categories/types";

const LEGACY_ILLEGAL_ROOT_SLUGS = new Set<string>([
  ...CATALOG_MASTER_V1.forbiddenRoots,
  "tickets",
  "food",
  "agriculture",
  "travel",
  "events",
  "free-stuff",
  "everything-else",
  "pets",
  "jobs",
  "services",
  "phones",
  "computers",
  "gaming",
  "diy",
  "tools",
  "baby",
  "toys",
  "music",
  "movies",
  "office",
  "industrial",
  "health",
  "beauty",
  "wedding",
  "maternity",
  "bags",
  "shoes",
  "luxury",
  "cycling",
  "camping",
  "fishing",
  "car-parts",
  "tv-audio",
  "photo-video",
]);

export function isCatalogMasterRootTree(tree: CategoryNode[]): boolean {
  if (!Array.isArray(tree) || tree.length !== CATALOG_MASTER_V1.rootCount) {
    return false;
  }

  const slugs = new Set(tree.map((node) => node.slug));

  for (const required of CATALOG_MASTER_V1.requiredRoots) {
    if (!slugs.has(required)) return false;
  }

  for (const slug of slugs) {
    if (LEGACY_ILLEGAL_ROOT_SLUGS.has(slug)) return false;
  }

  return true;
}
