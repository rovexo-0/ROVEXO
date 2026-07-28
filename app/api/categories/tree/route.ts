import { jsonWithCache } from "@/lib/api/cache-headers";
import { getCategoryTree } from "@/lib/categories/queries";
import { assertCatalogMasterProtectionOrBlock } from "@/lib/catalog/catalog-master-protection-v1";
import { assertCatalogMasterProductionReleaseOrBlock } from "@/lib/catalog/catalog-master-final-law-xxxii-v1";
import { assertCatalogMasterBloodCertificationOrBlock } from "@/lib/catalog/supreme-blood-law-xxxiii-catalog-master-v1";

/**
 * Category tree API — Catalog Master ONLY
 * Absolute Laws XXX · XXXI · XXXII · Blood Law XXXIII.
 */
export async function GET() {
  const tree = getCategoryTree();
  assertCatalogMasterProtectionOrBlock(tree);
  assertCatalogMasterProductionReleaseOrBlock(tree);
  assertCatalogMasterBloodCertificationOrBlock(tree);
  return jsonWithCache({ tree, source: "catalog-master" as const }, "public-long");
}
