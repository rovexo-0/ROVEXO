/**
 * ROVEXO GOLDEN LAW v1.0
 * LEVEL 8 · ABSOLUTE AUTHORITY · SSOT
 *
 * IF THERE IS ONLY ONE WAY → ONE OWNER
 * → ONE IMPLEMENTATION → ONE SOURCE OF TRUTH
 * → ONE RESPONSIBILITY → ONE PRODUCTION GATE
 *
 * IF ONE PRODUCTION GATE FAILS → PRODUCTION DEPLOY IS FORBIDDEN.
 *
 * Parent: Absolute Master Freeze (`lib/absolute-master-freeze-v1.ts`)
 */

export const ROVEXO_GOLDEN_LAW_V1 = {
  version: "1.0",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  level: 8,
  name: "ROVEXO_GOLDEN_LAW",

  chain: [
    "IF THERE IS ONLY ONE WAY, THERE IS ONLY ONE OWNER.",
    "IF THERE IS ONLY ONE OWNER, THERE IS ONLY ONE IMPLEMENTATION.",
    "IF THERE IS ONLY ONE IMPLEMENTATION, THERE IS ONLY ONE SOURCE OF TRUTH.",
    "IF THERE IS ONLY ONE SOURCE OF TRUTH, THERE IS ONLY ONE RESPONSIBILITY.",
    "IF THERE IS ONLY ONE RESPONSIBILITY, THERE IS ONLY ONE PRODUCTION GATE.",
    "IF ONE PRODUCTION GATE FAILS, PRODUCTION DEPLOY IS FORBIDDEN.",
  ] as const,

  equation:
    "ONE OWNER = ONE RESPONSIBILITY = ONE IMPLEMENTATION = ONE SOURCE OF TRUTH = ONE PRODUCTION GATE.",

  singularityExamples: {
    header: { allowed: "ONE HEADER", forbidden: "2 HEADERS" },
    search: { allowed: "ONE SEARCH ENGINE", forbidden: "2 SEARCH ENGINES" },
    auth: { allowed: "ONE AUTH SYSTEM", forbidden: "2 AUTH SYSTEMS" },
    session: { allowed: "ONE SESSION OWNER", forbidden: "2 SESSION OWNERS" },
    cookie: { allowed: "ONE COOKIE OWNER", forbidden: "2 COOKIE OWNERS" },
    user: { allowed: "ONE USER OWNER", forbidden: "2 USER OWNERS" },
    callbacks: {
      allowed: "ONE CALLBACK OWNER",
      forbidden: "2 CALLBACK OWNERS",
    },
    database: {
      allowed: "ONE DATABASE OWNER",
      forbidden: "2 DATABASE OWNERS",
    },
    payments: {
      allowed: "ONE PAYMENT OWNER",
      forbidden: "2 PAYMENT OWNERS",
    },
    notifications: {
      allowed: "ONE NOTIFICATION OWNER",
      forbidden: "2 NOTIFICATION OWNERS",
    },
    providers: {
      allowed: "ONE PROVIDER OWNER",
      forbidden: "2 PROVIDER OWNERS",
    },
  } as const,

  evolutionForbidden: [
    "Header v2",
    "Header v3",
    "Search v4",
    "Search Pro",
    "Auth v5",
    "Session Manager",
    "Cookie Manager",
    "User Manager",
    "duplicated architectures",
    "duplicated systems",
    "duplicated owners",
    "duplicated implementations",
  ] as const,

  evolutionAllowed: {
    pattern: "FEATURE → optimized",
    domains: [
      "Header",
      "Search",
      "Camera Search",
      "Auth",
      "Session",
      "Cookie",
      "User",
    ] as const,
    withoutCreating: [
      "duplicated architectures",
      "duplicated systems",
      "duplicated owners",
      "duplicated implementations",
    ] as const,
  } as const,

  finalRule: {
    removeUntilOneRemains: [
      "duplicated code",
      "duplicated owners",
      "duplicated systems",
      "duplicated providers",
      "duplicated implementations",
      "duplicated states",
    ] as const,
  } as const,

  principle: [
    "SIMPLER",
    "SMALLER",
    "FASTER",
    "MORE SCALABLE",
    "MORE MAINTAINABLE",
    "MORE AUTOMATED",
    "MORE LONGEVITY",
  ] as const,

  productionDeployForbiddenIfAnyGateFails: true,

  ssot: {
    law: "lib/rovexo-golden-law-v1.ts",
    absoluteFreeze: "lib/absolute-master-freeze-v1.ts",
    ssotMasterLock: ".cursor/rules/ssot-master-lock.mdc",
  } as const,
} as const;

export type RovexoGoldenLawV1 = typeof ROVEXO_GOLDEN_LAW_V1;
