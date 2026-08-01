import { jsonWithCache } from "@/lib/api/cache-headers";
import { getCategoryTree } from "@/lib/categories/queries";
import { CATALOG_MASTER_V1 } from "@/lib/catalog/catalog-master-v1";
import {
  assertCatalogMasterProtectionOrBlock,
  CATALOG_MASTER_PROTECTION_V1,
} from "@/lib/catalog/catalog-master-protection-v1";
import { assertCatalogMasterProductionReleaseOrBlock } from "@/lib/catalog/catalog-master-final-law-xxxii-v1";
import { assertCatalogMasterBloodCertificationOrBlock } from "@/lib/catalog/supreme-blood-law-xxxiii-catalog-master-v1";
import {
  assertRuntimeCatalogFingerprintOrBlock,
  getRuntimeCatalogIndex,
} from "@/lib/catalog/runtime-catalog-index-v1";

/**
 * Category tree API — Catalog Master ONLY
 * Absolute Laws XXX · XXXI · XXXII · Blood Law XXXIII.
 *
 * no-store: taxonomy content must never lag behind Catalog Master (CDN stale tree = Sell FAIL).
 * Fingerprint fields prove Localhost ≡ Preview ≡ Production SSOT parity.
 */
export async function GET() {
  const tree = getCategoryTree();
  assertCatalogMasterProtectionOrBlock(tree);
  assertCatalogMasterProductionReleaseOrBlock(tree);
  assertCatalogMasterBloodCertificationOrBlock(tree);
  const index = assertRuntimeCatalogFingerprintOrBlock(getRuntimeCatalogIndex());
  const { fingerprint } = index;
  return jsonWithCache(
    {
      tree,
      source: "catalog-master" as const,
      contentRevision: CATALOG_MASTER_V1.contentRevision,
      cacheEpoch: CATALOG_MASTER_PROTECTION_V1.cacheEpoch,
      treeHash: fingerprint.treeHash,
      nodeCount: fingerprint.nodeCount,
      leafCount: fingerprint.leafCount,
      buildTimestamp: fingerprint.buildTimestamp,
      runtimeSource: index.source,
      ssot: index.ssot,
    },
    "no-store",
  );
}
