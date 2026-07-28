/**
 * ROVEXO Evolution Law v1.0
 * ABSOLUTE P0 · PERMANENT · OWNER APPROVED · ENTIRE PLATFORM v1.0
 *
 * Every Owner-approved implementation evolves in place — never by
 * duplication, recreation, replacement, redesign, or parallel systems.
 */

export const EVOLUTION_LAW_NAME = "ROVEXO EVOLUTION LAW" as const;
export const EVOLUTION_LAW_VERSION = "1.0" as const;
export const EVOLUTION_LAW_STATUS =
  "ABSOLUTE P0 · PERMANENT · OWNER APPROVED" as const;

export const EVOLUTION_LAW_IN_PLACE =
  "EVERY OWNER APPROVED IMPLEMENTATION SHALL EVOLVE IN PLACE" as const;

export const EVOLUTION_LAW_NEVER_BY = [
  "duplication",
  "recreation",
  "replacement",
  "redesign",
  "migration to hidden systems",
  "parallel implementations",
  "temporary implementations",
  "experimental implementations",
] as const;

/** Mandatory questions in this exact order. */
export const EVOLUTION_LAW_QUESTIONS = [
  {
    id: 1,
    question: "DOES IT ALREADY EXIST?",
    yes: "GO TO QUESTION #2",
    no: "OWNER APPROVAL REQUIRED",
  },
  {
    id: 2,
    question: "CAN IT BE OPTIMIZED?",
    yes: "OPTIMIZE IT",
    no: "GO TO QUESTION #3",
  },
  {
    id: 3,
    question: "CAN IT BE ADAPTED?",
    yes: "ADAPT IT",
    no: "GO TO QUESTION #4",
  },
  {
    id: 4,
    question: "CAN IT BE SIMPLIFIED?",
    yes: "SIMPLIFY IT",
    no: "GO TO QUESTION #5",
  },
  {
    id: 5,
    question: "IS A NEW IMPLEMENTATION ABSOLUTELY REQUIRED?",
    yes: "OWNER APPROVAL REQUIRED FIRST",
    no: "DO NOT CREATE IT",
  },
] as const;

/** Correct evolution path. */
export const EVOLUTION_LAW_PATH = [
  "PROTECT",
  "OPTIMIZE",
  "ADAPT",
  "SIMPLIFY",
  "CERTIFY",
  "DEPLOY",
] as const;

/** Forbidden evolution path. */
export const EVOLUTION_LAW_FORBIDDEN_PATH = [
  "REBUILD",
  "DUPLICATE",
  "REPLACE",
  "REDESIGN",
  "MIGRATE",
  "DEPLOY",
] as const;

export const EVOLUTION_LAW_GOLDEN_PRINCIPLE = [
  "IF IT EXISTS, PROTECT IT",
  "IF IT CAN BE OPTIMIZED, OPTIMIZE IT",
  "IF IT CAN BE ADAPTED, ADAPT IT",
  "IF IT CAN BE SIMPLIFIED, SIMPLIFY IT",
  "IF IT IS NOT ABSOLUTELY NECESSARY, DO NOT CREATE IT",
] as const;

export const EVOLUTION_LAW_MASTER_EQUATION =
  "ONE OWNER + ONE IMPLEMENTATION + ONE DESIGN + ONE SSOT + ONE RESPONSIVE SYSTEM + ONE EVOLUTION PATH + ZERO DUPLICATIONS + ZERO PARALLEL SYSTEMS + MAXIMUM SCALABILITY = ROVEXO" as const;

export const EVOLUTION_LAW_PASS_EXAMPLE = [
  "Wallet → optimized → secured → responsive → accessible → faster → same implementation → PASS",
  "Balance → optimized → responsive → browser compatible → same implementation → PASS",
] as const;

export const EVOLUTION_LAW_FAIL_EXAMPLE = [
  "Wallet → Wallet v2 → Wallet Pro → Wallet Manager → Wallet Hub → FAIL",
  "Balance → Balance v2 → Balance Lite → Balance Pro → FAIL",
] as const;

export const EVOLUTION_LAW_ABSOLUTE_RULE =
  "EVOLVE IN PLACE THROUGH PROTECT → OPTIMIZE → ADAPT → SIMPLIFY → CERTIFY → DEPLOY. NEVER THROUGH REBUILD → DUPLICATE → REPLACE → REDESIGN → MIGRATE." as const;

export function evolutionLawSnapshot() {
  return {
    name: EVOLUTION_LAW_NAME,
    version: EVOLUTION_LAW_VERSION,
    status: EVOLUTION_LAW_STATUS,
    inPlace: EVOLUTION_LAW_IN_PLACE,
    neverBy: [...EVOLUTION_LAW_NEVER_BY],
    questions: EVOLUTION_LAW_QUESTIONS.map((q) => ({ ...q })),
    path: [...EVOLUTION_LAW_PATH],
    forbiddenPath: [...EVOLUTION_LAW_FORBIDDEN_PATH],
    goldenPrinciple: [...EVOLUTION_LAW_GOLDEN_PRINCIPLE],
    masterEquation: EVOLUTION_LAW_MASTER_EQUATION,
    passExamples: [...EVOLUTION_LAW_PASS_EXAMPLE],
    failExamples: [...EVOLUTION_LAW_FAIL_EXAMPLE],
    absoluteRule: EVOLUTION_LAW_ABSOLUTE_RULE,
  } as const;
}
