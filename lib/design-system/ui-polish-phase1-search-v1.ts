/**
 * ROVEXO UI Polish Phase 1 — Search
 * STATUS: OWNER APPROVED · IMPLEMENTED · AWAITING MOBILE CERTIFICATION
 */

export const UI_POLISH_PHASE1_SEARCH_V1 = {
  id: "ui-polish-phase1-search-v1",
  page: "search",
  route: "/search",
  status: "IMPLEMENTED_AWAITING_OWNER_MOBILE_CERTIFICATION",
  implementationAllowed: true,
  listingCardLocked: true,
  homepageLocked: true,
  documents: {
    audit: "docs/modules/search/UI_POLISH_PHASE1_AUDIT.md",
    plan: "docs/modules/search/UI_POLISH_PHASE1_IMPROVEMENT_PLAN.md",
    masterUiSpec: "docs/modules/search/MASTER_UI_SPECIFICATION.md",
  },
  styles: [
    "styles/rovexo/search-landing-v1.css",
    "styles/rovexo/search-results-v1.css",
  ] as const,
  deferred: ["filter_button", "sort_button", "filter_bottom_sheet"] as const,
  forbidden: [
    "listing_card_redesign",
    "homepage_changes",
    "search_logic_changes",
    "new_filter_functionality",
    "new_sort_functionality",
    "marketplace_copy",
    "production_deploy_without_owner",
  ] as const,
} as const;

export type UiPolishPhase1SearchV1 = typeof UI_POLISH_PHASE1_SEARCH_V1;
