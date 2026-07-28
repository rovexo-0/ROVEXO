/**
 * ROVEXO BUILD ABSOLUTE LAW v1.0 (Blood Code)
 *
 * localhost:3000 ONLY for development / certification evidence.
 * www.rovexo.co.uk = LIVE · LOCKED · security fix only.
 *
 * NO FEATURE MAY BE CERTIFIED IF BUILD = FAIL.
 * Only two states: 0% or 100%. No 99%.
 *
 * Owner alone may declare BUILD / BUY NOW / E2E / CERTIFICATION = PASS.
 * Until then: IN DEVELOPMENT.
 */

export const BUILD_ABSOLUTE_LAW_V1 = {
  version: "1.0",
  status: "PRIORITY_0_LOCKED",
  developmentOnly: "http://localhost:3000" as const,
  productionLocked: "https://www.rovexo.co.uk" as const,
  productionPolicy: "SECURITY_FIX_ONLY" as const,
  binaryStates: [0, 100] as const,
  forbiddenPartialScores: [70, 80, 90, 95, 99, 99.9] as const,
  equation: "NO_BUILD_PASS = NO_CERTIFICATION",
  developmentChain: [
    "BUILD_PASS",
    "APPLICATION_PASS",
    "BUY_NOW_PASS",
    "CHECKOUT_PASS",
    "PAYMENT_PASS",
    "STRIPE_PASS",
    "SHIPPING_PASS",
    "ORDER_PASS",
    "ESCROW_PASS",
    "SUCCESS_PASS",
    "E2E_PASS",
    "CERTIFICATION_PASS",
    "FREEZE",
    "DEPLOY",
  ] as const,
  buildMustPass: [
    "TYPESCRIPT",
    "NEXTJS",
    "TAILWIND",
    "CSS",
    "APPLICATION_LOAD",
    "ROUTING",
    "NO_HYDRATION_ERRORS",
  ] as const,
  forbidden: [
    "CERTIFY_BUY_NOW_WHEN_BUILD_FAILS",
    "CERTIFY_PAYMENT_WHEN_BUILD_FAILS",
    "CERTIFY_CHECKOUT_WHEN_APP_DOES_NOT_LOAD",
    "DECLARE_PASS_WITHOUT_OWNER",
  ] as const,
  ownerOnlyDeclarations: [
    "BUILD_PASS",
    "CHECKOUT_PASS",
    "PAYMENT_PASS",
    "BUY_NOW_PASS",
    "E2E_PASS",
    "CERTIFICATION_PASS",
    "READY_FOR_DEPLOYMENT",
  ] as const,
  parentLaws: {
    priority0BuildMustLive: "lib/priority-0-build-must-live-v1.ts",
    buyNowAbsolute: "lib/checkout/buy-now-absolute-law-v1.ts",
    absoluteLocalhost: ".cursor/rules/absolute-localhost-certification-v1.mdc",
  } as const,
  defaultStatusUntilOwnerPass: "IN_DEVELOPMENT" as const,
} as const;

export type BuildAbsoluteLawV1 = typeof BUILD_ABSOLUTE_LAW_V1;
