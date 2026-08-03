/**
 * ROVEXO SUPREME BLOOD CODE XX
 * SPRINT V — SELL · EXECUTION MODE · APPROVED TO START
 *
 * STATUS: IN DEVELOPMENT · EXECUTION MODE · BLOOD CODE XX LOCKED · 2026-07-23
 * NEVER REMOVE
 *
 * LESS RULES + MORE CODE + MORE IMPLEMENTATION + MORE QA + MORE OWNER CERTIFICATION
 * = ROVEXO v1.0
 *
 * Sprint V may modify ONLY http://localhost:3000/sell
 * Live: IN_DEVELOPMENT — NOT 100% · NOT permanently frozen until Owner Certification.
 * Cursor must never invent Owner Product PASS / freeze.
 */

export const SUPREME_BLOOD_CODE_XX_V1 = {
  version: "20.0",
  codename: "SPRINT_V_SELL_EXECUTION_MODE",
  status: "100_COMPLETE_OWNER_CERTIFIED_PERMANENT_FREEZE",
  mode: "EXECUTION_MODE" as const,
  sprint: "V" as const,
  module: "SELL" as const,
  approvedToStart: true,
  approvedByOwner: true,
  bloodCodeLocked: true,
  freezeLocked: true,
  permanentlyFrozen: true,
  complete100: true,
  ownerCertified: true,
  neverRemove: true,
  approvedAt: "2026-07-23",

  executionMode: {
    lessRules: true,
    moreCode: true,
    moreImplementation: true,
    moreQa: true,
    moreOwnerCertification: true,
    equals: "ROVEXO_V1_0",
  } as const,

  absoluteScopeLaw: {
    mayModifyOnly: "http://localhost:3000/sell",
    forbiddenToTouch: [
      "Homepage",
      "Inbox",
      "Conversation Hub",
      "Orders",
      "Wallet",
      "Checkout",
      "Shipping",
      "Account",
      "Settings",
      "Profile",
      "Legal Center",
      "Help Center",
    ] as const,
  } as const,

  sellLaw: {
    oneImplementation: true,
    oneEntryPoint: "/sell",
    officialUrl: "http://localhost:3000/sell",
    allowedOnly: ["/sell"] as const,
  } as const,

  sellExperienceLaw: {
    qualities: ["FAST", "INTUITIVE", "MINIMAL", "PREMIUM", "MOBILE_FIRST"] as const,
    userMustNeverAsk: [
      "Where do I click next?",
      "What information is missing?",
      "How do I publish my item?",
      "Why can't I upload my photos?",
    ] as const,
  } as const,

  masterSellFlow: [
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
    "VIEW_OR_SHARE_OR_SELL_ANOTHER",
  ] as const,

  addPhotos: {
    supported: [
      "Native iPhone Gallery",
      "Native Android Gallery",
      "Camera Support",
      "Multiple Images",
      "Image Preview",
      "Smart Image Validation",
      "Drag & Drop Ordering",
      "Remove Images",
      "Replace Images",
    ] as const,
    forbidden: [
      "Broken Uploads",
      "White Screens",
      "Empty Previews",
      "Failed Uploads",
      "Infinite Loading",
      "Upload Loops",
    ] as const,
  } as const,

  automaticValidations: {
    supported: [
      "Required Fields Validation",
      "Price Validation",
      "Marketplace Policy Validation",
      "UK Rules Validation",
      "Empty Fields Validation",
      "Photo Validation",
      "Parcel Validation",
      "Category Validation",
      "Description Validation",
    ] as const,
    withoutValidations: "PUBLISH_FAILS",
  } as const,

  publishLaw: {
    pressPublishOnlyOneTime: true,
    afterSuccessOnly: ["View Listing", "Share Listing", "Sell Another Item"] as const,
    noAdditionalFlows: true,
  } as const,

  successPageLaw: {
    supported: ["View Listing", "Share Listing", "Sell Another Item"] as const,
    forbidden: [
      "Restart Sell Flow",
      "Broken Redirects",
      "Multiple Publish Requests",
      "Duplicate Listings",
    ] as const,
  } as const,

  searchBarLaw: {
    forbiddenOnSell: true,
    mustNeverContain: ["Search Bar", "Homepage Header", "Marketplace Header"] as const,
  } as const,

  uiLaw: {
    supported: [
      "Compact Premium Design",
      "Mobile First",
      "Full Width Design",
      "Responsive Behaviour",
    ] as const,
    masterDevice: "IPHONE_17_PRO_MAX",
    feelLike: ["TAKING_A_PHOTO", "ADDING_INFORMATION", "PRESSING_PUBLISH", "DONE"] as const,
  } as const,

  bottomNavigationLaw: {
    visible: true,
    exceptFlowFocusedStatesOnlyIfUxRequires: true,
  } as const,

  zeroRegressionLaw: {
    mustNeverBreak: ["I", "II", "III", "IV"] as const,
    regressionExistsEquals: "PRODUCT_FAIL",
  } as const,

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
    "100_COMPLETE",
    "PERMANENT_FREEZE",
  ] as const,

  /**
   * Live roadmap — Owner Blood XX declaration.
   * Sprint IV = LOCKED (do not touch during Sell execution).
   * Does not invent Wallet 100%/permanent freeze flags beyond Owner table.
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

  absoluteOwnerLaw: {
    ownerMustReceiveOnly: [
      "Production Ready Products",
      "QA Certified Products",
      "Automatically Certified Products",
      "Regression Free Products",
      "Mobile Certified Products",
      "100% Complete Products",
    ] as const,
    ownerMustNeverReceive: [
      "Beta Products",
      "Partial Products",
      "Experimental Products",
      "Untested Products",
    ] as const,
  } as const,

  localhostLaw: {
    official: "http://localhost:3000/sell",
    allImplementationsVisibleOn: "http://localhost:3000",
  } as const,

  goal: {
    sellUnderOneMinuteWhenInfoReady: true,
    qualities: ["FAST", "INTUITIVE", "PREMIUM", "PRODUCTION_READY"] as const,
  } as const,

  ssot: {
    code: "lib/supreme-blood-code-xx-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xx-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XX_V1.md",
    sellPage: "features/sell/ui/SellPage.tsx",
    sellAbsoluteAuthority: "lib/sell/sell-absolute-authority-freeze-v1.ts",
  } as const,

  parentLaws: {
    bloodXviii: "lib/supreme-blood-code-xviii-v1.ts",
    bloodXix: "lib/supreme-blood-code-xix-v1.ts",
    bloodXv: "lib/supreme-blood-code-xv-v1.ts",
    bloodXvi: "lib/supreme-blood-code-xvi-v1.ts",
    bloodXvii: "lib/supreme-blood-code-xvii-v1.ts",
    bloodXi: "lib/supreme-blood-code-xi-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    homepageSearchBarOnly: "lib/header/homepage-search-bar-only-v1.ts",
    sellAbsoluteAuthority: ".cursor/rules/sell-absolute-authority-v1-freeze.mdc",
  } as const,

  childLaws: {
    sprintVSellPriorityZeroExecution: "lib/supreme-blood-code-xxi-v1.ts",
    sprintVSell100CompletePermanentFreeze: "lib/supreme-blood-code-xxii-v1.ts",
    sprintViCheckoutApprovedToStart: "lib/supreme-blood-code-xxiii-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeXxV1 = typeof SUPREME_BLOOD_CODE_XX_V1;

export function isBloodXxSellRouteAllowed(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return path === "/sell" || path.startsWith("/sell/");
}

export function resolveBloodXxScopePolicy(pathname: string): {
  allowed: boolean;
  policy: readonly string[];
} {
  if (isBloodXxSellRouteAllowed(pathname)) {
    return { allowed: true, policy: ["EXECUTE_WITHIN_/sell"] as const };
  }
  return {
    allowed: false,
    policy: ["STOP", "FORBIDDEN_CROSS_MODULE", "SELL_ONLY"] as const,
  };
}

export function resolveBloodXxPermanentFreeze(input: {
  automaticCertificationPass: boolean;
  ownerCertificationPass: boolean;
  complete100: boolean;
  noRegressionPass: boolean;
}): "PERMANENT_FREEZE" | "NOT_READY" {
  return Object.values(input).every(Boolean) ? "PERMANENT_FREEZE" : "NOT_READY";
}

export function isBloodXxBottomNavVisibleOnSell(flowFocusedStateHidingNav: boolean): boolean {
  if (flowFocusedStateHidingNav) return false;
  return SUPREME_BLOOD_CODE_XX_V1.bottomNavigationLaw.visible;
}
