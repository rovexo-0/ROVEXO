/**
 * ROVEXO SUPREME BLOOD CODE XXI
 * SPRINT V — SELL · PRIORITY ZERO EXECUTION
 *
 * STATUS: IN DEVELOPMENT · EXECUTION MODE · BLOOD CODE XXI LOCKED · 2026-07-23
 * NEVER REMOVE
 *
 * PRIORITY ZERO:
 * 1. PHOTO EXPERIENCE
 * 2. PUBLISH EXPERIENCE
 * 3. SUCCESS PAGE EXPERIENCE
 *
 * Official: http://localhost:3000/sell ONLY
 * Cursor must never invent Owner Product PASS / 100% / permanent freeze.
 */

export const SUPREME_BLOOD_CODE_XXI_V1 = {
  version: "21.0",
  codename: "SPRINT_V_SELL_PRIORITY_ZERO_EXECUTION",
  status: "100_COMPLETE_OWNER_CERTIFIED_PERMANENT_FREEZE",
  mode: "EXECUTION_MODE" as const,
  sprint: "V" as const,
  module: "SELL" as const,
  priorityZero: true,
  approvedByOwner: true,
  bloodCodeLocked: true,
  freezeLocked: true,
  permanentlyFrozen: true,
  complete100: true,
  ownerCertified: true,
  neverRemove: true,
  approvedAt: "2026-07-23",

  absoluteGoal: {
    qualities: ["FAST", "INTUITIVE", "PREMIUM", "MOBILE_FIRST"] as const,
    sellUnderOneMinuteWhenInfoReady: true,
    userFlow: [
      "ADD_PHOTOS",
      "COMPLETE_INFORMATION",
      "PRESS_PUBLISH",
      "SEE_SUCCESS_PAGE",
      "DONE",
    ] as const,
  } as const,

  priorityZeroOrder: [
    "PHOTO_EXPERIENCE",
    "PUBLISH_EXPERIENCE",
    "SUCCESS_PAGE_EXPERIENCE",
  ] as const,

  priorityIPhoto: {
    supported: [
      "Native iPhone Gallery",
      "Native Android Gallery",
      "Camera Support",
      "Multiple Images",
      "Image Preview",
      "Image Validation",
      "Image Replacement",
      "Image Removal",
      "Drag & Drop Reordering",
      "Smart Image Loading",
    ] as const,
    flow: [
      "OPEN_SELL",
      "ADD_PHOTOS",
      "PREVIEW_IMAGES",
      "REORDER",
      "REMOVE",
      "REPLACE",
      "VALIDATION_PASS",
      "CONTINUE_SELL_FLOW",
    ] as const,
    qa: [
      "1 Photo",
      "2 Photos",
      "5 Photos",
      "10 Photos",
      "Replace Images",
      "Delete Images",
      "Image Reordering",
      "Loading States",
      "Scroll Behaviour",
      "Mobile Behaviour",
      "Responsive Behaviour",
    ] as const,
    forbidden: [
      "Broken Uploads",
      "Failed Previews",
      "White Screens",
      "Upload Loops",
      "Infinite Loading",
      "Missing Images",
      "Empty Containers",
    ] as const,
  } as const,

  priorityIIPublish: {
    pressPublishOnlyOneTime: true,
    flow: ["PUBLISH", "VALIDATIONS", "PROCESSING", "PUBLISHING", "SUCCESS", "DONE"] as const,
    userMustNeverAsk: [
      "Did my item publish?",
      "Should I press Publish again?",
      "Why is nothing happening?",
    ] as const,
    states: [
      "Publishing…",
      "Please wait…",
      "Listing successfully published.",
      "SUCCESS_PAGE",
    ] as const,
    forbidden: [
      "Duplicate Listings",
      "Failed Redirects",
      "Multiple Publish Requests",
      "Infinite Loading States",
      "Broken Publish Actions",
    ] as const,
  } as const,

  priorityIIISuccess: {
    headline: "Listing Successfully Published",
    actionsOnly: ["View Listing", "Share Listing", "Sell Another Item"] as const,
    onlyThreeActionsAllowed: true,
    forbidden: [
      "Additional Flows",
      "Multiple Redirects",
      "Experimental Buttons",
      "Duplicate Actions",
    ] as const,
  } as const,

  priorityIVUiUx: {
    supported: [
      "Compact Premium Design",
      "Full Width Design",
      "Mobile First Design",
      "Responsive Behaviour",
      "Native Mobile Feeling",
      "Smooth Scroll Behaviour",
    ] as const,
    masterDevice: "IPHONE_17_PRO_MAX",
    mustNeverFeelLikeDesktopShrunkToMobile: true,
  } as const,

  priorityVOwnerCertification: [
    "Photo Experience",
    "Publish Experience",
    "Success Page Experience",
    "Mobile Experience",
    "Responsive Behaviour",
    "localhost Experience",
    "Production Readiness",
  ] as const,

  zeroRegressionMustNeverBreak: ["I", "II", "III", "IV"] as const,

  certificationChain: [
    "TYPESCRIPT_PASS",
    "ESLINT_PASS",
    "BUILD_PASS",
    "FUNCTIONAL_QA_PASS",
    "RESPONSIVE_QA_PASS",
    "MOBILE_QA_PASS",
    "VISUAL_QA_PASS",
    "NO_REGRESSION_QA_PASS",
    "AUTOMATIC_CERTIFICATION_PASS",
    "OWNER_CERTIFICATION_PASS",
    "100_COMPLETE",
    "PERMANENT_FREEZE",
  ] as const,

  localhostLaw: {
    official: "http://localhost:3000/sell",
    noImplementationOutsideSell: true,
  } as const,

  executionMode: {
    lessRules: true,
    moreCode: true,
    moreQa: true,
    moreImplementation: true,
    moreOwnerCertification: true,
    equals: "ROVEXO_V1_0",
  } as const,

  liveSprintStatus: {
    I: "LOCKED",
    II: "LOCKED",
    III: "LOCKED",
    IV: "LOCKED",
    V: "LOCKED",
    VI: "IN_DEVELOPMENT",
    VII: "FORBIDDEN_TO_START",
    VIII: "FORBIDDEN_TO_START",
  } as const,

  ssot: {
    code: "lib/supreme-blood-code-xxi-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xxi-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XXI_V1.md",
    sellPage: "features/sell/ui/SellPage.tsx",
    photos: "features/sell/ui/SellPhotoRail.tsx",
    publish: "lib/sell/publish-engine.ts",
    success: "components/sell/PublishSuccessDialog.tsx",
  } as const,

  parentLaws: {
    bloodXx: "lib/supreme-blood-code-xx-v1.ts",
    bloodXviii: "lib/supreme-blood-code-xviii-v1.ts",
    bloodXv: "lib/supreme-blood-code-xv-v1.ts",
    bloodXvi: "lib/supreme-blood-code-xvi-v1.ts",
    bloodXvii: "lib/supreme-blood-code-xvii-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    sellAbsoluteAuthority: "lib/sell/sell-absolute-authority-freeze-v1.ts",
  } as const,

  childLaws: {
    sprintVSell100CompletePermanentFreeze: "lib/supreme-blood-code-xxii-v1.ts",
    sprintViCheckoutApprovedToStart: "lib/supreme-blood-code-xxiii-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeXxiV1 = typeof SUPREME_BLOOD_CODE_XXI_V1;

export function isBloodXxiPriorityZeroSurface(
  surface: "photo" | "publish" | "success" | "other",
): boolean {
  return surface === "photo" || surface === "publish" || surface === "success";
}

export function resolveBloodXxiPermanentFreeze(input: {
  photoExperiencePass: boolean;
  publishExperiencePass: boolean;
  successPageExperiencePass: boolean;
  automaticCertificationPass: boolean;
  ownerCertificationPass: boolean;
  complete100: boolean;
  noRegressionPass: boolean;
}): "PERMANENT_FREEZE" | "NOT_READY" {
  return Object.values(input).every(Boolean) ? "PERMANENT_FREEZE" : "NOT_READY";
}
