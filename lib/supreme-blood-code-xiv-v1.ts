/**
 * ROVEXO SUPREME BLOOD CODE XIV
 * SPRINT IV — WALLET · DEVELOPMENT FREEZE LAW
 *
 * STATUS: APPROVED TO START · BLOOD CODE XIV LOCKED · 2026-07-23
 * NEVER REMOVE
 *
 * Sprint IV may modify ONLY http://localhost:3000/wallet
 * One Wallet = one entry point = /wallet
 * Live: WAITING_OWNER_CERTIFICATION (Owner visual cert pending).
 * Sprint V Sell start approved via Blood XVIII (Owner).
 * Wallet permanent freeze still requires Owner Certification.
 */

export const SUPREME_BLOOD_CODE_XIV_V1 = {
  version: "14.0",
  codename: "SPRINT_IV_WALLET_DEVELOPMENT_FREEZE_LAW",
  status: "APPROVED_TO_START",
  sprint: "IV" as const,
  module: "WALLET" as const,
  developmentStatus: "LOCKED" as const,
  approvedByOwner: true,
  bloodCodeLocked: true,
  freezeLocked: false,
  permanentFreezePendingOwnerCertification: true,
  neverRemove: true,
  approvedAt: "2026-07-23",

  officialRoute: "/wallet",
  officialLocalhost: "http://localhost:3000/wallet",

  lockedModules: {
    I: { module: "INBOX", status: "LOCKED" },
    II: { module: "CONVERSATION_HUB", status: "LOCKED" },
    III: { module: "ORDERS", status: "LOCKED" },
  } as const,

  sprintIv: { module: "WALLET", status: "LOCKED" } as const,

  nextSprint: {
    sprint: "V" as const,
    module: "SELL" as const,
    status: "OWNER_APPROVED_VIA_BLOOD_XVIII_IN_DEVELOPMENT",
  } as const,

  allowed: ["/wallet"] as const,

  notAllowedEntryPoints: [
    "/balance",
    "/wallet-v2",
    "/wallet-new",
    "/wallet-redesign",
    "/wallet-beta",
    "/wallet-test",
  ] as const,

  forbiddenToTouch: [
    "Homepage",
    "Search",
    "Inbox",
    "Notifications",
    "Conversation Hub",
    "Orders",
    "Sell",
    "Checkout",
    "Shipping",
    "Profile",
    "Account",
    "Settings",
    "Addresses",
    "Verification",
    "Payment Methods",
    "Saved",
    "Legal Center",
    "Help Center",
  ] as const,

  requiredModules: [
    "Balance",
    "Withdraw",
    "Bank Account",
    "Transactions",
    "Transaction Details",
    "Pending Transactions",
    "Completed Transactions",
    "Refund Transactions",
    "Payout History",
    "Platform Fee Transactions",
    "Wallet Notifications",
    "Responsive Mobile UI",
  ] as const,

  designLaw: ["ROVEXO_COMPACT_PREMIUM", "MOBILE_FIRST", "IPHONE_17_PRO_MAX"] as const,

  header: {
    allowed: ["Back", "Balance", "Help"] as const,
    forbidden: [
      "Search Bar",
      "Marketplace Header",
      "ROVEXO Homepage Header",
      "Duplicate Headers",
      "Desktop Header",
    ] as const,
  } as const,

  bottomNavigation: { visible: true, permanent: true } as const,

  absoluteRules: [
    "NO_NEW_ENTRY_POINTS",
    "NO_DUPLICATES",
    "NO_REDESIGNS",
    "NO_CROSS_MODULE_EDITS",
    "NO_DESKTOP_FIRST_DESIGN",
    "NO_SECOND_WALLET_IMPLEMENTATION",
    "NO_CSS_HIDING",
    "NO_MODULE_SPLITTING",
  ] as const,

  permanentWalletLaw: {
    oneWallet: true,
    oneEntryPoint: "/wallet",
    officialUrl: "http://localhost:3000/wallet",
  } as const,

  requiredTests: [
    "TypeScript",
    "ESLint",
    "Build",
    "Functional QA",
    "Responsive QA",
    "Mobile QA",
    "Visual QA",
    "Owner Certification",
  ] as const,

  masterDevice: "IPHONE_17_PRO_MAX" as const,

  permanentFreezeConditions: [
    "Wallet functionality 100% COMPLETE",
    "Visual Certification 100% COMPLETE",
    "Mobile Certification 100% COMPLETE",
    "Responsive Certification 100% COMPLETE",
    "Owner Approval 100% COMPLETE",
    "Production QA 100% COMPLETE",
  ] as const,

  postCertificationStatus: ["LOCKED", "100_COMPLETE", "PERMANENT_FREEZE"] as const,

  ssot: {
    code: "lib/supreme-blood-code-xiv-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xiv-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XIV_V1.md",
    parentStart: "lib/supreme-blood-code-xiii-v1.ts",
    page: "features/wallet/components/WalletHubV1.tsx",
    route: "app/wallet/page.tsx",
    routes: "lib/wallet/canonical-routes.ts",
  } as const,

  parentLaws: {
    bloodXi: "lib/supreme-blood-code-xi-v1.ts",
    bloodXiii: "lib/supreme-blood-code-xiii-v1.ts",
    bloodXv: "lib/supreme-blood-code-xv-v1.ts",
    bloodXvi: "lib/supreme-blood-code-xvi-v1.ts",
    bloodXvii: "lib/supreme-blood-code-xvii-v1.ts",
    bloodXviii: "lib/supreme-blood-code-xviii-v1.ts",
    bloodXix: "lib/supreme-blood-code-xix-v1.ts",
    bloodXx: "lib/supreme-blood-code-xx-v1.ts",
    bloodXxi: "lib/supreme-blood-code-xxi-v1.ts",
    bloodXxii: "lib/supreme-blood-code-xxii-v1.ts",
    bloodXxiii: "lib/supreme-blood-code-xxiii-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    homepageSearchBarOnly: "lib/header/homepage-search-bar-only-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeXivV1 = typeof SUPREME_BLOOD_CODE_XIV_V1;

export function isBloodXivWalletRouteAllowed(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return path === "/wallet" || path.startsWith("/wallet/");
}

export function isBloodXivForbiddenEntryPoint(pathname: string): boolean {
  const path = (pathname.trim().split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
  return (SUPREME_BLOOD_CODE_XIV_V1.notAllowedEntryPoints as readonly string[]).some(
    (entry) => path === entry || path.startsWith(`${entry}/`),
  );
}

/** Owner approved Sprint V start via Blood XVIII — Sell freeze still requires Owner Certification. */
export function isSprintVSellForbidden(): boolean {
  return false;
}

export function resolveBloodXivPermanentFreeze(input: {
  walletFunctionalityComplete: boolean;
  visualCertificationComplete: boolean;
  mobileCertificationComplete: boolean;
  responsiveCertificationComplete: boolean;
  ownerApprovalComplete: boolean;
  productionQaComplete: boolean;
}): "PERMANENT_FREEZE" | "NOT_READY" {
  return Object.values(input).every(Boolean) ? "PERMANENT_FREEZE" : "NOT_READY";
}

export function resolveBloodXivScopePolicy(pathname: string): {
  allowed: boolean;
  policy: readonly string[];
} {
  if (isBloodXivForbiddenEntryPoint(pathname) && pathname.replace(/\/+$/, "") !== "/wallet") {
    return {
      allowed: false,
      policy: ["STOP", "FORBIDDEN_ENTRY_POINT", "USE_/wallet_ONLY"] as const,
    };
  }
  if (isBloodXivWalletRouteAllowed(pathname)) {
    return { allowed: true, policy: ["FIX_WITHIN_/wallet"] as const };
  }
  return {
    allowed: false,
    policy: ["STOP", "REPORT", "DO_NOT_FIX", "WAIT_FOR_OWNER_APPROVAL"] as const,
  };
}
