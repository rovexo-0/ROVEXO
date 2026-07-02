/**
 * Standalone benchmark — run: npx tsx scripts/bench-sell-taxonomy.ts
 * Aborts if any step exceeds STEP_TIMEOUT_MS.
 */
console.log("[bench] script loaded");
const STEP_TIMEOUT_MS = 60_000;

function withTimeout<T>(label: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const ms = performance.now() - start;
  console.log(`[bench] ${label}: ${ms.toFixed(1)}ms`);
  if (ms > STEP_TIMEOUT_MS) {
    throw new Error(`${label} exceeded ${STEP_TIMEOUT_MS}ms`);
  }
  return result;
}

async function main() {
  console.log("[bench] starting imports...");
  const tImport = performance.now();
  const { getFlatTaxonomy } = await import("../lib/taxonomy/category-tree");
  console.log(`[bench] category-tree imported in ${(performance.now() - tImport).toFixed(1)}ms`);

  console.log("[bench] calling getFlatTaxonomy...");
  const flat = withTimeout("getFlatTaxonomy", () => getFlatTaxonomy());
  console.log(`[bench] flat taxonomy nodes: ${flat.length}`);

  const { getSynonymMap, getSynonymMatches } = await import("../lib/taxonomy/category-synonyms");
  const map = withTimeout("getSynonymMap", () => getSynonymMap());
  console.log(`[bench] synonym index keys: ${map.size}`);

  for (const token of ["nike", "in", "a", "good", "condition"]) {
    const matches = withTimeout(`getSynonymMatches('${token}')`, () => getSynonymMatches(token));
    console.log(`[bench]   '${token}' → ${matches.length} matches`);
  }

  const { searchCategories } = await import("../lib/taxonomy/category-search");
  const short = withTimeout("searchCategories(short)", () =>
    searchCategories("Nike Air Max trainers size 9", { limit: 5, includeNonLeaf: false }),
  );
  console.log(`[bench] searchCategories(short): ${short.length} results`);

  const longQuery =
    "White trainers in good condition worn a few times no box included " +
    "collection london royal mail posting available size 9 nike air max ".repeat(5);
  const long = withTimeout("searchCategories(long)", () =>
    searchCategories(longQuery, { limit: 5, includeNonLeaf: false }),
  );
  console.log(`[bench] searchCategories(long): ${long.length} results`);

  const { detectCategoryFromTitle } = await import("../lib/sell/category-detection-pro");
  withTimeout("detectCategoryFromTitle(short)", () =>
    detectCategoryFromTitle("Nike Air Max trainers size 9", ""),
  );
  withTimeout("detectCategoryFromTitle(long desc)", () =>
    detectCategoryFromTitle("Nike Air Max trainers size 9", longQuery),
  );

  console.log("[bench] done");
}

const globalTimeout = setTimeout(() => {
  console.error("[bench] GLOBAL TIMEOUT — likely infinite loop or catastrophic O(n²) scan");
  process.exit(1);
}, 300_000);

main()
  .then(() => {
    clearTimeout(globalTimeout);
    process.exit(0);
  })
  .catch((error) => {
    clearTimeout(globalTimeout);
    console.error("[bench] error:", error);
    process.exit(1);
  });
