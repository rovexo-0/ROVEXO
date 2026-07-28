/**
 * ROVEXO SUPREME BLOOD CODE XI
 * DEVELOPMENT FREEZE LAW
 *
 * STATUS: APPROVED · PERMANENT LAW · 2026-07-23
 * NEVER REMOVE
 *
 * ONE SPRINT = ONE MODULE.
 * Sprint III may touch ONLY /orders.
 * Bugs outside /orders → STOP · REPORT · WAIT FOR OWNER.
 */

export const SUPREME_BLOOD_CODE_XI_V1 = {
  version: "11.0",
  codename: "DEVELOPMENT_FREEZE_LAW",
  status: "APPROVED",
  permanent: true,
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  neverRemove: true,
  approvedAt: "2026-07-23",

  goldenLaw: [
    "ONE_FEATURE_ONE_ENTRY_POINT",
    "ONE_MODULE_ONE_IMPLEMENTATION",
    "ONE_SPRINT_ONE_MODULE",
    "ONE_MODULE_ONE_FREEZE",
    "ONE_MODULE_ONE_CERTIFICATION",
    "NO_DUPLICATES",
  ] as const,

  sprints: {
    I: { module: "INBOX", route: "/inbox", status: "LOCKED" },
    II: { module: "CONVERSATION_HUB", route: "/inbox/conversation", status: "LOCKED" },
    III: { module: "ORDERS", route: "/orders", status: "LOCKED", completion: "100_COMPLETE" },
    IV: { module: "WALLET", route: "/wallet", status: "LOCKED" },
    V: { module: "SELL", route: "/sell", status: "LOCKED" },
    VI: { module: "CHECKOUT", route: "/checkout", status: "IN_DEVELOPMENT" },
    VII: { module: "ACCOUNT", route: "/account", status: "FORBIDDEN_TO_START" },
  } as const,

  currentSprint: "VI" as const,
  currentModule: "CHECKOUT" as const,
  currentAllowedRoute: "/checkout" as const,

  sprintIiiForbidden: [
    "Homepage",
    "Search",
    "Inbox",
    "Notifications",
    "Conversation",
    "Wallet",
    "Sell",
    "Checkout",
    "Saved",
    "Account",
    "Settings",
  ] as const,

  sprintIiiAllowed: ["/orders"] as const,

  bugOutsideModulePolicy: ["STOP", "REPORT", "DO_NOT_FIX", "WAIT_FOR_OWNER_APPROVAL"] as const,

  moduleMustHave: [
    "ONE_IMPLEMENTATION",
    "ONE_DESIGN",
    "ONE_HEADER",
    "ONE_RESPONSIVE_VERSION",
    "ONE_FREEZE",
    "ONE_QA",
    "ONE_CERTIFICATION",
    "ONE_PRODUCTION_VERSION",
  ] as const,

  freezeWhenComplete: true,
  freezeAllowedExceptions: [
    "Security fixes",
    "Critical bug fixes",
    "Owner approval",
  ] as const,

  freezeForbidden: [
    "redesign",
    "duplicated components",
    "duplicated pages",
    "duplicated implementations",
    "temporary fixes",
    "experimental implementations",
  ] as const,

  officialLocalhost: "http://localhost:3000",

  gateRequirements: [
    "TypeScript PASS",
    "ESLint PASS",
    "Build PASS",
    "Responsive PASS",
    "QA PASS",
    "localhost PASS",
    "Mobile PASS",
    "Production PASS",
  ] as const,

  searchBarLaw: {
    allowedOnlyOn: "/",
    mustBe: "UNMOUNTED",
    hideTricksForbidden: true,
    ssot: "lib/header/homepage-search-bar-only-v1.ts",
  } as const,

  appliesTo: [
    "Cursor",
    "Developers",
    "Future sprints",
    "QA",
    "Production",
    "Preview Deployments",
  ] as const,

  ssot: {
    code: "lib/supreme-blood-code-xi-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xi-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XI_V1.md",
  } as const,

  parentLaws: {
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    homepageSearchBarOnly: "lib/header/homepage-search-bar-only-v1.ts",
  } as const,
  childLaws: {
    sprintIiiOrdersPermanentFreeze: "lib/supreme-blood-code-xii-v1.ts",
    sprintIvWalletApprovedToStart: "lib/supreme-blood-code-xiii-v1.ts",
    sprintIvWalletDevelopmentFreezeLaw: "lib/supreme-blood-code-xiv-v1.ts",
    ownerCertificationAndFreezeLaw: "lib/supreme-blood-code-xv-v1.ts",
    zeroRegressionMasterLaw: "lib/supreme-blood-code-xvi-v1.ts",
    automaticCertificationMasterLaw: "lib/supreme-blood-code-xvii-v1.ts",
    sprintVSellApprovedToStart: "lib/supreme-blood-code-xviii-v1.ts",
    sprintIvWalletWaitingOwnerCertification: "lib/supreme-blood-code-xix-v1.ts",
    sprintVSellExecutionMode: "lib/supreme-blood-code-xx-v1.ts",
    sprintVSellPriorityZeroExecution: "lib/supreme-blood-code-xxi-v1.ts",
    sprintVSell100CompletePermanentFreeze: "lib/supreme-blood-code-xxii-v1.ts",
    sprintViCheckoutApprovedToStart: "lib/supreme-blood-code-xxiii-v1.ts",
    absoluteFinancialLawFreeze: "lib/supreme-blood-code-xxiv-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeXiV1 = typeof SUPREME_BLOOD_CODE_XI_V1;

export function isSprintIiiRouteAllowed(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return path === "/orders" || path.startsWith("/orders/");
}

export function isSprintIiiSurfaceForbidden(surface: string): boolean {
  const normalized = surface.trim().toLowerCase();
  return (SUPREME_BLOOD_CODE_XI_V1.sprintIiiForbidden as readonly string[]).some(
    (item) => item.toLowerCase() === normalized,
  );
}

export function resolveBloodXiBugPolicy(pathname: string): {
  allowed: boolean;
  policy: readonly string[];
} {
  if (isSprintIiiRouteAllowed(pathname)) {
    return { allowed: true, policy: ["FIX_WITHIN_/orders"] as const };
  }
  return {
    allowed: false,
    policy: SUPREME_BLOOD_CODE_XI_V1.bugOutsideModulePolicy,
  };
}
