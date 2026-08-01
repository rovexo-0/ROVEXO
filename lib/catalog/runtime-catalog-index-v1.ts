/**
 * ROVEXO Runtime Catalog Index v1.0 — ONE build · ONE instance · Catalog Master ONLY.
 *
 * Catalog Master (lib/catalog/tree.ts)
 *   → Runtime Catalog Builder
 *   → Leaf Index · Phrase Index · Synonym Index
 *   → Suggest Engine → Sell
 *
 * Never rebuild independently per consumer. Never load generated taxonomy JSON.
 */

import { createHash } from "node:crypto";
import { CATALOG_MASTER_V1 } from "@/lib/catalog/catalog-master-v1";
import { RUNTIME_CATALOG_FINGERPRINT_LOCK_V1 } from "@/lib/catalog/runtime-catalog-fingerprint-lock-v1";
import { SUGGEST_SSOT_HARDENING_V1 } from "@/lib/catalog/suggest-ssot-hardening-v1";
import { collectLeafPaths } from "@/lib/categories/navigation";
import { getCategoryTree } from "@/lib/categories/queries";
import type { CategoryNode, FlatCategoryPath } from "@/lib/categories/types";
import { flatPathFromSegments } from "@/lib/categories/types";

export type RuntimeCatalogFingerprint = {
  contentRevision: string;
  treeHash: string;
  nodeCount: number;
  leafCount: number;
  buildTimestamp: string;
};

export type RuntimeLeafEntry = {
  path: FlatCategoryPath;
  pathKey: string;
  leafName: string;
  leafSlug: string;
  leafNorm: string;
  /** Deterministic phrase forms derived ONLY from the Catalog Master leaf name. */
  phrases: readonly string[];
  /** Tokens derived ONLY from the Catalog Master leaf name. */
  tokens: readonly string[];
};

export type RuntimeCatalogIndex = {
  source: "catalog-master";
  ssot: "lib/catalog/tree.ts";
  tree: CategoryNode[];
  fingerprint: RuntimeCatalogFingerprint;
  leaves: readonly RuntimeLeafEntry[];
  /** phrase → leaf (longest phrases preferred at match time). */
  phraseIndex: ReadonlyMap<string, RuntimeLeafEntry>;
  /** token → leaves that contain that Catalog Master token. */
  synonymIndex: ReadonlyMap<string, readonly RuntimeLeafEntry[]>;
};

let singleton: RuntimeCatalogIndex | null = null;

function countNodes(nodes: CategoryNode[]): number {
  let total = 0;
  for (const node of nodes) {
    total += 1;
    if (node.children?.length) total += countNodes(node.children);
  }
  return total;
}

export function singularizeCatalogToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (/(ses|xes|zes|ches|shes)$/.test(token)) return token.slice(0, -2);
  if (token.endsWith("ss")) return token;
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

export function normalizeCatalogText(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function tokenizeCatalogText(text: string): string[] {
  return normalizeCatalogText(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2)
    .map(singularizeCatalogToken);
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/** Phrase variants derived solely from a Catalog Master leaf display name. */
export function buildLeafPhraseVariants(leafName: string): string[] {
  const norm = normalizeCatalogText(leafName);
  const tokens = tokenizeCatalogText(norm);
  const singularPhrase = tokens.join(" ");
  return uniqueStrings([
    norm,
    norm.replace(/\s+/g, "-"),
    norm.replace(/\s+/g, ""),
    singularPhrase,
    tokens.join("-"),
    tokens.join(""),
  ]);
}

export function computeRuntimeCatalogFingerprint(
  tree: CategoryNode[],
  leaves: readonly RuntimeLeafEntry[],
  buildTimestamp: string,
): RuntimeCatalogFingerprint {
  const payload = leaves
    .map((leaf) => `${leaf.pathKey}:${leaf.leafName}`)
    .sort()
    .join("\n");
  const treeHash = createHash("sha256")
    .update(`${CATALOG_MASTER_V1.contentRevision}\n${payload}`)
    .digest("hex");

  return {
    contentRevision: CATALOG_MASTER_V1.contentRevision,
    treeHash,
    nodeCount: countNodes(tree),
    leafCount: leaves.length,
    buildTimestamp,
  };
}

function buildLeaves(tree: CategoryNode[]): RuntimeLeafEntry[] {
  return collectLeafPaths(tree)
    .filter(({ segments }) => !segments.some((segment) => segment.slug === "by-brand"))
    .map(({ segments }) => {
      const path = flatPathFromSegments(segments);
      const leaf = segments[segments.length - 1]!;
      const leafNorm = normalizeCatalogText(leaf.name);
      return {
        path,
        pathKey: segments.map((segment) => segment.slug).join("/"),
        leafName: leaf.name,
        leafSlug: leaf.slug,
        leafNorm,
        phrases: buildLeafPhraseVariants(leaf.name),
        tokens: tokenizeCatalogText(leaf.name),
      } satisfies RuntimeLeafEntry;
    });
}

function buildPhraseIndex(leaves: readonly RuntimeLeafEntry[]): Map<string, RuntimeLeafEntry> {
  const map = new Map<string, RuntimeLeafEntry>();
  for (const leaf of leaves) {
    for (const phrase of leaf.phrases) {
      if (phrase.length < 3) continue;
      const existing = map.get(phrase);
      // Prefer longer path specificity already encoded in leaf; keep first stable order.
      if (!existing) map.set(phrase, leaf);
    }
  }
  return map;
}

function buildSynonymIndex(
  leaves: readonly RuntimeLeafEntry[],
): Map<string, readonly RuntimeLeafEntry[]> {
  const map = new Map<string, RuntimeLeafEntry[]>();
  for (const leaf of leaves) {
    for (const token of leaf.tokens) {
      const bucket = map.get(token);
      if (bucket) bucket.push(leaf);
      else map.set(token, [leaf]);
    }
  }
  return map;
}

function buildRuntimeCatalogIndex(): RuntimeCatalogIndex {
  const tree = getCategoryTree();
  const buildTimestamp = new Date().toISOString();
  const leaves = buildLeaves(tree);
  const fingerprint = computeRuntimeCatalogFingerprint(tree, leaves, buildTimestamp);
  const phraseIndex = buildPhraseIndex(leaves);
  const synonymIndex = buildSynonymIndex(leaves);

  return {
    source: "catalog-master",
    ssot: "lib/catalog/tree.ts",
    tree,
    fingerprint,
    leaves,
    phraseIndex,
    synonymIndex,
  };
}

/** ONE runtime instance for the process. Every consumer must use this. */
export function getRuntimeCatalogIndex(): RuntimeCatalogIndex {
  if (!singleton) {
    singleton = buildRuntimeCatalogIndex();
  }
  return singleton;
}

/** Tests only — never call from product UI. */
export function resetRuntimeCatalogIndexForTests(): void {
  singleton = null;
}

export function fingerprintsEqual(
  a: Pick<RuntimeCatalogFingerprint, "contentRevision" | "treeHash" | "nodeCount" | "leafCount">,
  b: Pick<RuntimeCatalogFingerprint, "contentRevision" | "treeHash" | "nodeCount" | "leafCount">,
): boolean {
  return (
    a.contentRevision === b.contentRevision &&
    a.treeHash === b.treeHash &&
    a.nodeCount === b.nodeCount &&
    a.leafCount === b.leafCount
  );
}

export type CatalogEnvironmentParityReport = {
  pass: boolean;
  diagnostic: string;
  live: RuntimeCatalogFingerprint;
  lock: typeof RUNTIME_CATALOG_FINGERPRINT_LOCK_V1;
  /** Same lock must hold for localhost, preview, and production builds of this commit. */
  environments: {
    localhost: typeof RUNTIME_CATALOG_FINGERPRINT_LOCK_V1;
    preview: typeof RUNTIME_CATALOG_FINGERPRINT_LOCK_V1;
    production: typeof RUNTIME_CATALOG_FINGERPRINT_LOCK_V1;
  };
};

export function getCatalogEnvironmentParityReport(
  index: RuntimeCatalogIndex = getRuntimeCatalogIndex(),
): CatalogEnvironmentParityReport {
  const lock = RUNTIME_CATALOG_FINGERPRINT_LOCK_V1;
  const live = index.fingerprint;
  const pass = fingerprintsEqual(live, lock);
  const diagnostic = pass
    ? `CATALOG_RUNTIME_PARITY_PASS revision=${live.contentRevision} treeHash=${live.treeHash} nodes=${live.nodeCount} leaves=${live.leafCount}`
    : [
        "CATALOG_RUNTIME_PARITY_FAIL",
        "Localhost / Preview / Production must share ONE Catalog Master fingerprint.",
        `live.revision=${live.contentRevision} lock.revision=${lock.contentRevision}`,
        `live.treeHash=${live.treeHash}`,
        `lock.treeHash=${lock.treeHash}`,
        `live.nodes=${live.nodeCount} lock.nodes=${lock.nodeCount}`,
        `live.leaves=${live.leafCount} lock.leaves=${lock.leafCount}`,
        `ssot=${SUGGEST_SSOT_HARDENING_V1.ssot}`,
      ].join(" | ");

  return {
    pass,
    diagnostic,
    live,
    lock,
    environments: {
      localhost: lock,
      preview: lock,
      production: lock,
    },
  };
}

/**
 * Fail closed when live Catalog Master ≠ locked fingerprint
 * (mixed Localhost / Preview / Production catalog versions forbidden).
 */
export function assertRuntimeCatalogFingerprintOrBlock(
  index: RuntimeCatalogIndex = getRuntimeCatalogIndex(),
): RuntimeCatalogIndex {
  const report = getCatalogEnvironmentParityReport(index);
  if (!report.pass) {
    throw new Error(report.diagnostic);
  }
  return index;
}

/** Startup: build ONE index, print fingerprint, fail closed on mismatch. */
export function assertRuntimeCatalogIndexOrBlock(): RuntimeCatalogIndex {
  const index = getRuntimeCatalogIndex();
  const { fingerprint } = index;
  console.info(
    [
      "[ROVEXO Runtime Catalog Index]",
      `Catalog Revision=${fingerprint.contentRevision}`,
      `Tree Hash=${fingerprint.treeHash}`,
      `Node Count=${fingerprint.nodeCount}`,
      `Leaf Count=${fingerprint.leafCount}`,
      `Build Timestamp=${fingerprint.buildTimestamp}`,
      `Source=${index.source}`,
      `SSOT=${index.ssot}`,
    ].join(" "),
  );
  return assertRuntimeCatalogFingerprintOrBlock(index);
}
