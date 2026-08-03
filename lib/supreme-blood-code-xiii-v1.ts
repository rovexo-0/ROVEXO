/**
 * ROVEXO SUPREME BLOOD CODE XIII
 * SPRINT IV — WALLET · APPROVED TO START
 *
 * STATUS: APPROVED · IN DEVELOPMENT · 2026-07-23
 * NEVER REMOVE
 *
 * Official route: http://localhost:3000/wallet
 * Locked modules (I–III) must not be modified.
 * After Owner certification → permanent freeze.
 */

export const SUPREME_BLOOD_CODE_XIII_V1 = {
  version: "13.0",
  codename: "SPRINT_IV_WALLET_APPROVED_TO_START",
  status: "APPROVED_TO_START",
  sprint: "IV" as const,
  module: "WALLET" as const,
  developmentStatus: "LOCKED" as const,
  approvedByOwner: true,
  freezeLocked: false,
  permanentFreezePendingOwnerCertification: true,
  approvedAt: "2026-07-23",

  officialRoute: "/wallet",
  officialLocalhost: "http://localhost:3000/wallet",

  lockedModules: {
    I: { module: "INBOX", status: "LOCKED" },
    II: { module: "CONVERSATION_HUB", status: "LOCKED" },
    III: { module: "ORDERS", status: "LOCKED" },
  } as const,

  allowedRoutes: ["/wallet"] as const,

  forbiddenToTouch: [
    "Homepage",
    "Search",
    "Inbox",
    "Notifications",
    "Conversation Hub",
    "Orders",
    "Sell",
    "Checkout",
    "Saved",
    "Profile",
    "Settings",
    "Addresses",
    "Payment Methods",
    "Account",
    "Verification",
    "Legal Center",
  ] as const,

  target: ["VINTED_UK", "ROVEXO_COMPACT_PREMIUM", "MOBILE_FIRST"] as const,

  required: [
    "Wallet Balance",
    "Transaction History",
    "Withdraw",
    "Bank Account",
    "Pending Transactions",
    "Completed Transactions",
    "Refund Transactions",
    "Payout History",
    "Platform Fee Transactions",
    "Responsive Mobile Design",
  ] as const,

  forbidden: [
    "NO_REDESIGNS",
    "NO_DUPLICATES",
    "NO_CROSS_MODULE_EDITS",
    "NO_SEARCH_BAR",
    "NO_MARKETPLACE_HEADER",
    "NO_NEW_ENTRY_POINTS",
    "NO_DESKTOP_FIRST_DESIGN",
  ] as const,

  absoluteLaw: [
    "ONE_FEATURE_ONE_ENTRY_POINT",
    "ONE_MODULE_ONE_IMPLEMENTATION",
  ] as const,

  masterDevice: "IPHONE_17_PRO_MAX" as const,

  requiredTests: [
    "TypeScript",
    "ESLint",
    "Build",
    "QA",
    "Responsive",
    "Visual QA",
    "Mobile QA",
    "Owner Certification",
  ] as const,

  mustNotModifySprints: ["I", "II", "III"] as const,

  header: {
    allowed: ["Back", "Balance"] as const,
    forbidden: ["Search Bar", "Marketplace Header", "ROVEXO Logo"] as const,
  } as const,

  bottomNavigation: {
    visible: true,
    items: ["Home", "Search", "Sell", "Inbox", "Account"] as const,
  } as const,

  searchBarLaw: {
    allowedOnlyOn: "/",
    elsewhere: "UNMOUNTED",
  } as const,

  ssot: {
    code: "lib/supreme-blood-code-xiii-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xiii-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XIII_V1.md",
    masterUi: "docs/modules/wallet/MASTER_UI_SPECIFICATION.md",
    page: "features/wallet/components/WalletHubV1.tsx",
    wrapper: "features/wallet/components/WalletPage.tsx",
    route: "app/(platform)/wallet/page.tsx",
    css: "styles/rovexo/wallet-hub-v1.css",
    routes: "lib/wallet/canonical-routes.ts",
  } as const,

  parentLaws: {
    bloodXi: "lib/supreme-blood-code-xi-v1.ts",
    bloodXii: "lib/supreme-blood-code-xii-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    homepageSearchBarOnly: "lib/header/homepage-search-bar-only-v1.ts",
    balanceFinalFreeze: "lib/wallet/balance-final-freeze-v1.1.ts",
  } as const,

  childLaws: {
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
  } as const,
} as const;

export type SupremeBloodCodeXiiiV1 = typeof SUPREME_BLOOD_CODE_XIII_V1;

export function isSprintIvRouteAllowed(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return path === "/wallet" || path.startsWith("/wallet/");
}

export function isSprintIvHubRoute(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return path === "/wallet";
}

export function isSprintIvSurfaceForbidden(surface: string): boolean {
  const normalized = surface.trim().toLowerCase();
  return (SUPREME_BLOOD_CODE_XIII_V1.forbiddenToTouch as readonly string[]).some(
    (item) => item.toLowerCase() === normalized,
  );
}

export function resolveBloodXiiiScopePolicy(pathname: string): {
  allowed: boolean;
  policy: readonly string[];
} {
  if (isSprintIvRouteAllowed(pathname)) {
    return { allowed: true, policy: ["FIX_WITHIN_/wallet"] as const };
  }
  return {
    allowed: false,
    policy: ["STOP", "REPORT", "DO_NOT_FIX", "WAIT_FOR_OWNER_APPROVAL"] as const,
  };
}
