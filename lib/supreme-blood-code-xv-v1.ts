/**
 * ROVEXO SUPREME BLOOD CODE XV
 * OWNER CERTIFICATION & FREEZE LAW — ALL SPRINTS
 *
 * STATUS: PERMANENT LAW · APPROVED · 2026-07-23
 * NEVER REMOVE
 *
 * NO OWNER CERTIFICATION = NO PERMANENT FREEZE
 * NO 100% COMPLETE = NO NEXT SPRINT
 * NO EXCEPTIONS.
 *
 * Applies to all present and future sprints without exceptions.
 */

export const SUPREME_BLOOD_CODE_XV_V1 = {
  version: "15.0",
  codename: "OWNER_CERTIFICATION_AND_FREEZE_LAW",
  status: "PERMANENT_LAW",
  approvedByOwner: true,
  bloodCodeLocked: true,
  freezeLocked: true,
  permanent: true,
  neverRemove: true,
  appliesToAllPresentAndFutureSprints: true,
  noExceptions: true,
  approvedAt: "2026-07-23",

  absoluteOwnerLaw: [
    "NO_OWNER_CERTIFICATION_EQUALS_NO_PERMANENT_FREEZE",
    "NO_100_COMPLETE_EQUALS_NO_NEXT_SPRINT",
    "NO_EXCEPTIONS",
  ] as const,

  sprintSequence: [
    "DEVELOPMENT",
    "TYPESCRIPT_PASS",
    "ESLINT_PASS",
    "BUILD_PASS",
    "FUNCTIONAL_QA_PASS",
    "RESPONSIVE_QA_PASS",
    "MOBILE_QA_PASS",
    "VISUAL_QA_PASS",
    "OWNER_CERTIFICATION_PASS",
    "100_COMPLETE",
    "PERMANENT_FREEZE",
    "NEXT_SPRINT",
  ] as const,

  absolutePassLaw: {
    failBelowExact100: true,
    scoresThatFail: [95, 98, 99, 99.99] as const,
    onlyPassScore: 100 as const,
  } as const,

  noPartialFreezeLaw: {
    forbidden: [
      "95% LOCK",
      "98% LOCK",
      "99% LOCK",
      "PARTIAL LOCK",
      "TEMPORARY LOCK",
      "BETA LOCK",
    ] as const,
    allowedOnly: ["100% → OWNER CERTIFIED → PERMANENT FREEZE"] as const,
  } as const,

  absoluteFreezeLaw: {
    afterOwnerCertification: ["LOCKED", "100_COMPLETE", "PERMANENT_FREEZE"] as const,
    postFreezeAllowed: [
      "Critical bug fixes",
      "Security fixes",
      "Legal compliance fixes",
    ] as const,
    ownerApprovalRequired: true,
  } as const,

  noCrossModuleLaw: {
    oneModuleOnly: true,
    example: { sprint: "IV", allowed: "/wallet" } as const,
    forbiddenWhileSprintIv: [
      "/orders",
      "/inbox",
      "/conversation",
      "/checkout",
      "/sell",
      "/profile",
      "/settings",
      "/account",
    ] as const,
  } as const,

  ownerVisualCertificationMustVerify: [
    "UI",
    "UX",
    "RESPONSIVE",
    "FUNCTIONALITY",
    "SCROLL",
    "MOBILE_EXPERIENCE",
    "COMPACT_PREMIUM_DESIGN",
    "IPHONE_17_PRO_MAX_EXPERIENCE",
    "LOCALHOST_EXPERIENCE",
    "PRODUCTION_READINESS",
  ] as const,

  masterDevice: "IPHONE_17_PRO_MAX" as const,

  localhostLaw: {
    official: "http://localhost:3000",
    forbidden: ["localhost:3010", "preview only", "future sprint implementations"] as const,
  } as const,

  absoluteDevelopmentLaw: [
    "ONE_MODULE_ONE_IMPLEMENTATION",
    "ONE_FEATURE_ONE_ENTRY_POINT",
    "NO_DUPLICATES",
    "NO_REDESIGNS",
    "NO_CROSS_MODULE_CHANGES",
    "NO_NEW_ENTRY_POINTS",
    "NO_SEARCH_BAR_OUTSIDE_HOMEPAGE",
  ] as const,

  /**
   * Master roadmap — required end-state path per sprint.
   * Current live status is tracked separately (e.g. Blood XIV Wallet = IN_DEVELOPMENT
   * until Owner Certification PASS).
   */
  masterRoadmap: {
    I: { module: "INBOX", route: "/inbox", target: "100_LOCKED" },
    II: { module: "CONVERSATION_HUB", route: "/inbox/conversation", target: "100_LOCKED" },
    III: { module: "ORDERS", route: "/orders", target: "100_LOCKED" },
    IV: { module: "WALLET", route: "/wallet", target: "100_LOCKED" },
    V: { module: "SELL", route: "/sell", target: "100_LOCKED" },
    VI: { module: "CHECKOUT", route: "/checkout", target: "100_LOCKED" },
    VII: { module: "SHIPPING", route: "/shipping", target: "100_LOCKED" },
    VIII: { module: "ACCOUNT", route: "/account", target: "100_LOCKED" },
  } as const,

  /** Live certification status — Cursor must never invent Owner PASS. */
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

  afterAllSprints: [
    "UI_LOCK",
    "QA_LOCK",
    "PRODUCTION_LOCK",
    "PREVIEW_DEPLOY",
    "PRODUCTION_QA",
    "OWNER_CERTIFICATION",
    "LAUNCH_CERTIFICATION",
    "ROVEXO_V1_0",
  ] as const,

  ssot: {
    code: "lib/supreme-blood-code-xv-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xv-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XV_V1.md",
  } as const,

  parentLaws: {
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    bloodXi: "lib/supreme-blood-code-xi-v1.ts",
    bloodXiv: "lib/supreme-blood-code-xiv-v1.ts",
    homepageSearchBarOnly: "lib/header/homepage-search-bar-only-v1.ts",
    noManualOverride: ".cursor/rules/no-manual-override-v1.mdc",
    finalReleaseProtection: ".cursor/rules/final-release-protection-v1.mdc",
  } as const,

  childLaws: {
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

export type SupremeBloodCodeXvV1 = typeof SUPREME_BLOOD_CODE_XV_V1;

export function isScoreExactHundredPass(scorePercent: number): boolean {
  return scorePercent === 100;
}

export function isPartialFreezeForbidden(lockType: string): boolean {
  const normalized = lockType.trim().toUpperCase();
  return (SUPREME_BLOOD_CODE_XV_V1.noPartialFreezeLaw.forbidden as readonly string[]).some(
    (item) => normalized.includes(item.replace("%", "")) || normalized.includes(item),
  ) || /\b(95|98|99|PARTIAL|TEMPORARY|BETA)\b/i.test(lockType);
}

export function canStartNextSprint(input: {
  ownerCertificationPass: boolean;
  complete100: boolean;
  permanentFreeze: boolean;
}): boolean {
  return input.ownerCertificationPass && input.complete100 && input.permanentFreeze;
}

export function resolveBloodXvPermanentFreeze(input: {
  ownerCertificationPass: boolean;
  complete100: boolean;
}): "PERMANENT_FREEZE" | "NO_FREEZE" {
  if (!input.ownerCertificationPass || !input.complete100) return "NO_FREEZE";
  return "PERMANENT_FREEZE";
}

export function resolveBloodXvOwnerVisualPass(input: {
  ui: boolean;
  ux: boolean;
  responsive: boolean;
  functionality: boolean;
  scroll: boolean;
  mobileExperience: boolean;
  compactPremiumDesign: boolean;
  iphone17ProMaxExperience: boolean;
  localhostExperience: boolean;
  productionReadiness: boolean;
}): "PRODUCT_PASS_100" | "PRODUCT_FAIL" {
  return Object.values(input).every(Boolean) ? "PRODUCT_PASS_100" : "PRODUCT_FAIL";
}
