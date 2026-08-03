/**
 * ROVEXO OAUTH CONFIGURATION FREEZE v1.0
 * ABSOLUTE AUTHORITY · LEVEL 8 · SSOT
 *
 * STATUS: OWNER APPROVED · LOCKED · FROZEN · SSOT READY
 *
 * ROOT CAUSE (ONLY ONE):
 * Supabase Auth providers are not enabled → 400 validation_failed
 * "Unsupported provider: provider is not enabled"
 *
 * MISSION: NO CODE CHANGES · NO AUTH REWRITES · NO NEW AUTH SYSTEMS
 * ONLY CONFIGURATION IS ALLOWED.
 *
 * IF AUTH WORKS → DO NOT TOUCH IT.
 * IF CONFIGURATION FAILS → FIX CONFIGURATION ONLY.
 */

export const OAUTH_CONFIGURATION_FREEZE_V1 = {
  version: "1.0",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  ssotReady: true,
  level: 8,
  certified: true,

  mission: {
    noCodeChangesRequired: true,
    noAuthRewritesRequired: true,
    noNewAuthSystemsRequired: true,
    onlyConfigurationAllowed: true,
  } as const,

  rootCause: {
    id: 1,
    onlyOne: true,
    statement: "SUPABASE AUTH PROVIDERS ARE NOT ENABLED.",
    error: {
      http: 400,
      code: "validation_failed",
      message: "Unsupported provider: provider is not enabled",
    } as const,
  } as const,

  currentStatus: {
    emailLogin: "PASS",
    emailRegister: "PASS",
    rememberMe: "PASS",
    forgotPassword: "PASS",
    sessionRestore: "PASS",
    cookieSession: "PASS",
    header: "PASS",
    search: "PASS",
    cameraSearch: "PASS",
    googleLogin: "FAIL",
    appleLogin: "FAIL",
    facebookLogin: "FAIL",
  } as const,

  allowedActions: [
    "ENABLE GOOGLE PROVIDER",
    "ENABLE APPLE PROVIDER",
    "ENABLE FACEBOOK PROVIDER",
    "CONFIGURE CALLBACK URLS",
    "CONFIGURE LOCAL ORIGIN",
    "CONFIGURE PRODUCTION ORIGIN",
    "SAVE",
    "TEST",
    "PASS",
    "PRODUCTION READY",
  ] as const,

  callbackRules: {
    local: "http://localhost:3000",
    production: "https://www.rovexo.co.uk",
    stagingOptional: "https://staging.rovexo.com",
    authCallbackPath: "/auth/callback",
  } as const,

  goldenRule: {
    fourHundredErrorMustNeverProduce: [
      "rewrites",
      "refactors",
      "new architectures",
      "duplicated systems",
      "duplicated providers",
      "duplicated implementations",
    ] as const,
    fourHundredErrorMustAlwaysProduce: [
      "AUDIT",
      "ROOT CAUSE FOUND",
      "CONFIGURATION FIX",
      "PASS",
      "DONE",
    ] as const,
  } as const,

  finalLevel8Law: {
    whenHeaderSearchCameraAuthPassAndOnlyOauthConfigFails:
      "THE APPLICATION CODE MUST NOT BE MODIFIED. ONLY THE CONFIGURATION MAY BE MODIFIED.",
  } as const,

  forbiddenForever: [
    "Auth rewrites",
    "Session rewrites",
    "Cookie rewrites",
    "Middleware rewrites",
    "Login rewrites",
    "Register rewrites",
    "Header rewrites",
    "Search rewrites",
    "New Auth Systems",
    "New Session Systems",
    "New Cookie Systems",
    "New Providers",
    "Custom OAuth Systems",
    "Multiple Callback Systems",
    "Multiple User Owners",
    "GOOGLE FAILS → REWRITE AUTH",
    "APPLE FAILS → REWRITE AUTH",
    "FACEBOOK FAILS → REWRITE AUTH",
  ] as const,

  /** Target gates after Owner configuration (not a claim that live OAuth already passes). */
  productionGatesAfterConfig: {
    emailLogin: "PASS",
    emailRegister: "PASS",
    rememberMe: "PASS",
    forgotPassword: "PASS",
    sessionRestore: "PASS",
    cookieSession: "PASS",
    header: "PASS",
    search: "PASS",
    cameraSearch: "PASS",
    googleLogin: "PASS",
    appleLogin: "PASS",
    facebookLogin: "PASS",
    googleEnabled: "PASS",
    appleEnabled: "PASS",
    facebookEnabled: "PASS",
    callbackUrls: "PASS",
    localhostUrl: "PASS",
    productionUrl: "PASS",
    no400Errors: "PASS",
    noProviderFailures: "PASS",
    noValidationFailures: "PASS",
    noOauthFailures: "PASS",
    productionReady: "PASS",
  } as const,

  masterFreeze: {
    oneAuthSystem: true,
    oneSessionOwner: true,
    oneCookieOwner: true,
    oneCallbackOwner: true,
    oneSourceOfTruth: true,
    ifAuthWorksDoNotTouchIt: true,
    ifConfigurationFailsFixConfigurationOnly: true,
    zeroAuthRewrites: true,
    zeroArchitectureChanges: true,
    zeroNewSystems: true,
  } as const,

  ssot: {
    /** Canonical Owner Object.freeze law for OAuth configuration ops */
    oauthConfigurationGoldenLaw: "lib/auth/oauth-configuration-golden-law-v1.ts",
    freeze: "lib/auth/oauth-configuration-freeze-v1.ts",
    authMasterFreeze: "lib/auth/auth-master-freeze-v1.ts",
    goldenLaw: "lib/rovexo-golden-law-v1.ts",
    absoluteFreeze: "lib/absolute-master-freeze-v1.ts",
    actions: "lib/auth/actions.ts",
    callback: "app/(platform)/auth/callback/route.ts",
  } as const,
} as const;

export type OauthConfigurationFreezeV1 = typeof OAUTH_CONFIGURATION_FREEZE_V1;
