/**
 * Abort Preview / Production builds when live Catalog Master ≠ locked fingerprint.
 *
 * Usage:
 *   npx tsx scripts/assert-catalog-runtime-fingerprint.ts
 *   npx tsx scripts/assert-catalog-runtime-fingerprint.ts --write
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  getRuntimeCatalogIndex,
  resetRuntimeCatalogIndexForTests,
} from "../lib/catalog/runtime-catalog-index-v1";
import { RUNTIME_CATALOG_FINGERPRINT_LOCK_V1 } from "../lib/catalog/runtime-catalog-fingerprint-lock-v1";

const lockPath = join(
  process.cwd(),
  "lib/catalog/runtime-catalog-fingerprint-lock-v1.ts",
);

function main(): void {
  resetRuntimeCatalogIndexForTests();
  const index = getRuntimeCatalogIndex();
  const live = index.fingerprint;
  const write = process.argv.includes("--write");

  if (write) {
    const next = `/**
 * Locked Catalog Master runtime fingerprint.
 * Localhost ≡ Preview ≡ Production when this lock matches the live tree.
 *
 * Regenerate via: npx tsx scripts/assert-catalog-runtime-fingerprint.ts --write
 * Abort Preview/Production builds when live ≠ lock.
 */

export const RUNTIME_CATALOG_FINGERPRINT_LOCK_V1 = {
  id: "runtime-catalog-fingerprint-lock-v1",
  ssot: "lib/catalog/tree.ts",
  contentRevision: "${live.contentRevision}",
  treeHash: "${live.treeHash}",
  nodeCount: ${live.nodeCount},
  leafCount: ${live.leafCount},
} as const;

export type RuntimeCatalogFingerprintLockV1 = typeof RUNTIME_CATALOG_FINGERPRINT_LOCK_V1;
`;
    writeFileSync(lockPath, next, "utf8");
    // eslint-disable-next-line no-console
    console.info(
      `[catalog-fingerprint] wrote lock revision=${live.contentRevision} treeHash=${live.treeHash} nodes=${live.nodeCount} leaves=${live.leafCount}`,
    );
    return;
  }

  const lock = RUNTIME_CATALOG_FINGERPRINT_LOCK_V1;
  const pass =
    live.contentRevision === lock.contentRevision &&
    live.treeHash === lock.treeHash &&
    live.nodeCount === lock.nodeCount &&
    live.leafCount === lock.leafCount;

  // eslint-disable-next-line no-console
  console.info(
    `[catalog-fingerprint] live revision=${live.contentRevision} treeHash=${live.treeHash} nodes=${live.nodeCount} leaves=${live.leafCount}`,
  );
  // eslint-disable-next-line no-console
  console.info(
    `[catalog-fingerprint] lock revision=${lock.contentRevision} treeHash=${lock.treeHash} nodes=${lock.nodeCount} leaves=${lock.leafCount}`,
  );

  if (!pass) {
    // eslint-disable-next-line no-console
    console.error(
      "[catalog-fingerprint] ABORT BUILD — Catalog Master fingerprint mismatch. Localhost/Preview/Production must share ONE SSOT. Run with --write only after intentional Catalog Master content revision.",
    );
    // Prove lock file exists (no silent empty).
    readFileSync(lockPath, "utf8");
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.info("[catalog-fingerprint] PASS — Localhost ≡ Preview ≡ Production fingerprint lock");
}

main();
