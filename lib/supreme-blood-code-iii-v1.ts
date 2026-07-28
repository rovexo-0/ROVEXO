/**
 * ROVEXO SUPREME BLOOD CODE III — PREVIEW VIEW CERTIFICATION
 * ABSOLUTE OWNER VISUAL APPROVAL · PERMANENT FREEZE · NEVER REMOVE
 *
 * STATUS: OWNER APPROVED · LOCKED · FROZEN · 2026-07-23
 *
 * Parent: Supreme Blood Code I · II (Zero Regression) · Constitution · Absolute Master Freeze
 * Aligns with: Global UI Approval Gate · Single Preview Link SSOT · Final Release Protection
 *
 * ABSOLUTE LAW:
 * IF THE OWNER CANNOT SEE IT → THE USER CANNOT USE IT → THE PRODUCT DOES NOT EXIST → CERTIFICATION = FAIL.
 */

export const SUPREME_BLOOD_CODE_III_V1 = {
  version: "3.0",
  codename: "PREVIEW_VIEW_CERTIFICATION",
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

  firstPrinciple: {
    ifUserCannotSeeIt: "IT_DOES_NOT_EXIST",
  } as const,

  notAllowed: [
    "WHITE_SCREEN",
    "EMPTY_SCREEN",
    "BROKEN_UI",
    "BROKEN_IMAGE",
    "MISSING_BUTTON",
    "LOADING_FOREVER",
    "PREVIEW_FAIL",
    "OWNER_CANNOT_VERIFY",
    "PARTIAL_IMPLEMENTATION",
    "CODE_IS_READY",
    "ALMOST_READY",
    "95%_DONE",
  ] as const,

  viewResultsOnly: ["VIEW_PASS", "VIEW_FAIL"] as const,

  certificationPipeline: [
    "CODE",
    "TYPESCRIPT",
    "ESLINT",
    "BUILD",
    "TESTS",
    "PREVIEW",
    "VISUAL_PREVIEW",
    "OWNER_VIEW",
    "FREEZE",
    "COMMIT",
    "PUSH",
    "CERTIFY",
  ] as const,

  automaticSprintFailIf: [
    "PREVIEW_FAIL",
    "WHITE_SCREEN",
    "BROKEN_IMAGE",
    "BUTTON_MISSING",
    "PAY_NOW_WRONG",
    "BROKEN_RESPONSIVE",
    "OWNER_CANNOT_VERIFY",
  ] as const,

  previewMustDisplay: [
    "IMAGES",
    "TITLES",
    "BUTTONS",
    "PRICES",
    "PAY_NOW",
    "MAKE_OFFER",
    "TRACKING",
    "LABELS",
    "NOTIFICATIONS",
    "MESSAGES",
    "HEADER",
    "SCROLL",
    "RESPONSIVE_UI",
    "ANIMATIONS",
    "STATUS",
    "TOTALS",
    "PLATFORM_FLOWS",
    "BUYER_FLOWS",
    "SELLER_FLOWS",
  ] as const,

  zeroRegressionLaw: {
    newCodeMustNotBreakOldCode: true,
    examples: [
      { later: "SPRINT_50", mustNotBreak: "SPRINT_1" },
      { later: "SPRINT_100", mustNotBreak: "PAY_NOW" },
      { later: "SPRINT_200", mustNotBreak: "TRACKING" },
      { later: "SPRINT_500", mustNotBreak: "CHECKOUT" },
    ] as const,
  } as const,

  futureSprintMustVerify: [
    "OLD",
    "NEW",
    "PREVIEW",
    "VISUAL_VIEW",
    "RESPONSIVE",
    "OWNER_APPROVAL",
    "ZERO_REGRESSION",
  ] as const,

  absoluteLaws: {
    codePassDoesNotMeanProductPass: true,
    previewPassDoesNotMeanProductPass: true,
  } as const,

  productPassRequiresAll: [
    "CODE_PASS",
    "TEST_PASS",
    "PREVIEW_PASS",
    "VISUAL_PASS",
    "OWNER_PASS",
    "ZERO_REGRESSION_PASS",
    "CERTIFICATION_PASS",
  ] as const,

  finalLaw:
    "IF IT IS NOT TESTED, VERIFIED, PREVIEWED, VISUALLY APPROVED, OWNER APPROVED, ZERO REGRESSION CERTIFIED — IT DOES NOT EXIST.",

  absoluteLawOfRovexo:
    "IF THE OWNER CANNOT SEE IT → THE USER CANNOT USE IT → THE PRODUCT DOES NOT EXIST → CERTIFICATION = FAIL.",

  ssot: {
    code: "lib/supreme-blood-code-iii-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-iii-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_III_V1.md",
  } as const,

  parentLaws: {
    supremeBloodCodeI: "lib/supreme-blood-code-v1.ts",
    supremeBloodCodeIi: "lib/supreme-blood-code-ii-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    globalUiApprovalGate: ".cursor/rules/global-ui-approval-gate.mdc",
    singlePreviewLink: ".cursor/rules/single-preview-link-ssot-v1.mdc",
    onePreviewLinkAbsolute: ".cursor/rules/one-preview-link-absolute-v1.mdc",
  } as const,

  childLaws: {
    viewAnalyzer: "lib/view-analyzer-v1.ts",
    whiteScreenKillSwitch: "lib/supreme-blood-code-iv-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeIiiV1 = typeof SUPREME_BLOOD_CODE_III_V1;

export type ViewGateResult = "VIEW_PASS" | "VIEW_FAIL";

/** View is binary — anything except explicit verified PASS is FAIL. */
export function resolveViewGate(input: {
  visuallyVisible: boolean;
  ownerCanVerify: boolean;
  whiteScreen: boolean;
  brokenUi: boolean;
  previewFailed: boolean;
}): ViewGateResult {
  if (input.whiteScreen || input.brokenUi || input.previewFailed) return "VIEW_FAIL";
  if (!input.visuallyVisible || !input.ownerCanVerify) return "VIEW_FAIL";
  return "VIEW_PASS";
}

/** Product PASS only when every required pass flag is true. */
export function resolveProductPass(flags: {
  codePass: boolean;
  testPass: boolean;
  previewPass: boolean;
  visualPass: boolean;
  ownerPass: boolean;
  zeroRegressionPass: boolean;
  certificationPass: boolean;
}): "PASS" | "FAIL" {
  const required = [
    flags.codePass,
    flags.testPass,
    flags.previewPass,
    flags.visualPass,
    flags.ownerPass,
    flags.zeroRegressionPass,
    flags.certificationPass,
  ];
  return required.every(Boolean) ? "PASS" : "FAIL";
}

export function isPartialOrAlmostClaimForbidden(claim: string): boolean {
  const normalized = claim.trim().toUpperCase().replace(/\s+/g, "_");
  return (SUPREME_BLOOD_CODE_III_V1.notAllowed as readonly string[]).some(
    (item) =>
      normalized.includes(item) ||
      normalized.includes("ALMOST") ||
      normalized.includes("95%") ||
      normalized.includes("CODE_IS_READY") ||
      normalized.includes("PARTIAL"),
  );
}
