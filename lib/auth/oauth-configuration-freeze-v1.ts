/**
 * ROVEXO OAUTH CONFIGURATION FREEZE v1.0
 * ABSOLUTE AUTHORITY · LEVEL 8 · SSOT
 *
 * STATUS: OWNER APPROVED · LOCKED · FROZEN · SSOT READY
 *
 * HISTORICAL ROOT CAUSE (when providers disabled):
 * Supabase Auth providers not enabled → 400 validation_failed
 * "Unsupported provider: provider is not enabled"
 *
 * MISSION: NO CODE CHANGES · NO AUTH REWRITES · NO NEW AUTH SYSTEMS
 * ONLY CONFIGURATION IS ALLOWED.
 *
 * P10.6R — Authentication Roadmap (Owner Decision):
 *   Google → REQUIRED v1.0 (ops configured · live confirmation awaiting)
 *   Apple → DEFERRED v2.0 · NOT a production blocker
 *   Facebook → DEFERRED v2.0 · NOT a production blocker
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
    googleOpsConfigured: "PASS",
    googleLogin: "AWAITING_OWNER_LIVE_CONFIRMATION",
    appleLogin: "DEFERRED_V2_NOT_BLOCKING",
    facebookLogin: "DEFERRED_V2_NOT_BLOCKING",
  } as const,

  allowedActions: [
    "ENABLE GOOGLE PROVIDER",
    "CONFIGURE CALLBACK URLS",
    "CONFIGURE LOCAL ORIGIN",
    "CONFIGURE PRODUCTION ORIGIN",
    "OWNER LIVE GOOGLE CONFIRMATION",
    "SAVE",
    "TEST",
    "PASS",
    "PRODUCTION READY",
    "DEFER APPLE TO V2",
    "DEFER FACEBOOK TO V2",
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

  /**
   * Target gates for v1.0 after Owner Google live confirmation
   * (Apple/Facebook deferred — not required for productionReady).
   */
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
    googleEnabled: "PASS",
    appleLogin: "DEFERRED_V2_NOT_BLOCKING",
    facebookLogin: "DEFERRED_V2_NOT_BLOCKING",
    callbackUrls: "PASS",
    localhostUrl: "PASS",
    productionUrl: "PASS",
    no400Errors: "PASS",
    noGoogleProviderFailures: "PASS",
    noValidationFailures: "PASS",
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
