/**
 * ROVEXO SUPREME BLOOD CODE II — ZERO REGRESSION PRINCIPLE
 * PERMANENT FREEZE · ABSOLUTE AUTHORITY · BINARY GATES ONLY
 *
 * STATUS: OWNER APPROVED · LOCKED · FROZEN · 2026-07-23
 *
 * Parent: Supreme Blood Code I · Constitution · Absolute Master Freeze
 * Aligns with: Final Release Protection · No Manual Override · Global UI Approval Gate
 *
 * FINAL SUPREME RULE:
 * IF IT IS NOT TESTED · VERIFIED · PREVIEWED · APPROVED · CERTIFIED → IT DOES NOT EXIST.
 */

export const SUPREME_BLOOD_CODE_II_V1 = {
  version: "2.0",
  codename: "ZERO_REGRESSION_PRINCIPLE",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  permanent: true,
  canonical: true,
  ssotReady: true,
  level: 8,
  approvedAt: "2026-07-23",

  /** Nothing may advance unless every listed gate is exactly PASS. */
  releaseForbiddenUnlessAllGatesPass: [
    "COMMIT",
    "PUSH",
    "MERGE",
    "CERTIFY",
    "FREEZE",
    "RELEASE",
  ] as const,

  mandatoryGateOrder: [
    "CODE",
    "TYPESCRIPT",
    "ESLINT",
    "BUILD",
    "TESTS",
    "PREVIEW",
    "UI",
    "MOBILE",
    "TABLET",
    "DESKTOP",
    "OWNER_APPROVAL",
    "FREEZE",
    "COMMIT",
    "PUSH",
    "CERTIFICATION",
    "DONE",
  ] as const,

  /** False combinations — machine green ≠ product green. */
  neverApprovedCombinations: [
    { machine: "BUILD_PASS", product: "WHITE_SCREEN" },
    { machine: "TEST_PASS", product: "BROKEN_UI" },
    { machine: "ESLINT_PASS", product: "BUTTON_NOT_WORKING" },
    { machine: "BUILD_PASS", product: "PAY_NOW_INCORRECT" },
    { machine: "CODE_PASS", product: "PREVIEW_FAIL" },
  ] as const,

  certificationBlockedWhen: [
    "NO_PREVIEW",
    "NO_UI",
    "NO_OWNER_APPROVAL",
    "NO_MOBILE_PASS",
  ] as const,

  whiteScreenPolicy: {
    sprintAutomaticallyFailsIfUserSees: [
      "WHITE_SCREEN",
      "EMPTY_PAGE",
      "BROKEN_PAGE",
      "BROKEN_BUTTON",
      "WRONG_STATUS",
      "WRONG_TOTAL",
      "WRONG_PAYMENT",
      "WRONG_TRACKING",
      "WRONG_AUTOMATION",
    ] as const,
    exceptions: "NONE",
  } as const,

  binaryGateOnly: {
    allowedStatuses: ["PASS", "FAIL"] as const,
    forbiddenStatuses: [
      "Fake PASS",
      "Partial PASS",
      "Estimated PASS",
      "Assume PASS",
      "Probably PASS",
      "Should PASS",
      "Might PASS",
      "Almost PASS",
    ] as const,
  } as const,

  scorePolicy: {
    onlyAcceptable: "100%_PASS_OR_FAIL",
    rejectedAsNotHundred: ["95%", "99%", "99.99%"] as const,
    neverTreatPartialAsHundred: true,
  } as const,

  goldenQaRule: {
    oneThingFails: "ENTIRE_GATE_FAILS",
    example: {
      build: "PASS",
      tests: "PASS",
      ui: "PASS",
      preview: "FAIL",
      result: "SPRINT_FAIL",
    } as const,
  } as const,

  olderFreezes: {
    may: ["IMPROVE", "OPTIMIZE", "AUTOMATE", "SECURE"] as const,
    mayNeverWithoutOwnerApproval: ["BREAK", "REMOVE", "CHANGE", "DUPLICATE"] as const,
  } as const,

  neverSacrifice: [
    { protect: "QUALITY", neverFor: "SPEED" },
    { protect: "SECURITY", neverFor: "CONVENIENCE" },
    { protect: "AUTOMATION", neverFor: "MANUAL_OPERATIONS" },
    { protect: "SCALABILITY", neverFor: "SHORT_TERM_SOLUTIONS" },
  ] as const,

  supremeOwnerRule: {
    ownerMustNeverNeedToAsk: "IS_IT_WORKING",
    platformMustProve: [
      "IT_WORKS",
      "IT_PASSES",
      "IT_IS_TESTED",
      "IT_IS_VERIFIED",
      "IT_IS_CERTIFIED",
    ] as const,
  } as const,

  finalSupremeRule:
    "IF IT IS NOT TESTED, VERIFIED, PREVIEWED, APPROVED, CERTIFIED — IT DOES NOT EXIST.",

  hardStops: {
    noPreview: "NO_FREEZE",
    noPass: "NO_PUSH",
    noOwnerApproval: "NO_CERTIFICATION",
    exceptions: "NONE",
  } as const,

  ssot: {
    code: "lib/supreme-blood-code-ii-v1.ts",
    rule: ".cursor/rules/supreme-blood-code-ii-v1.mdc",
    doc: "docs/engineering/SUPREME_BLOOD_CODE_II_V1.md",
  } as const,

  parentLaws: {
    supremeBloodCodeI: "lib/supreme-blood-code-v1.ts",
    constitution: "lib/rovexo-constitution-v1.ts",
    absoluteMasterFreeze: "lib/absolute-master-freeze-v1.ts",
    finalReleaseProtection: ".cursor/rules/final-release-protection-v1.mdc",
    noManualOverride: ".cursor/rules/no-manual-override-v1.mdc",
    globalUiApprovalGate: ".cursor/rules/global-ui-approval-gate.mdc",
  } as const,

  childLaws: {
    previewViewCertification: "lib/supreme-blood-code-iii-v1.ts",
  } as const,
} as const;

export type SupremeBloodCodeIiV1 = typeof SUPREME_BLOOD_CODE_II_V1;

/** Binary gate: only exact PASS counts. Everything else is FAIL. */
export function resolveBinaryGateStatus(input: {
  status: string;
  evidenceVerified: boolean;
}): "PASS" | "FAIL" {
  const normalized = input.status.trim().toUpperCase();
  if (normalized !== "PASS") return "FAIL";
  if (!input.evidenceVerified) return "FAIL";
  return "PASS";
}

/** Any single FAIL collapses the entire gate set. */
export function resolveSprintGateResult(gates: ReadonlyArray<"PASS" | "FAIL">): "PASS" | "FAIL" {
  if (gates.length === 0) return "FAIL";
  return gates.every((gate) => gate === "PASS") ? "PASS" : "FAIL";
}

/** Scores below exactly 100 are FAIL. */
export function isExactHundredPercentPass(scorePercent: number): boolean {
  return scorePercent === 100;
}

export function isFakeOrPartialPassForbidden(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return (SUPREME_BLOOD_CODE_II_V1.binaryGateOnly.forbiddenStatuses as readonly string[]).some(
    (item) => normalized.includes(item.toLowerCase().replace(/\s+pass$/, "")) || normalized === item.toLowerCase(),
  );
}
