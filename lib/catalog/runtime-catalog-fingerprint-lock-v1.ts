/**
 * Locked Catalog Master runtime fingerprint.
 * Localhost ≡ Preview ≡ Production when this lock matches the live tree.
 *
 * Regenerate via: npx tsx scripts/assert-catalog-runtime-fingerprint.ts --write
 * Abort Preview/Production builds when live ≠ lock.
 */

export const RUNTIME_CATALOG_FINGERPRINT_LOCK_V1 = {
  id: "runtime-catalog-fingerprint-lock-v1",
  ssot: "lib/catalog/tree.ts",
  contentRevision: "uk-960-rc2b-2026-08-01",
  treeHash: "33dfeed10261b00fbcb3edb8597196979351d345aabec3b18be33d13ce96ed54",
  nodeCount: 1044,
  leafCount: 960,
} as const;

export type RuntimeCatalogFingerprintLockV1 = typeof RUNTIME_CATALOG_FINGERPRINT_LOCK_V1;
