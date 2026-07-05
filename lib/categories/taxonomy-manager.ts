/**
 * Marketplace Taxonomy Manager — export, import, backup and restore utilities.
 *
 * Super Admin and scripts use this module to snapshot the canonical taxonomy
 * bundle without duplicating tree-building logic elsewhere.
 */

import { categoryTree, taxonomyStats, ENTERPRISE_SECTORS } from "@/lib/categories/marketplace-tree";
import { MARKETPLACE_BRANDS } from "@/lib/categories/enterprise/brands";
import { MARKETPLACE_COLOURS } from "@/lib/categories/enterprise/colours";
import { MARKETPLACE_DEFAULT_SIZES, MARKETPLACE_SIZE_SYSTEMS } from "@/lib/categories/enterprise/sizes";
import { MARKETPLACE_MATERIALS, MARKETPLACE_MATERIALS_BY_VERTICAL } from "@/lib/categories/enterprise/materials";
import {
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_CONDITIONS_BY_VERTICAL,
} from "@/lib/categories/enterprise/conditions";
import { EXTENDED_MARKETPLACE_SYNONYMS } from "@/lib/categories/enterprise/marketplace-synonyms";
import { CATEGORY_SEARCH_SYNONYMS, CATEGORY_SEGMENT_ALIASES } from "@/lib/categories/search-synonyms";
import {
  validateMarketplaceTaxonomy,
  type TaxonomyValidationReport,
} from "@/lib/categories/validate-taxonomy";

export const TAXONOMY_BACKUP_VERSION = 1 as const;

export type TaxonomyBackupBundle = {
  version: typeof TAXONOMY_BACKUP_VERSION;
  exportedAt: string;
  stats: typeof taxonomyStats;
  sectors: typeof ENTERPRISE_SECTORS;
  brands: readonly string[];
  colours: typeof MARKETPLACE_COLOURS;
  sizes: readonly string[];
  sizeSystems: typeof MARKETPLACE_SIZE_SYSTEMS;
  materials: readonly string[];
  materialsByVertical: typeof MARKETPLACE_MATERIALS_BY_VERTICAL;
  conditions: readonly string[];
  conditionsByVertical: typeof MARKETPLACE_CONDITIONS_BY_VERTICAL;
  searchSynonyms: Record<string, string>;
  segmentAliases: typeof CATEGORY_SEGMENT_ALIASES;
  extendedSynonyms: typeof EXTENDED_MARKETPLACE_SYNONYMS;
  validation: TaxonomyValidationReport;
  rootCount: number;
};

export function exportTaxonomyBackup(): TaxonomyBackupBundle {
  return {
    version: TAXONOMY_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    stats: taxonomyStats,
    sectors: ENTERPRISE_SECTORS,
    brands: MARKETPLACE_BRANDS,
    colours: MARKETPLACE_COLOURS,
    sizes: MARKETPLACE_DEFAULT_SIZES,
    sizeSystems: MARKETPLACE_SIZE_SYSTEMS,
    materials: MARKETPLACE_MATERIALS,
    materialsByVertical: MARKETPLACE_MATERIALS_BY_VERTICAL,
    conditions: MARKETPLACE_CONDITIONS,
    conditionsByVertical: MARKETPLACE_CONDITIONS_BY_VERTICAL,
    searchSynonyms: CATEGORY_SEARCH_SYNONYMS,
    segmentAliases: CATEGORY_SEGMENT_ALIASES,
    extendedSynonyms: EXTENDED_MARKETPLACE_SYNONYMS,
    validation: validateMarketplaceTaxonomy(),
    rootCount: categoryTree.length,
  };
}

export function stringifyTaxonomyBackup(bundle: TaxonomyBackupBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function parseTaxonomyBackup(raw: string): TaxonomyBackupBundle {
  const parsed = JSON.parse(raw) as TaxonomyBackupBundle;
  if (parsed.version !== TAXONOMY_BACKUP_VERSION) {
    throw new Error(`Unsupported taxonomy backup version: ${String(parsed.version)}`);
  }
  if (!parsed.sectors || !Array.isArray(parsed.sectors)) {
    throw new Error("Invalid taxonomy backup: missing sectors");
  }
  if (!parsed.stats || typeof parsed.stats.leaves !== "number") {
    throw new Error("Invalid taxonomy backup: missing stats");
  }
  return parsed;
}

/** Merge a parsed backup with the live canonical bundle for diff / restore preview. */
export function diffTaxonomyBackup(backup: TaxonomyBackupBundle): {
  liveLeaves: number;
  backupLeaves: number;
  leafDelta: number;
  liveRoots: number;
  backupRoots: number;
  liveValid: boolean;
  backupValid: boolean;
} {
  const live = exportTaxonomyBackup();
  return {
    liveLeaves: live.stats.leaves,
    backupLeaves: backup.stats.leaves,
    leafDelta: live.stats.leaves - backup.stats.leaves,
    liveRoots: live.stats.roots,
    backupRoots: backup.stats.roots,
    liveValid: live.validation.valid,
    backupValid: backup.validation.valid,
  };
}
