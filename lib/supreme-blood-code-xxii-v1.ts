/**
 * ROVEXO SUPREME BLOOD CODE XXII
 * SPRINT V — SELL · 100% COMPLETE · OWNER CERTIFIED · PERMANENT FREEZE
 *
 * STATUS: OWNER-DECLARED VIA BLOOD XXII · 2026-07-23
 * NEVER REMOVE
 *
 * Official: http://localhost:3000/sell
 * One Sell = one implementation = /sell only
 *
 * Sprint VI Checkout = APPROVED TO START (Blood XXII)
 * Sprint VII–VIII = FORBIDDEN TO START
 *
 * Post-freeze Sell edits: critical security / production bugs / legal only
 * with Owner approval (Blood XV/XVI).
 */

export const SUPREME_BLOOD_CODE_XXII_V1 = {
  version: "22.0",
  codename: "SPRINT_V_SELL_100_COMPLETE_PERMANENT_FREEZE",
  status: "100_COMPLETE_OWNER_CERTIFIED_PERMANENT_FREEZE",
  sprint: "V" as const,
  module: "SELL" as const,
  target: ["100_COMPLETE", "OWNER_CERTIFIED", "PERMANENT_FREEZE"] as const,
  approvedByOwner: true,
  bloodCodeLocked: true,
  freezeLocked: true,
  permanentlyFrozen: true,
  complete100: true,
  ownerCertified: true,
  zeroRegressionProtected: true,
  productionReady: true,
  neverRemove: true,
  approvedAt: "2026-07-23",

  absoluteGoal: {
    userFlow: [
      "OPEN_SELL",
      "ADD_PHOTOS",
      "ADD_INFORMATION",
      "PRESS_PUBLISH",
      "SEE_SUCCESS_PAGE",
      "DONE",
    ] as const,
    feel: ["FAST", "INTUITIVE", "PREMIUM", "NATIVE_MOBILE"] as const,
  } as const,

  threeSecondLaw: {
    userMustUnderstandHowToSellInLessThan3Seconds: true,
    ifUserConfused: "PRODUCT_FAIL",
  } as const,

  officialRoute: "/sell",
  officialLocalhost: "http://localhost:3000/sell",
  oneSellLaw: {
    oneImplementation: true,
    oneEntryPoint: "/sell",
    allowedOnly: ["/sell"] as const,
  } as const,

  photoExperience100: {
    supported: [
      "Native Gallery",
      "Camera Support",
      "Multiple Images",
      "Image Preview",
      "Replace Images",
      "Remove Images",
      "Image Reordering",
      "Image Validations",
      "Smart Loading",
      "Responsive Behaviour",
    ] as const,
    mustFeelNativeOn: ["iPhone", "Android", "Tablets"] as const,
  } as const,

  sellFlow: [
    "OPEN_SELL",
    "ADD_PHOTOS",
    "CATEGORY",
    "SUBCATEGORY",
    "TITLE",
    "BRAND",
    "COLOUR",
    "CONDITION",
    "PARCEL_SIZE",
    "DESCRIPTION",
    "PRICE",
    "AUTOMATIC_VALIDATIONS",
    "PUBLISH",
    "SUCCESS_PAGE",
    "DONE",
  ] as const,

  noAdditionalFlows: true,

  publishExperience: {
    flow: [
      "PUBLISH",
      "VALIDATIONS",
      "PROCESSING",
      "PUBLISHING",
      "PLEASE_WAIT",
      "LISTING_SUCCESSFULLY_PUBLISHED",
      "SUCCESS_PAGE",
    ] as const,
    userMustNever: [
      "Press Publish Twice",
      "Wonder If Publish Failed",
      "Experience Silent Loading",
      "Experience Broken Redirects",
      "Experience Duplicate Listings",
    ] as const,
  } as const,

  successPage: {
    headline: "Listing Successfully Published",
    actionsOnly: ["View Listing", "Share Listing", "Sell Another Item"] as const,
    onlyThreeActionsAllowed: true,
  } as const,

  uiUxLaw: {
    supported: [
      "Compact Premium Design",
      "Full Width Design",
      "Mobile First Design",
      "Smooth Scroll Behaviour",
      "Native Mobile Feeling",
      "Responsive Behaviour",
    ] as const,
    masterDevice: "IPHONE_17_PRO_MAX",
    mustNeverFeelLikeDesktopShrunkToMobile: true,
  } as const,

  searchBarLaw: {
    forbiddenOnSell: true,
    mustNeverContain: ["Search Bar", "Homepage Header", "Marketplace Header"] as const,
  } as const,

  bottomNavigationLaw: {
    visible: true,
    exceptFlowFocusedStatesOnlyIfUxRequires: true,
  } as const,

  sellExperienceQaMustPass: [
    "1 Photo Publish",
    "5 Photos Publish",
    "10 Photos Publish",
    "Replace Photos",
    "Remove Photos",
    "Image Reordering",
    "Required Fields Validation",
    "Publish Validation",
    "Success Page Validation",
    "View Listing Validation",
    "Share Listing Validation",
    "Sell Another Item Validation",
    "Mobile Certification",
    "Responsive Certification",
    "localhost Certification",
  ] as const,

  zeroRegressionMustNeverBreak: ["I", "II", "III", "IV"] as const,
  withoutZeroRegressionPass: "PRODUCT_FAIL",

  automaticCertificationChain: [
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
    "PRODUCTION_READY_PASS",
    "100_COMPLETE",
    "PERMANENT_FREEZE",
  ] as const,

  ownerCertificationMustCertify: [
    "Photo Experience",
    "Publish Experience",
    "Success Page Experience",
    "Mobile Experience",
    "Responsive Behaviour",
    "Production Readiness",
    "localhost Experience",
  ] as const,

  withoutOwnerCertificationPass: "PRODUCT_FAIL",

  /**
   * Live roadmap — Owner Blood XXII declaration.
   * Sprint V = 100% COMPLETE + OWNER CERTIFIED + PERMANENT FREEZE
   * Sprint VI Checkout = APPROVED TO START
   */
  liveSprintStatus: {
    I: "LOCKED",
    II: "LOCKED",
    III: "LOCKED",
    IV: "LOCKED",
    V: "LOCKED",
    VI: "LOCKED",
    VII: "FORBIDDEN_TO_START",
    VIII: "FORBIDDEN_TO_START",
  } as const,

  afterOwnerCertification: [
    "LOCKED",
    "ZERO_REGRESSION_PROTECTED",
    "PERMANENTLY_FROZEN",
  ] as const,

  postFreezeAllowed: [
    "Critical Security Fixes",
    "Critical Production Bugs",
    "Critical Legal Compliance Fixes",
  ] as const,

  postFreezeOwnerApprovalRequired: true,

  absoluteGoalSummary: {
    sellFastestMostIntuitiveOnMobile: true,
    noConfusion: true,
    noDuplicates: true,
    noCompromises: true,
    qualities: ["FAST", "INTUITIVE", "PREMIUM", "PRODUCTION_READY"] as const,
  } as const,

  ssot: {
    code: "lib/supreme-blood-code-xxii-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xxii-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XXII_V1.md",
    sellPage: "features/sell/ui/SellPage.tsx",
  } as const,

  parentLaws: {
    bloodXxi: "lib/supreme-blood-code-xxi-v1.ts",
    bloodXx: "lib/supreme-blood-code-xx-v1.ts",
    bloodXv: "lib/supreme-blood-code-xv-v1.ts",
    bloodXvi: "lib/supreme-blood-code-xvi-v1.ts",
    bloodXvii: "lib/supreme-blood-code-xvii-v1.ts",
    bloodXi: "lib/supreme-blood-code-xi-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    sellAbsoluteAuthority: "lib/sell/sell-absolute-authority-freeze-v1.ts",
    homepageSearchBarOnly: "lib/header/homepage-search-bar-only-v1.ts",
  } as const,

  childLaws: {
    sprintViCheckoutApprovedToStart: "lib/supreme-blood-code-xxiii-v1.ts",
    absoluteFinancialLawFreeze: "lib/supreme-blood-code-xxiv-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeXxiiV1 = typeof SUPREME_BLOOD_CODE_XXII_V1;

export function isBloodXxiiSellPermanentlyFrozen(): boolean {
  return (
    SUPREME_BLOOD_CODE_XXII_V1.permanentlyFrozen &&
    SUPREME_BLOOD_CODE_XXII_V1.ownerCertified &&
    SUPREME_BLOOD_CODE_XXII_V1.complete100
  );
}

export function canStartSprintViCheckout(): boolean {
  // Sprint VI Checkout is Owner-certified LOCKED (Blood XXIII). Re-start gate stays closed.
  return false;
}

export function isBloodXxiiSellModificationAllowed(input: {
  changeKind: string;
  ownerApproval: boolean;
}): boolean {
  if (!isBloodXxiiSellPermanentlyFrozen()) return true;
  if (!input.ownerApproval) return false;
  const normalized = input.changeKind.trim().toLowerCase();
  return (
    /critical\s+security/.test(normalized) ||
    /critical\s+production\s+bug/.test(normalized) ||
    /critical\s+legal\s+compliance/.test(normalized)
  );
}
