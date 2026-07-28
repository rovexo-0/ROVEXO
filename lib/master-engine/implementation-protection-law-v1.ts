/**
 * ROVEXO Implementation Protection Law v1.1
 * ABSOLUTE P0 · LEVEL 8 · CANONICAL SSOT · LOCKED · PERMANENT FOR v1.0
 *
 * An Owner-approved implementation is protected as a whole:
 * design, UI, UX, logic, APIs, states, performance, a11y, architecture.
 */

export const IMPLEMENTATION_PROTECTION_LAW_NAME =
  "ROVEXO IMPLEMENTATION PROTECTION LAW" as const;
export const IMPLEMENTATION_PROTECTION_LAW_VERSION = "1.1" as const;
export const IMPLEMENTATION_PROTECTION_LAW_STATUS =
  "ABSOLUTE P0 · LEVEL 8 · LOCKED · OWNER APPROVED · PERMANENT" as const;
export const IMPLEMENTATION_PROTECTION_LAW_LEVEL = 8 as const;

export const IMPLEMENTATION_PROTECTION_LOCKED_AS = [
  "Owner Approved Canonical Implementation",
  "Protected Implementation",
  "Canonical SSOT",
  "One Implementation",
  "One Canonical Version",
  "Protected Architecture",
  "Protected Design",
  "Protected Logic",
] as const;

/** Whole-implementation integrity surface. */
export const IMPLEMENTATION_PROTECTION_INTEGRITY = [
  "Design",
  "UI",
  "UX",
  "Components",
  "Layout",
  "Navigation",
  "Responsive Behaviour",
  "Adaptive Behaviour",
  "Business Logic",
  "Financial Logic",
  "APIs",
  "States",
  "Performance Characteristics",
  "Accessibility Characteristics",
  "Browser Compatibility",
  "Canonical Architecture",
  "Canonical SSOT",
  "Scalability Characteristics",
] as const;

export const IMPLEMENTATION_PROTECTION_FORBIDDEN = [
  "redesign it",
  "recreate it",
  "duplicate it",
  "replace it",
  "split it",
  "migrate it to another implementation",
  "create hidden versions",
  "create experimental versions",
  "create temporary versions",
  "create duplicated systems",
  "create duplicated business logic",
  "create duplicated layouts",
  "create duplicated engines",
  "create duplicated implementations",
] as const;

/**
 * Allowed only if Owner-approved canonical implementation remains
 * functionally and visually identical.
 */
export const IMPLEMENTATION_PROTECTION_ALLOWED = [
  "bug fixes",
  "performance improvements",
  "accessibility improvements",
  "responsive adaptations",
  "adaptive improvements",
  "security improvements",
  "browser compatibility improvements",
  "infrastructure improvements",
  "API improvements",
  "database improvements",
  "optimization in place",
] as const;

export const IMPLEMENTATION_PROTECTION_ALLOWED_CONDITION =
  "THE OWNER APPROVED CANONICAL IMPLEMENTATION REMAINS FUNCTIONALLY AND VISUALLY IDENTICAL" as const;

export const IMPLEMENTATION_PROTECTION_NO_REGRESSION = [
  "reduce functionality",
  "reduce accessibility",
  "reduce responsiveness",
  "reduce performance",
  "introduce regressions",
  "break approved flows",
  "break approved components",
  "break approved integrations",
  "break approved navigation",
  "break approved layouts",
] as const;

export const IMPLEMENTATION_PROTECTION_NO_REGRESSION_RULE =
  "EVERY CHANGE MUST BE BETTER OR IDENTICAL. NEVER WORSE." as const;

/** Five absolute questions — mandatory order. */
export const IMPLEMENTATION_PROTECTION_FIVE_QUESTIONS = [
  {
    id: 1,
    question: "IS THERE A ROOT CAUSE?",
    ifNo: "STOP",
    ifYes: "CONTINUE",
  },
  {
    id: 2,
    question:
      "CAN THE ROOT CAUSE BE FIXED WITHOUT CHANGING THE OWNER APPROVED IMPLEMENTATION?",
    ifYes: "FIX THE ROOT CAUSE ONLY",
    ifNo: "CONTINUE",
  },
  {
    id: 3,
    question: "CAN THE EXISTING IMPLEMENTATION BE OPTIMIZED?",
    ifYes: "OPTIMIZE IT",
    ifNo: "CONTINUE",
  },
  {
    id: 4,
    question: "IS A NEW IMPLEMENTATION ABSOLUTELY REQUIRED?",
    ifNo: "IT IS FORBIDDEN",
    ifYes: "CONTINUE",
  },
  {
    id: 5,
    question:
      "CAN THIS CHANGE BE MADE WITHOUT CREATING v2 / duplicated systems / engines / layouts / components / business logic / implementations?",
    ifYes: "PROCEED",
    ifNo: "OWNER APPROVAL REQUIRED",
  },
] as const;

export const IMPLEMENTATION_PROTECTION_FOUR_GOLDEN = [
  "ONE IMPLEMENTATION",
  "OWNER APPROVED IMPLEMENTATION ALWAYS WINS",
  "OPTIMIZE BEFORE REBUILD",
  "SIMPLIFY BEFORE EXPAND",
] as const;

export const IMPLEMENTATION_PROTECTION_FIVE_ABSOLUTE = [
  "PROTECT BEFORE MODIFY",
  "CODE LAST",
  "NO REGRESSION",
  "100/100 ONLY",
  "THE IMPLEMENTATION ALWAYS WINS",
] as const;

export const IMPLEMENTATION_PROTECTION_ABSOLUTE_RULES = [
  "IF IT WORKS, PROTECT IT",
  "IF IT CAN BE OPTIMIZED, OPTIMIZE IT",
  "IF IT CAN BE SIMPLIFIED, SIMPLIFY IT",
  "IF IT IS NOT 100/100, DO NOT DEPLOY IT",
  "IF THE OWNER APPROVED IT, PROTECT THE ENTIRE IMPLEMENTATION",
  "IF THERE IS NO ROOT CAUSE, DO NOT TOUCH IT",
] as const;

export const IMPLEMENTATION_PROTECTION_MASTER_EQUATION =
  "PROTECT + OPTIMIZE + PRESERVE + SIMPLIFY + ONE IMPLEMENTATION + ONE SSOT + ZERO REGRESSIONS + ZERO DUPLICATIONS + OWNER APPROVED DESIGN + MAXIMUM SCALABILITY = ROVEXO" as const;

export const IMPLEMENTATION_PROTECTION_GOLDEN_RULE =
  "OPTIMIZE BEFORE REBUILD. PROTECT BEFORE MODIFY. SIMPLIFY BEFORE EXPAND. NO REGRESSION. 100/100 ONLY." as const;

export const IMPLEMENTATION_PROTECTION_OPTIMIZE_FIRST_QUESTION =
  "CAN THE EXISTING IMPLEMENTATION BE OPTIMIZED?" as const;

export const IMPLEMENTATION_PROTECTION_ABSOLUTE_RULE =
  "AN OWNER APPROVED IMPLEMENTATION IS LOCKED AS A WHOLE. NO ROOT CAUSE → DO NOT TOUCH. OPTIMIZE BEFORE REBUILD. BETTER OR IDENTICAL — NEVER WORSE. 100/100 ONLY." as const;

export const IMPLEMENTATION_PROTECTION_APPLIES_TO = [
  "ALL CURRENT MODULES",
  "ALL FUTURE MODULES",
  "ALL FUTURE ENGINES",
  "ALL FUTURE SYSTEMS",
  "THE ENTIRE ROVEXO v1.0 PLATFORM",
] as const;

export function implementationProtectionLawSnapshot() {
  return {
    name: IMPLEMENTATION_PROTECTION_LAW_NAME,
    version: IMPLEMENTATION_PROTECTION_LAW_VERSION,
    status: IMPLEMENTATION_PROTECTION_LAW_STATUS,
    level: IMPLEMENTATION_PROTECTION_LAW_LEVEL,
    lockedAs: [...IMPLEMENTATION_PROTECTION_LOCKED_AS],
    integrity: [...IMPLEMENTATION_PROTECTION_INTEGRITY],
    forbidden: [...IMPLEMENTATION_PROTECTION_FORBIDDEN],
    allowed: [...IMPLEMENTATION_PROTECTION_ALLOWED],
    allowedCondition: IMPLEMENTATION_PROTECTION_ALLOWED_CONDITION,
    noRegression: [...IMPLEMENTATION_PROTECTION_NO_REGRESSION],
    noRegressionRule: IMPLEMENTATION_PROTECTION_NO_REGRESSION_RULE,
    fiveQuestions: IMPLEMENTATION_PROTECTION_FIVE_QUESTIONS.map((q) => ({ ...q })),
    fourGolden: [...IMPLEMENTATION_PROTECTION_FOUR_GOLDEN],
    fiveAbsolute: [...IMPLEMENTATION_PROTECTION_FIVE_ABSOLUTE],
    absoluteRules: [...IMPLEMENTATION_PROTECTION_ABSOLUTE_RULES],
    masterEquation: IMPLEMENTATION_PROTECTION_MASTER_EQUATION,
    goldenRule: IMPLEMENTATION_PROTECTION_GOLDEN_RULE,
    optimizeFirstQuestion: IMPLEMENTATION_PROTECTION_OPTIMIZE_FIRST_QUESTION,
    absoluteRule: IMPLEMENTATION_PROTECTION_ABSOLUTE_RULE,
    appliesTo: [...IMPLEMENTATION_PROTECTION_APPLIES_TO],
  } as const;
}
