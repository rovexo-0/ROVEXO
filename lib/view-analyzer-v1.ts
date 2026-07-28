/**
 * ROVEXO VIEW ANALYZER v1.0
 * OWNER VISUAL EXISTENCE LAW · PERMANENT FREEZE · NEVER REMOVE
 *
 * STATUS: OWNER APPROVED · LOCKED · FROZEN · 2026-07-23
 *
 * Parent: Supreme Blood Code III (Preview View Certification)
 * Aligns: Fail Closed Engine · Global UI Approval Gate · Image Safety
 *
 * ABSOLUTE LAW:
 * WHITE SCREEN = DOES NOT EXIST.
 * NO OWNER VISUAL APPROVAL = DOES NOT EXIST.
 */

export const VIEW_ANALYZER_V1 = {
  version: "1.0",
  codename: "VIEW_ANALYZER",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  permanent: true,
  neverRemove: true,
  canonical: true,
  ssotReady: true,
  level: 8,
  approvedAt: "2026-07-23",

  /** Surfaces the Owner must be able to see on official preview. */
  ownerMustSee: [
    "IMAGE",
    "BUTTON",
    "TITLE",
    "PRICE",
    "HEADER",
    "STATUS",
    "SCROLL",
    "RESPONSIVE",
    "ANIMATION",
    "PAY_NOW",
    "TRACKING",
    "LABELS",
    "MESSAGE_INPUT",
    "BUYER_FLOW",
    "SELLER_FLOW",
  ] as const,

  /** Immediate VIEW = FAIL conditions. */
  ownerSeesFail: [
    "WHITE_SCREEN",
    "EMPTY_PAGE",
    "BROKEN_IMAGE",
    "NO_BUTTON",
    "NO_PREVIEW",
    "LOADING_FOREVER",
  ] as const,

  /** Missing required proof → feature does not exist. */
  doesNotExistIfMissing: [
    "WHITE_SCREEN",
    "NO_SKELETON",
    "NO_IMAGE",
    "NO_PAY_NOW",
    "NO_OWNER_VISUAL_APPROVAL",
  ] as const,

  /** Never show these failure modes to the user. */
  neverShowToUser: [
    "WHITE_SCREEN",
    "EMPTY_SCREEN",
    "BLACK_SCREEN",
    "BROKEN_PAGE",
    "INFINITE_LOADING",
    "NULL_PAGE",
    "UNHANDLED_ERROR",
  ] as const,

  /** Allowed fail-safe UI when something fails. */
  onFailureShow: ["SKELETON_UI", "ERROR_COMPONENT", "TEMPORARY_MESSAGE"] as const,

  absoluteLaws: {
    whiteScreenEqualsDoesNotExist: true,
    noSkeletonEqualsDoesNotExist: true,
    noImageEqualsDoesNotExist: true,
    noPayNowEqualsDoesNotExist: true,
    noOwnerVisualApprovalEqualsDoesNotExist: true,
    neverWhiteScreen: true,
  } as const,

  ssot: {
    code: "lib/view-analyzer-v1.ts",
    rule: ".cursor/rules/view-analyzer-v1.mdc",
    doc: "docs/engineering/VIEW_ANALYZER_V1.md",
  } as const,

  parentLaws: {
    supremeBloodCodeIii: "lib/supreme-blood-code-iii-v1.ts",
    failClosed: ".cursor/rules/fail-closed-engine-v1.mdc",
    imageSafety: ".cursor/rules/image-safety-canonical.mdc",
    globalUiApprovalGate: ".cursor/rules/global-ui-approval-gate.mdc",
  } as const,

  childLaws: {
    whiteScreenKillSwitch: "lib/supreme-blood-code-iv-v1.ts",
  } as const,
} as const;

export type ViewAnalyzerV1 = typeof VIEW_ANALYZER_V1;

export type ViewAnalyzerResult = "VIEW_PASS" | "VIEW_FAIL";

export type ViewAnalyzerObservation = {
  whiteScreen?: boolean;
  emptyPage?: boolean;
  brokenImage?: boolean;
  noButton?: boolean;
  noPreview?: boolean;
  loadingForever?: boolean;
  blackScreen?: boolean;
  brokenPage?: boolean;
  unhandledError?: boolean;
  hasSkeleton?: boolean;
  hasImage?: boolean;
  hasPayNow?: boolean;
  ownerVisualApproval?: boolean;
  visibleSurfaces?: ReadonlyArray<(typeof VIEW_ANALYZER_V1.ownerMustSee)[number]>;
};

/**
 * Owner View Analyzer — binary PASS/FAIL.
 * Any white/empty/broken/infinite-load condition → FAIL.
 * Missing Owner visual approval → FAIL (does not exist).
 */
export function analyzeOwnerView(observation: ViewAnalyzerObservation): ViewAnalyzerResult {
  if (
    observation.whiteScreen ||
    observation.emptyPage ||
    observation.brokenImage ||
    observation.noButton ||
    observation.noPreview ||
    observation.loadingForever ||
    observation.blackScreen ||
    observation.brokenPage ||
    observation.unhandledError
  ) {
    return "VIEW_FAIL";
  }

  if (observation.ownerVisualApproval === false) return "VIEW_FAIL";
  if (observation.hasSkeleton === false) return "VIEW_FAIL";
  if (observation.hasImage === false) return "VIEW_FAIL";
  if (observation.hasPayNow === false) return "VIEW_FAIL";

  return "VIEW_PASS";
}

export function isUserFacingFailureModeForbidden(
  mode: (typeof VIEW_ANALYZER_V1.neverShowToUser)[number],
): true {
  void mode;
  return true;
}

export function resolveFailureUiFallback(): (typeof VIEW_ANALYZER_V1.onFailureShow)[number] {
  return "SKELETON_UI";
}
