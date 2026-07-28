/**
 * ROVEXO SUPREME BLOOD CODE IX
 * SEARCH BAR REMOVAL ONLY — PRIORITY 0
 *
 * STATUS: MASTER UI APPROVED · PERMANENT FREEZE · 2026-07-23
 * NEVER REMOVE
 *
 * ONLY approved change: remove ROVEXO logo + marketplace search bar
 * above Conversation Hub so the hub header is the first pixel.
 *
 * DO NOT redesign · refactor · move components · change paddings/margins/
 * colours/fonts/stack order. Everything else permanently frozen.
 */

export const SUPREME_BLOOD_CODE_IX_V1 = {
  version: "9.0",
  codename: "SEARCH_BAR_REMOVAL_ONLY",
  status: "MASTER_UI_APPROVED",
  priority: 0,
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  permanent: true,
  neverRemove: true,
  priority0: true,
  approvedAt: "2026-07-23",

  onlyApprovedChange: ["REMOVE_ROVEXO_LOGO", "REMOVE_SEARCH_BAR"] as const,
  doNotModify: [
    "HEADER",
    "PRODUCT_CARD",
    "ORDER_STATUS",
    "SELLER_INFORMATION",
    "ORDER_SUMMARY",
    "OFFER_HISTORY",
    "CHAT",
    "MESSAGE_INPUT",
    "STICKY_CTA",
    "RESPONSIVE_DESIGN",
  ] as const,

  forbiddenThisSprint: [
    "REDESIGN",
    "REFACTOR",
    "MOVE_COMPONENTS",
    "CHANGE_PADDINGS",
    "CHANGE_MARGINS",
    "CHANGE_COLORS",
    "CHANGE_FONT_SIZES",
    "CHANGE_STACK_ORDER",
  ] as const,

  removeCompletely: [
    "ConversationSearch",
    "HeaderSearch",
    "GlobalSearch",
    "SearchContainer",
    "SearchInput",
    "SearchWrapper",
    "ConversationLogo",
    "ROVEXO_Header_Logo",
  ] as const,

  hideTricksForbidden: ["display:none", "opacity:0", "visibility:hidden"] as const,

  /** Marketplace chrome must not mount on Conversation Hub routes. */
  conversationRoutePrefixes: ["/inbox/conversation"] as const,

  firstPixelMustBe: ["BACK", "USERNAME", "STATUS", "INFO"] as const,

  entryPointOnly: "features/header/HeaderProvider.tsx",

  productPassRequires: [
    "SEARCH_BAR_REMOVED",
    "NO_REGRESSIONS",
    "NO_UI_CHANGES",
    "NO_COMPONENT_MOVEMENT",
    "OWNER_VISUAL_PASS",
  ] as const,

  ssot: {
    code: "lib/supreme-blood-code-ix-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-ix-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_IX_V1.md",
  } as const,

  parentLaws: {
    supremeBloodCodeViii: "lib/supreme-blood-code-viii-v1.ts",
    masterUiFreeze: "lib/inbox/buyer-conversation-hub-master-ui-freeze-v1.ts",
    headerProvider: "features/header/HeaderProvider.tsx",
    priority0: "lib/priority-0-v1.ts",
  } as const,

  childLaws: {
    homepageSearchBarOnly: "lib/header/homepage-search-bar-only-v1.ts",
    developmentFreezeLaw: "lib/supreme-blood-code-xi-v1.ts",
    sprintIiiOrdersPermanentFreeze: "lib/supreme-blood-code-xii-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeIxV1 = typeof SUPREME_BLOOD_CODE_IX_V1;

/** True when marketplace logo/search header must not exist above Conversation Hub. */
export function isConversationHubHeaderChromeForbidden(pathname: string): boolean {
  const path = pathname.trim();
  return SUPREME_BLOOD_CODE_IX_V1.conversationRoutePrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function resolveBloodIxProductPass(input: {
  searchBarRemoved: boolean;
  noRegressions: boolean;
  noUiChanges: boolean;
  noComponentMovement: boolean;
  ownerVisualPass: boolean;
}): "PRODUCT_PASS_100" | "PRODUCT_FAIL" {
  return Object.values(input).every(Boolean) ? "PRODUCT_PASS_100" : "PRODUCT_FAIL";
}
