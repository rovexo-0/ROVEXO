/**
 * ROVEXO SUPREME BLOOD CODE XIX
 * SPRINT IV — WALLET · WAITING OWNER CERTIFICATION · DEVELOPMENT FREEZE
 *
 * STATUS: WAITING OWNER CERTIFICATION · BLOOD CODE XIX LOCKED · 2026-07-23
 * NEVER REMOVE
 *
 * THIS DOES NOT MEAN: 100% COMPLETE · PERMANENT FREEZE · PRODUCTION READY · NEXT SPRINT APPROVED
 * IT MEANS ONLY: WAITING OWNER CERTIFICATION.
 *
 * Cursor must never invent Owner Product PASS / freeze / 100%.
 */

export const SUPREME_BLOOD_CODE_XIX_V1 = {
  version: "19.0",
  codename: "SPRINT_IV_WALLET_WAITING_OWNER_CERTIFICATION",
  status: "WAITING_OWNER_CERTIFICATION",
  sprint: "IV" as const,
  module: "WALLET" as const,
  developmentFreeze: true,
  approvedByOwner: true,
  bloodCodeLocked: true,
  freezeLocked: false,
  neverRemove: true,
  approvedAt: "2026-07-23",

  /** Explicit non-claims — Cursor must not invent these. */
  doesNotMean: [
    "100% COMPLETE",
    "PERMANENT FREEZE",
    "PRODUCTION READY",
    "NEXT SPRINT APPROVED",
  ] as const,
  meansOnly: "WAITING_OWNER_CERTIFICATION" as const,

  permanentlyFrozen: false,
  complete100: false,
  ownerCertified: false,
  productionReady: false,
  nextSprintApproved: false,

  absoluteContinuationLaw: {
    mayContinueOnly: [
      "Wallet Bug Fixes",
      "Wallet UI Polish",
      "Wallet QA",
      "Wallet Certifications",
      "Wallet Responsive Improvements",
      "Wallet Mobile Improvements",
    ] as const,
    forbidden: [
      "Starting Sprint VI",
      "Permanent Freeze",
      "Declaring 100% Complete",
      "Production Certification",
      "Partial Certifications",
    ] as const,
  } as const,

  officialRoute: "/wallet",
  officialLocalhost: "http://localhost:3000/wallet",

  oneWalletLaw: {
    oneImplementation: true,
    oneEntryPoint: "/wallet",
    allowedOnly: ["/wallet"] as const,
  } as const,

  ownerCertificationMustCertify: {
    visual: [
      "Wallet UI",
      "Wallet UX",
      "Compact Premium Design",
      "Mobile Experience",
      "Responsive Behaviour",
    ] as const,
    functional: [
      "Balance",
      "Withdraw",
      "Bank Account",
      "Transactions",
      "Transaction Details",
      "Payout History",
      "Platform Fee Transactions",
      "Wallet Navigation",
    ] as const,
    mobile: [
      "iPhone Certification",
      "Safari Behaviour",
      "Scroll Behaviour",
      "Sticky Components",
      "Safe Areas",
      "Touch Behaviour",
    ] as const,
    localhost: "http://localhost:3000/wallet",
    production: [
      "Production Ready",
      "QA Ready",
      "Regression Free",
      "Owner Approved",
    ] as const,
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
  ] as const,

  withoutAllAutoPasses: "PRODUCT_FAIL" as const,

  absoluteOwnerLaw: {
    ownerMustNeverCertify: [
      "Beta Products",
      "Partial Products",
      "95% Products",
      "99% Products",
      "Temporary Products",
      "Untested Products",
    ] as const,
    ownerCertifiesOnly: [
      "100%",
      "QA CERTIFIED",
      "REGRESSION FREE",
      "AUTOMATICALLY CERTIFIED",
      "PRODUCTION READY",
    ] as const,
  } as const,

  permanentFreezeConditions: [
    "AUTOMATIC_CERTIFICATION_PASS",
    "OWNER_CERTIFICATION_PASS",
    "100_COMPLETE",
    "ZERO_REGRESSION_PASS",
    "PRODUCTION_READY_PASS",
  ] as const,

  afterAllFreezeConditions: ["LOCKED", "100_COMPLETE", "PERMANENT_FREEZE"] as const,

  sprintViForbiddenUntil: [
    "LOCKED",
    "100_COMPLETE",
    "OWNER_CERTIFIED",
    "PERMANENTLY_FROZEN",
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

  absoluteClarificationLaw: [
    "WAITING_OWNER_CERTIFICATION_DOES_NOT_MEAN_100_COMPLETE",
    "100_COMPLETE_DOES_NOT_MEAN_PERMANENT_FREEZE",
    "PERMANENT_FREEZE_DOES_NOT_EXIST_WITHOUT_OWNER_CERTIFICATION",
  ] as const,

  ownerAbsoluteRights: [
    "APPROVE",
    "REJECT",
    "REQUEST_CHANGES",
    "REQUEST_UI_POLISH",
    "REQUEST_MORE_QA",
    "REQUEST_MORE_IMPLEMENTATION",
  ] as const,

  absoluteLaw: [
    "NO_COMPROMISES",
    "NO_SHORTCUTS",
    "ONLY_100_OWNER_CERTIFIED_PRODUCTION_READY_PERMANENT_FREEZE",
  ] as const,

  ssot: {
    code: "lib/supreme-blood-code-xix-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xix-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XIX_V1.md",
    walletHub: "features/wallet/components/WalletHubV1.tsx",
  } as const,

  parentLaws: {
    bloodXi: "lib/supreme-blood-code-xi-v1.ts",
    bloodXiii: "lib/supreme-blood-code-xiii-v1.ts",
    bloodXiv: "lib/supreme-blood-code-xiv-v1.ts",
    bloodXv: "lib/supreme-blood-code-xv-v1.ts",
    bloodXvi: "lib/supreme-blood-code-xvi-v1.ts",
    bloodXvii: "lib/supreme-blood-code-xvii-v1.ts",
    bloodXviii: "lib/supreme-blood-code-xviii-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
  } as const,

  childLaws: {
    sprintVSellExecutionMode: "lib/supreme-blood-code-xx-v1.ts",
    sprintVSellPriorityZeroExecution: "lib/supreme-blood-code-xxi-v1.ts",
    sprintVSell100CompletePermanentFreeze: "lib/supreme-blood-code-xxii-v1.ts",
    sprintViCheckoutApprovedToStart: "lib/supreme-blood-code-xxiii-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeXixV1 = typeof SUPREME_BLOOD_CODE_XIX_V1;

export function isWaitingOwnerCertificationOnly(status: string): boolean {
  return status.trim().toUpperCase().replace(/\s+/g, "_") === "WAITING_OWNER_CERTIFICATION";
}

export function isBloodXixWalletWorkAllowed(workKind: string): boolean {
  const normalized = workKind.trim().toLowerCase();
  return (
    SUPREME_BLOOD_CODE_XIX_V1.absoluteContinuationLaw.mayContinueOnly as readonly string[]
  ).some((item) => normalized.includes(item.toLowerCase().replace("wallet ", "")));
}

export function isBloodXixForbiddenClaim(claim: string): boolean {
  const normalized = claim.trim().toUpperCase();
  return (
    (SUPREME_BLOOD_CODE_XIX_V1.doesNotMean as readonly string[]).some((item) =>
      normalized.includes(item),
    ) ||
    (SUPREME_BLOOD_CODE_XIX_V1.absoluteContinuationLaw.forbidden as readonly string[]).some(
      (item) => normalized.includes(item.toUpperCase()),
    )
  );
}

export function resolveBloodXixPermanentFreeze(input: {
  automaticCertificationPass: boolean;
  ownerCertificationPass: boolean;
  complete100: boolean;
  zeroRegressionPass: boolean;
  productionReadyPass: boolean;
}): "PERMANENT_FREEZE" | "WAITING_OWNER_CERTIFICATION" | "NOT_READY" {
  const all = Object.values(input).every(Boolean);
  if (all) return "PERMANENT_FREEZE";
  if (!input.ownerCertificationPass) return "WAITING_OWNER_CERTIFICATION";
  return "NOT_READY";
}

export function canStartSprintViFromWalletGate(input: {
  locked: boolean;
  complete100: boolean;
  ownerCertified: boolean;
  permanentlyFrozen: boolean;
}): boolean {
  return (
    input.locked &&
    input.complete100 &&
    input.ownerCertified &&
    input.permanentlyFrozen
  );
}
