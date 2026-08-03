/**
 * ROVEXO SUPREME BLOOD CODE XVIII
 * SPRINT V — SELL · APPROVED TO START
 *
 * STATUS: APPROVED TO START · BLOOD CODE XVIII LOCKED · 2026-07-23
 * NEVER REMOVE
 *
 * Sprint V may modify ONLY http://localhost:3000/sell
 * One Sell = one entry point = /sell
 * Live: IN_DEVELOPMENT — NOT 100% · NOT permanently frozen
 * until Owner Certification PASS (Blood XV).
 *
 * Banner "100% COMPLETE / PERMANENT FREEZE" = TARGET end-state only.
 * Cursor must never invent Owner Product PASS / freeze.
 */

export const SUPREME_BLOOD_CODE_XVIII_V1 = {
  version: "18.0",
  codename: "SPRINT_V_SELL_APPROVED_TO_START",
  status: "APPROVED_TO_START",
  sprint: "V" as const,
  module: "SELL" as const,
  developmentStatus: "100_COMPLETE_OWNER_CERTIFIED_PERMANENT_FREEZE" as const,
  targetEndState: "100_COMPLETE_PERMANENT_FREEZE" as const,
  /** Live truth — Owner Blood XXII. */
  permanentlyFrozen: true,
  complete100: true,
  ownerCertified: true,
  approvedByOwner: true,
  bloodCodeLocked: true,
  freezeLocked: false,
  permanentFreezePendingOwnerCertification: true,
  neverRemove: true,
  approvedAt: "2026-07-23",

  goal: {
    target: "THE_FASTEST_MOST_INTUITIVE_MOST_PREMIUM_MOBILE_SELL_EXPERIENCE",
    sellUnderOneMinuteWhenInfoReady: true,
    noConfusion: true,
    noDuplicates: true,
    noCompromises: true,
    qualities: ["FAST", "INTUITIVE", "COMPACT_PREMIUM", "MOBILE_FIRST"] as const,
  } as const,

  officialRoute: "/sell",
  officialLocalhost: "http://localhost:3000/sell",

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
      "Profile",
      "Settings",
      "Legal Center",
      "Help Center",
    ] as const,
  } as const,

  oneSellLaw: {
    oneImplementation: true,
    oneEntryPoint: "/sell",
    allowed: ["/sell"] as const,
    forbiddenEntryPoints: [
      "/sell-v2",
      "/sell-beta",
      "/sell-new",
      "/sell-redesign",
      "/sell-test",
      "/sell-wizard",
    ] as const,
  } as const,

  sellFlow: [
    "CATEGORY",
    "SUBCATEGORY",
    "ADD_PHOTOS",
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
  ] as const,

  required: [
    "Add Photos",
    "Native Gallery Support",
    "Camera Support",
    "Smart Image Validation",
    "Category Selection",
    "Brand Selection",
    "Colour Selection",
    "Condition Selection",
    "Parcel Size Selection",
    "Description Field",
    "Price Field",
    "UK Marketplace Validation",
    "Marketplace Policy Validation",
    "Smart Publish Validation",
    "Publish Button",
    "Success Page",
    "Share Listing",
    "View Listing",
    "Sell Another Item",
  ] as const,

  photoLaw: {
    supportedDevices: ["iPhone", "Android", "Tablet"] as const,
    supported: [
      "Native Gallery",
      "Camera Upload",
      "Multiple Images",
      "Image Preview",
      "Image Validation",
    ] as const,
    forbidden: [
      "Broken Uploads",
      "White Screens",
      "Empty Images",
      "Upload Loops",
      "Failed Previews",
    ] as const,
  } as const,

  uiLaw: {
    mobileFirst: true,
    masterDevice: "IPHONE_17_PRO_MAX",
    fullWidthDesign: true,
    compactPremiumDesign: true,
  } as const,

  searchBarLaw: {
    forbiddenOnSell: true,
    mustNeverContain: [
      "Search Bar",
      "Marketplace Header",
      "Homepage Header",
    ] as const,
  } as const,

  bottomNavigationLaw: {
    visibleOnSellPage: true,
    exceptFlowFocusedStatesWhereUxRequires: true,
  } as const,

  forbidden: [
    "Multi Step Wizard",
    "Desktop First Design",
    "Duplicate Buttons",
    "Duplicate Fields",
    "Duplicate Entry Points",
    "Experimental UI",
    "Temporary Implementations",
    "Beta Implementations",
    "Partial Implementations",
  ] as const,

  automationLaw: {
    userFlow: ["Take Photos", "Add Details", "Press Publish", "Done"] as const,
    userMustNeverAsk: [
      "WHERE DO I CLICK NEXT?",
      "HOW DO I SELL THIS?",
    ] as const,
  } as const,

  successPage: {
    required: ["View Listing", "Share Listing", "Sell Another Item"] as const,
    noAdditionalFlows: true,
  } as const,

  requiredTestChain: [
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

  productPassOwnerMustCertify: [
    "Mobile Experience",
    "Photo Experience",
    "Publish Experience",
    "Responsive Behaviour",
    "Compact Premium Design",
    "localhost Experience",
    "Production Readiness",
  ] as const,

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

  absoluteCompletionLaw: [
    "NO_OWNER_CERTIFICATION_EQUALS_NO_100_COMPLETE",
    "NO_100_COMPLETE_EQUALS_NO_PERMANENT_FREEZE",
    "NO_PERMANENT_FREEZE_EQUALS_NO_NEXT_SPRINT",
  ] as const,

  ssot: {
    code: "lib/supreme-blood-code-xviii-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xviii-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XVIII_V1.md",
    sellPage: "features/sell/ui/SellPage.tsx",
    sellAbsoluteAuthority: "lib/sell/sell-absolute-authority-freeze-v1.ts",
  } as const,

  parentLaws: {
    bloodXi: "lib/supreme-blood-code-xi-v1.ts",
    bloodXv: "lib/supreme-blood-code-xv-v1.ts",
    bloodXvi: "lib/supreme-blood-code-xvi-v1.ts",
    bloodXvii: "lib/supreme-blood-code-xvii-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    homepageSearchBarOnly: "lib/header/homepage-search-bar-only-v1.ts",
    sellAbsoluteAuthority: ".cursor/rules/sell-absolute-authority-v1-freeze.mdc",
  } as const,

  childLaws: {
    sprintIvWalletWaitingOwnerCertification: "lib/supreme-blood-code-xix-v1.ts",
    sprintVSellExecutionMode: "lib/supreme-blood-code-xx-v1.ts",
    sprintVSellPriorityZeroExecution: "lib/supreme-blood-code-xxi-v1.ts",
    sprintVSell100CompletePermanentFreeze: "lib/supreme-blood-code-xxii-v1.ts",
    sprintViCheckoutApprovedToStart: "lib/supreme-blood-code-xxiii-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeXviiiV1 = typeof SUPREME_BLOOD_CODE_XVIII_V1;

export function isBloodXviiiSellRouteAllowed(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return path === "/sell" || path.startsWith("/sell/");
}

export function isBloodXviiiForbiddenEntryPoint(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return (
    SUPREME_BLOOD_CODE_XVIII_V1.oneSellLaw.forbiddenEntryPoints as readonly string[]
  ).some((entry) => path === entry || path.startsWith(`${entry}/`));
}

export function resolveBloodXviiiScopePolicy(pathname: string): {
  allowed: boolean;
  policy: readonly string[];
} {
  if (isBloodXviiiForbiddenEntryPoint(pathname)) {
    return {
      allowed: false,
      policy: ["STOP", "FORBIDDEN_ENTRY_POINT", "USE_/sell_ONLY"] as const,
    };
  }
  if (isBloodXviiiSellRouteAllowed(pathname)) {
    return { allowed: true, policy: ["FIX_WITHIN_/sell"] as const };
  }
  return {
    allowed: false,
    policy: ["STOP", "REPORT", "DO_NOT_FIX", "WAIT_FOR_OWNER_APPROVAL"] as const,
  };
}

export function resolveBloodXviiiPermanentFreeze(input: {
  mobileExperience: boolean;
  photoExperience: boolean;
  publishExperience: boolean;
  responsiveBehaviour: boolean;
  compactPremiumDesign: boolean;
  localhostExperience: boolean;
  productionReadiness: boolean;
  automaticCertificationPass: boolean;
  ownerCertificationPass: boolean;
  complete100: boolean;
}): "PERMANENT_FREEZE" | "NOT_READY" {
  return Object.values(input).every(Boolean) ? "PERMANENT_FREEZE" : "NOT_READY";
}

export function canStartSprintViCheckout(input: {
  sellOwnerCertified: boolean;
  sellComplete100: boolean;
  sellPermanentFreeze: boolean;
}): boolean {
  return (
    input.sellOwnerCertified &&
    input.sellComplete100 &&
    input.sellPermanentFreeze
  );
}
