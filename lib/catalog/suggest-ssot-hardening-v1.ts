/**
 * ROVEXO Suggest Engine — Single Source of Truth Hardening v1.0
 *
 * STATUS: OWNER ARCHITECTURE LAW · DETERMINISTIC · NO AI · FAIL CLOSED
 *
 * Catalog Master (lib/catalog/tree.ts) is the ONLY taxonomy source.
 * Suggest must never guess below the Owner confidence threshold.
 */

export const SUGGEST_SSOT_HARDENING_V1 = {
  id: "suggest-ssot-hardening-v1",
  version: "1.0.0",
  status: "ACTIVE",
  ssot: "lib/catalog/tree.ts",
  runtimeBuilder: "lib/catalog/runtime-catalog-index-v1.ts",
  suggestEngine: "lib/sell/category-suggestion-engine-v1.ts",
  /**
   * Owner confidence floor. Below this → no suggestion (never an unrelated category).
   * exact_product_type = 0.98 · exact_alias = 0.96 · exact_synonym = 0.94 (blocked).
   */
  ownerConfidenceThreshold: 0.95,
  noSuggestionMessage: "No suggestion available. Please choose a category.",
  environments: ["localhost", "preview", "production"] as const,
  forbidden: [
    "keyword_patches",
    "special_cases",
    "ai",
    "fuzzy_ai_matching",
    "duplicate_taxonomy",
    "generated_catalog",
    "search-index.json",
    "category-index.json",
    "cached_tree_authority",
    "legacy_mappings_as_ssot",
  ] as const,
  equation:
    "Catalog Master → Runtime Catalog Builder → Leaf/Phrase/Synonym Index → Suggest → Sell",
} as const;

export type SuggestSsotHardeningV1 = typeof SUGGEST_SSOT_HARDENING_V1;
