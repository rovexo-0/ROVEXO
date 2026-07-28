/**
 * ROVEXO SUPREME BLOOD CODE XVI
 * ZERO REGRESSION MASTER LAW — PERMANENT CONSTITUTION
 *
 * STATUS: PERMANENT LAW · APPROVED · 2026-07-23
 * NEVER REMOVE
 *
 * A NEW SPRINT / MODULE / FEATURE MUST NEVER BREAK
 * ANYTHING ALREADY OWNER CERTIFIED + 100% COMPLETE + PERMANENTLY FROZEN.
 *
 * NO REGRESSION QA PASS = PRODUCT FAIL
 * Applies to ROVEXO v1.0 → v2.0 → v10.0 → all future versions.
 */

export const SUPREME_BLOOD_CODE_XVI_V1 = {
  version: "16.0",
  codename: "ZERO_REGRESSION_MASTER_LAW",
  status: "PERMANENT_LAW",
  approvedByOwner: true,
  bloodCodeLocked: true,
  freezeLocked: true,
  permanent: true,
  neverRemove: true,
  permanentConstitutionalLaw: true,
  noCompromises: true,
  noExceptions: true,
  appliesToAllFutureVersions: true,
  approvedAt: "2026-07-23",

  absoluteZeroRegressionLaw: {
    newWorkMustNeverBreakCertified: true,
    newWorkKinds: [
      "Sprint",
      "Module",
      "Feature",
      "Component",
      "Function",
      "Integration",
      "Optimization",
      "Refactor",
      "UI Update",
      "UX Update",
      "Security Update",
      "Performance Update",
    ] as const,
    protectedStateRequired: [
      "OWNER_CERTIFIED",
      "100_COMPLETE",
      "PERMANENTLY_FROZEN",
    ] as const,
  } as const,

  /** Later sprint must never break earlier certified sprints. */
  sprintNonRegressionChain: {
    IV: ["I", "II", "III"] as const,
    V: ["I", "II", "III", "IV"] as const,
    VI: ["I", "II", "III", "IV", "V"] as const,
    VII: ["I", "II", "III", "IV", "V", "VI"] as const,
    VIII: ["I", "II", "III", "IV", "V", "VI", "VII"] as const,
  } as const,

  masterLaw: [
    "NEW_FEATURE_MUST_NEVER_BREAK_OLD_FEATURE",
    "NEW_MODULE_MUST_NEVER_BREAK_OLD_MODULE",
    "NEW_IMPLEMENTATION_MUST_NEVER_BREAK_OLD_IMPLEMENTATION",
    "NEW_SPRINT_MUST_NEVER_BREAK_OLD_SPRINT",
    "NEW_VERSION_MUST_NEVER_BREAK_OLD_VERSION",
    "NEW_PRODUCT_MUST_NEVER_BREAK_CERTIFIED_PRODUCT",
  ] as const,

  noRegressionQaSequence: [
    "DEVELOPMENT",
    "TYPESCRIPT_PASS",
    "ESLINT_PASS",
    "BUILD_PASS",
    "FUNCTIONAL_QA_PASS",
    "RESPONSIVE_QA_PASS",
    "MOBILE_QA_PASS",
    "VISUAL_QA_PASS",
    "NO_REGRESSION_QA_PASS",
    "OWNER_CERTIFICATION_PASS",
    "100_COMPLETE",
    "PERMANENT_FREEZE",
    "NEXT_SPRINT",
  ] as const,

  withoutNoRegressionQaPass: "PRODUCT_FAIL" as const,

  forbiddenRegressions: [
    "Cross Module Regression",
    "UI Regression",
    "UX Regression",
    "Performance Regression",
    "Functional Regression",
    "Responsive Regression",
    "Mobile Regression",
    "Financial Regression",
    "Search Regression",
    "Checkout Regression",
    "Wallet Regression",
    "Shipping Regression",
    "Orders Regression",
    "Inbox Regression",
    "Conversation Regression",
    "Account Regression",
    "Notification Regression",
    "Build Regression",
    "TypeScript Regression",
    "ESLint Regression",
  ] as const,

  absoluteFreezeLaw: {
    afterOwnerCertificationAnd100: [
      "LOCKED",
      "PERMANENTLY_FROZEN",
      "ZERO_REGRESSION_PROTECTED",
    ] as const,
    postFreezeAllowed: [
      "Critical Security Fixes",
      "Critical Production Bugs",
      "Critical Legal Compliance Fixes",
    ] as const,
    ownerApprovalRequired: true,
  } as const,

  /**
   * Live protection — Cursor must never invent Owner Certification.
   * Wallet+ only become ZERO_REGRESSION_PROTECTED after Owner Certification.
   */
  protectedModulesLive: {
    I: {
      module: "INBOX",
      route: "/inbox",
      status: "ZERO_REGRESSION_PROTECTED",
    },
    II: {
      module: "CONVERSATION_HUB",
      route: "/inbox/conversation",
      status: "ZERO_REGRESSION_PROTECTED",
    },
    III: {
      module: "ORDERS",
      route: "/orders",
      status: "ZERO_REGRESSION_PROTECTED",
    },
    IV: {
      module: "WALLET",
      route: "/wallet",
      status: "ZERO_REGRESSION_PROTECTED",
    },
    V: {
      module: "SELL",
      route: "/sell",
      status: "ZERO_REGRESSION_PROTECTED",
    },
    VI: {
      module: "CHECKOUT",
      route: "/checkout",
      status: "AFTER_OWNER_CERTIFICATION_ONLY",
    },
    VII: {
      module: "SHIPPING",
      route: "/shipping",
      status: "AFTER_OWNER_CERTIFICATION_ONLY",
    },
    VIII: {
      module: "ACCOUNT",
      route: "/account",
      status: "AFTER_OWNER_CERTIFICATION_ONLY",
    },
  } as const,

  localhostLaw: {
    official: "http://localhost:3000",
    certifiedModuleFailOnLocalhost: "PRODUCT_FAIL",
  } as const,

  absoluteOwnerLawMustNeverLose: [
    "Features",
    "Components",
    "Buttons",
    "Functionality",
    "Integrations",
    "UI Elements",
    "UX Behaviour",
    "Certifications",
    "Permanent Freeze Status",
  ] as const,

  masterRoadmapTarget: {
    I: "LOCKED_ZERO_REGRESSION_PROTECTED",
    II: "LOCKED_ZERO_REGRESSION_PROTECTED",
    III: "LOCKED_ZERO_REGRESSION_PROTECTED",
    IV: "100_OWNER_CERT_LOCKED_ZERO_REGRESSION_PROTECTED",
    V: "100_OWNER_CERT_LOCKED_ZERO_REGRESSION_PROTECTED",
    VI: "100_OWNER_CERT_LOCKED_ZERO_REGRESSION_PROTECTED",
    VII: "100_OWNER_CERT_LOCKED_ZERO_REGRESSION_PROTECTED",
    VIII: "100_OWNER_CERT_LOCKED_ZERO_REGRESSION_PROTECTED",
  } as const,

  absoluteLaw: [
    "NO_REGRESSION_EQUALS_NO_COMPROMISES",
    "NO_OWNER_CERTIFICATION_EQUALS_NO_FREEZE",
    "NO_100_EQUALS_NO_NEXT_SPRINT",
    "ZERO_REGRESSION_EQUALS_PERMANENT_CONSTITUTIONAL_LAW",
  ] as const,

  ssot: {
    code: "lib/supreme-blood-code-xvi-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-xvi-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_XVI_V1.md",
  } as const,

  parentLaws: {
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    supremeBloodCode: "lib/supreme-blood-code-v1.ts",
    bloodIiZeroRegression: "lib/supreme-blood-code-ii-v1.ts",
    bloodXi: "lib/supreme-blood-code-xi-v1.ts",
    bloodXv: "lib/supreme-blood-code-xv-v1.ts",
    noDamage: ".cursor/rules/no-damage-master-lock.mdc",
    noManualOverride: ".cursor/rules/no-manual-override-v1.mdc",
    finalReleaseProtection: ".cursor/rules/final-release-protection-v1.mdc",
  } as const,

  childLaws: {
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

export type SupremeBloodCodeXviV1 = typeof SUPREME_BLOOD_CODE_XVI_V1;

export type BloodXviSprintId = keyof typeof SUPREME_BLOOD_CODE_XVI_V1.protectedModulesLive;

export function isZeroRegressionProtectedLive(sprint: BloodXviSprintId): boolean {
  return (
    SUPREME_BLOOD_CODE_XVI_V1.protectedModulesLive[sprint].status ===
    "ZERO_REGRESSION_PROTECTED"
  );
}

export function resolveBloodXviNoRegressionGate(input: {
  noRegressionQaPass: boolean;
  ownerCertificationPass: boolean;
  complete100: boolean;
}): "PRODUCT_PASS_100" | "PRODUCT_FAIL" {
  if (!input.noRegressionQaPass) return "PRODUCT_FAIL";
  if (!input.ownerCertificationPass || !input.complete100) return "PRODUCT_FAIL";
  return "PRODUCT_PASS_100";
}

export function canModifyFrozenModule(input: {
  ownerCertified: boolean;
  complete100: boolean;
  permanentlyFrozen: boolean;
  changeKind: string;
  ownerApproval: boolean;
}): boolean {
  const protectedState =
    input.ownerCertified && input.complete100 && input.permanentlyFrozen;
  if (!protectedState) return true;
  if (!input.ownerApproval) return false;
  const normalized = input.changeKind.trim().toLowerCase();
  return (
    /critical\s+security/.test(normalized) ||
    /critical\s+production\s+bug/.test(normalized) ||
    /critical\s+legal\s+compliance/.test(normalized)
  );
}

export function resolveSprintMustNotBreak(
  developingSprint: "IV" | "V" | "VI" | "VII" | "VIII",
): readonly string[] {
  return SUPREME_BLOOD_CODE_XVI_V1.sprintNonRegressionChain[developingSprint];
}

export function isForbiddenRegressionType(regressionType: string): boolean {
  const normalized = regressionType.trim().toLowerCase();
  return (SUPREME_BLOOD_CODE_XVI_V1.forbiddenRegressions as readonly string[]).some(
    (item) =>
      normalized.includes(item.toLowerCase()) ||
      normalized.includes(item.toLowerCase().replace(" regression", "")),
  );
}
