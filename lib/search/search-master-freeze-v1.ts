/**
 * ROVEXO SEARCH MASTER FREEZE v1.0
 * OWNER APPROVED · LOCKED · FROZEN · SSOT READY
 *
 * Philosophy: THE USER DOES 5% · ROVEXO DOES 95%
 * Child of Absolute Master Freeze Level 8.
 *
 * Engine contract SSOT: lib/search/search-engine-v1.ts
 */

export const SEARCH_MASTER_FREEZE_V1 = {
  version: "1.0",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  frozen: true,

  philosophy: {
    userDoesPercent: 5,
    rovexoDoesPercent: 95,
    summary: "THE USER DOES 5%. ROVEXO DOES 95%.",
  } as const,

  emptyStateOnly: ["Recent Searches", "Trending Searches"] as const,

  whenTypingOnlyIfRelevant: [
    "Suggestions",
    "Relevant Products",
    "Relevant Categories",
    "Relevant Stores",
    "Relevant Members",
    "Similar Products",
  ] as const,

  notAllowed: [
    "AI Search",
    "Chat Search",
    "Multiple Search Engines",
    "Multiple Search Providers",
    "Dead Ends",
    "Empty Results Pages",
  ] as const,

  oneSearchEngineOnly: true,
  oneSearchProviderOnly: true,
  zeroDeadEnds: true,
  neverEmptyResultsPage: true,
  noAiSearch: true,
  noChatSearch: true,

  ssot: {
    freeze: "lib/search/search-master-freeze-v1.ts",
    engine: "lib/search/search-engine-v1.ts",
    absolute: "lib/absolute-master-freeze-v1.ts",
    searchPriority: "lib/header/search-priority-freeze-v1.ts",
  } as const,
} as const;

export type SearchMasterFreezeV1 = typeof SEARCH_MASTER_FREEZE_V1;
