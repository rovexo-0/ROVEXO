/**
 * ROVEXO ENGINEERING GOLDEN PRINCIPLE v1.0
 * ABSOLUTE AUTHORITY · LEVEL 8 · SSOT
 *
 * STATUS: OWNER APPROVED · LOCKED · FROZEN · SSOT READY · 50+ YEARS READY
 *
 * WHEN A FAILURE EXISTS, investigate in this order only:
 * CONFIGURATION → STATE → PROVIDERS → NAVIGATION → SERVICES → API → ARCHITECTURE → CODE
 *
 * CODE MUST ALWAYS BE THE LAST SUSPECT.
 *
 * THE BEST FIX modifies the smallest amount of code while preserving
 * the greatest amount of architecture.
 */

export const ENGINEERING_GOLDEN_PRINCIPLE_V1 = {
  version: "1.0",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  ssotReady: true,
  fiftyPlusYearsReady: true,
  level: 8,

  investigationOrder: [
    "CONFIGURATION",
    "STATE",
    "PROVIDERS",
    "NAVIGATION",
    "SERVICES",
    "API",
    "ARCHITECTURE",
    "CODE",
  ] as const,

  codeIsAlwaysLastSuspect: true,

  mandatoryQuestionsBeforeCodeChange: [
    "IS CONFIGURATION CORRECT?",
    "IS STATE CORRECT?",
    "IS THE PROVIDER CORRECT?",
    "IS NAVIGATION CORRECT?",
    "IS THE SERVICE CORRECT?",
    "IS THE API CORRECT?",
    "IS THE ARCHITECTURE CORRECT?",
    "IS THE CODE REALLY WRONG?",
  ] as const,

  /** If question 8 (code really wrong?) = NO → code modifications are FORBIDDEN. */
  codeModificationForbiddenWhenQuestion8IsNo: true,

  forbiddenReactions: [
    "400 ERROR → rewrite 50 files",
    "OAuth FAIL → Auth v2",
    "Header FAIL → Header v2",
    "Search FAIL → Search Pro",
    "Session FAIL → new Session Manager",
    "Provider FAIL → new Provider",
  ] as const,

  rootCauseLaw: {
    everyFailureHasExactlyOneRootCause: true,
    notAllowed: ["15 POSSIBLE CAUSES", "20 POSSIBLE FIXES"] as const,
    requiredFlow: [
      "ROOT CAUSE FOUND",
      "SMALLEST POSSIBLE FIX",
      "TEST",
      "PASS",
      "DONE",
    ] as const,
  } as const,

  evolutionLaw: {
    mayEvolveOnlyBy: "OPTIMIZATION",
    forbidden: [
      "Search v2",
      "Header Pro",
      "Auth Manager",
      "Session Manager",
      "Cookie Manager",
      "OAuth Manager",
      "Header Manager",
      "Provider Manager",
    ] as const,
    allowedPattern: "FEATURE → optimized",
    allowedDomains: [
      "Search",
      "Header",
      "Auth",
      "Session",
      "Camera Search",
    ] as const,
    withoutCreating: [
      "duplicated systems",
      "duplicated owners",
      "duplicated implementations",
      "duplicated providers",
      "duplicated states",
    ] as const,
  } as const,

  deploymentLaw: {
    productionDeployForbiddenIfOneGateFails: true,
    requireExactPass: "100/100",
    ninetyNineOrBelow: "NO DEPLOY",
  } as const,

  goldenEquation:
    "ONE OWNER = ONE RESPONSIBILITY = ONE IMPLEMENTATION = ONE SOURCE OF TRUTH = ONE ROOT CAUSE = ONE SMALLEST FIX = ONE PRODUCTION GATE.",

  finalPrinciple: {
    bestFix:
      "THE FIX THAT MODIFIES THE SMALLEST AMOUNT OF CODE WHILE PRESERVING THE GREATEST AMOUNT OF ARCHITECTURE.",
    neverEvolveBy: "ADDING MORE SYSTEMS",
    alwaysEvolveBy: ["SIMPLIFYING", "OPTIMIZING", "AUTOMATING", "PRESERVING"] as const,
  } as const,

  ssot: {
    principle: "lib/engineering-golden-principle-v1.ts",
    goldenLaw: "lib/rovexo-golden-law-v1.ts",
    absoluteFreeze: "lib/absolute-master-freeze-v1.ts",
    oauthConfiguration: "lib/auth/oauth-configuration-freeze-v1.ts",
  } as const,
} as const;

export type EngineeringGoldenPrincipleV1 = typeof ENGINEERING_GOLDEN_PRINCIPLE_V1;
