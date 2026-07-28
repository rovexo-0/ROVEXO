/**
 * ROVEXO PRIORITY 0 — ABSOLUTE LAW
 * NOTHING COMES BEFORE: WHITE SCREEN + PREVIEW VIEW + CONVERSATION HUB
 *
 * STATUS: OWNER APPROVED · LOCKED · FROZEN · 2026-07-23 · NEVER REMOVE
 *
 * Parents: Supreme Blood Code I–IV · View Analyzer · Fail Closed · Conversation Hub Sprint 1 Freeze
 *
 * OWNER LAW:
 * IF OWNER CANNOT SEE + SCROLL + CLICK + BUY + SELL + PAY + TRACK + TEST
 * → THE PRODUCT DOES NOT EXIST.
 */

export const PRIORITY_0_V1 = {
  version: "1.0",
  codename: "PRIORITY_0",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  permanent: true,
  neverRemove: true,
  absolute: true,
  nothingComesBefore: ["WHITE_SCREEN", "PREVIEW_VIEW", "CONVERSATION_HUB"] as const,
  level: 8,
  approvedAt: "2026-07-23",

  ownerSeesProductFail: [
    "WHITE_SCREEN",
    "EMPTY_SCREEN",
    "BLACK_SCREEN",
    "NULL_SCREEN",
    "BROKEN_SCREEN",
    "NO_IMAGE",
    "NO_BUTTON",
    "NO_PRICE",
    "NO_PAY_NOW",
    "NO_MESSAGES",
    "NO_HEADER",
    "NO_RESPONSIVE_VIEW",
  ] as const,

  ifOwnerSeesFail: {
    product: "FAIL",
    sprint: "FAIL",
    commit: "BLOCKED",
    push: "BLOCKED",
    certification: "BLOCKED",
  } as const,

  validationPipeline: [
    "DATA_VALIDATION",
    "API_VALIDATION",
    "AUTH_VALIDATION",
    "IMPORT_VALIDATION",
    "ROUTES_VALIDATION",
    "COMPONENT_VALIDATION",
    "PAGE_VALIDATION",
    "MOBILE_VIEW_VALIDATION",
    "RESPONSIVE_VALIDATION",
    "IMAGE_VALIDATION",
    "BUTTON_VALIDATION",
    "PREVIEW_VALIDATION",
    "OWNER_VISUAL_VALIDATION",
    "ZERO_REGRESSION_VALIDATION",
    "SELF_RECOVERY_VALIDATION",
    "CERTIFICATION",
  ] as const,

  failClosedNeverShow: [
    "WHITE_SCREEN",
    "EMPTY_SCREEN",
    "BLACK_SCREEN",
    "NULL_SCREEN",
  ] as const,

  failClosedOnlyShow: [
    "LOADING_SKELETON",
    "TEMPORARY_COMPONENT",
    "ERROR_COMPONENT",
    "SELF_RECOVERY_COMPONENT",
    "REFRESH_COMPONENT",
    "DIAGNOSTIC_COMPONENT",
  ] as const,

  previewOwnerMustSee: [
    "HEADER",
    "BACK_BUTTON",
    "IMAGE",
    "TITLE",
    "PRICE",
    "PAY_NOW",
    "STATUS",
    "LABELS",
    "MESSAGES",
    "INPUT_BOX",
    "BUTTONS",
    "TIMELINE",
    "SCROLL",
    "RESPONSIVE_VIEW",
    "MOBILE_VIEW",
    "TABLET_VIEW",
    "DESKTOP_VIEW",
    "ANIMATIONS",
    "TRACKING",
    "NOTIFICATIONS",
    "AUTOMATIONS",
  ] as const,

  conversationHubMustNeverDisplay: [
    "WHITE_SCREEN",
    "BROKEN_COMPONENT",
    "NULL_DATA",
    "MISSING_IMAGE",
    "MISSING_PRICE",
    "MISSING_BUTTONS",
    "BROKEN_PAY_NOW",
  ] as const,

  selfRecovery: {
    apiFails: "LOADING_SKELETON",
    imageFails: "PLACEHOLDER_IMAGE",
    paymentFails: "TEMPORARY_MESSAGE",
    importFails: "ERROR_COMPONENT",
    dataFails: "SELF_RECOVERY",
    componentFails: "SELF_RECOVERY",
  } as const,

  ownerLawMustBeAbleTo: [
    "SEE",
    "SCROLL",
    "CLICK",
    "BUY",
    "SELL",
    "PAY",
    "TRACK",
    "TEST",
  ] as const,

  /** Work order — Sprint 2 unlocked only after step 9 PASS. */
  priority0Order: [
    "FIX_WHITE_SCREEN",
    "FIX_PREVIEW",
    "FIX_CONVERSATION_HUB",
    "FIX_RESPONSIVE_VIEW",
    "FIX_PAY_NOW",
    "FIX_IMAGES",
    "FIX_MESSAGES",
    "VISUAL_CERTIFICATION",
    "ZERO_REGRESSION_TESTING",
    "SPRINT_2_UNLOCKED",
  ] as const,

  surfaces: {
    conversationHub: "features/inbox/components/ConversationHub.tsx",
    officialPreview: "https://preview.rovexo.co.uk/inbox",
    localPreview: "http://localhost:3000/inbox",
  } as const,

  ssot: {
    code: "lib/priority-0-v1.ts",
    rule: ".cursor/rules/priority-0-v1.mdc",
    doc: "docs/engineering/PRIORITY_0_V1.md",
  } as const,

  parentLaws: {
    supremeBloodCodeIv: "lib/supreme-blood-code-iv-v1.ts",
    viewAnalyzer: "lib/view-analyzer-v1.ts",
    conversationHubSprint1: "lib/inbox/conversation-hub-sprint1-freeze-v1.ts",
    failClosed: "lib/fail-closed/engine.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
  } as const,

  childLaws: {
    buildMustLive: "lib/priority-0-build-must-live-v1.ts",
    masterBuyerConversationHub: "lib/inbox/master-buyer-conversation-hub-freeze-v1.ts",
    conversationHubPurification: "lib/supreme-blood-code-viii-v1.ts",
    searchBarRemovalOnly: "lib/supreme-blood-code-ix-v1.ts",
  } as const,
} as const;

export type Priority0V1 = typeof PRIORITY_0_V1;

export function isPriority0SurfaceBlocked(observation: {
  whiteScreen?: boolean;
  emptyScreen?: boolean;
  blackScreen?: boolean;
  nullScreen?: boolean;
  brokenScreen?: boolean;
  noImage?: boolean;
  noButton?: boolean;
  noPrice?: boolean;
  noPayNow?: boolean;
  noMessages?: boolean;
  noHeader?: boolean;
  noResponsiveView?: boolean;
}): boolean {
  return Boolean(
    observation.whiteScreen ||
      observation.emptyScreen ||
      observation.blackScreen ||
      observation.nullScreen ||
      observation.brokenScreen ||
      observation.noImage ||
      observation.noButton ||
      observation.noPrice ||
      observation.noPayNow ||
      observation.noMessages ||
      observation.noHeader ||
      observation.noResponsiveView,
  );
}

export function resolvePriority0ReleaseBlocks(): typeof PRIORITY_0_V1.ifOwnerSeesFail {
  return PRIORITY_0_V1.ifOwnerSeesFail;
}

/** Sprint 2 unlocks only after visual certification + zero regression PASS. */
export function isSprint2Unlocked(input: {
  visualCertificationPass: boolean;
  zeroRegressionPass: boolean;
  whiteScreenCleared: boolean;
  conversationHubPass: boolean;
}): boolean {
  return (
    input.whiteScreenCleared &&
    input.conversationHubPass &&
    input.visualCertificationPass &&
    input.zeroRegressionPass
  );
}
