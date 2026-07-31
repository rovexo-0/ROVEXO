/**
 * ROVEXO AUTH v1.0 — MASTER FREEZE
 * ABSOLUTE AUTHORITY · LEVEL 8 · SSOT
 *
 * STATUS: OWNER APPROVED · LOCKED · FROZEN · SSOT READY
 *
 * ONE AUTH SYSTEM · ONE SESSION OWNER · ONE USER OWNER · ONE CALLBACK OWNER
 * SUPABASE AUTH IS THE SINGLE SOURCE OF TRUTH.
 *
 * NO FURTHER AUTH ARCHITECTURE CHANGES without Owner re-authorization.
 */

export const AUTH_MASTER_FREEZE_V1 = {
  version: "1.0",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  ssotReady: true,
  level: 8,

  canonicalAuthSystem: "SUPABASE_AUTH" as const,

  singularity: {
    oneAuthSystem: "SUPABASE_AUTH",
    oneSessionOwner: "SUPABASE_AUTH",
    oneCookieOwner: "SUPABASE_AUTH",
    oneUserOwner: "SUPABASE_AUTH",
    oneCallbackOwner: "SUPABASE_AUTH",
  } as const,

  loginMethods: {
    email: "ACTIVE",
    google: "ACTIVE",
    apple: "ACTIVE",
    facebook: "OPTIONAL",
  } as const,

  registerMethods: {
    email: "ACTIVE",
    google: "ACTIVE",
    apple: "ACTIVE",
    facebook: "OPTIONAL",
  } as const,

  /** Owner-approved OAuth / auth redirect origins only. */
  allowedOrigins: {
    localDevelopment: "http://localhost:3000",
    production: "https://www.rovexo.co.uk",
    stagingOptional: "https://staging.rovexo.com",
  } as const,

  callbackPath: "/auth/callback" as const,

  notAllowedOrigins: [
    "wrong ports",
    "duplicated callbacks",
    "wildcard callbacks",
    "unknown origins",
  ] as const,

  loginFlows: {
    email: [
      "Email",
      "Password",
      "Sign In",
      "Session Created",
      "Cookie Created",
      "Redirect",
      "Homepage",
    ],
    google: [
      "Google",
      "OAuth",
      "Google Consent",
      "Supabase Callback",
      "Session Created",
      "Cookie Created",
      "Redirect",
      "Homepage",
    ],
    apple: [
      "Apple",
      "OAuth",
      "Apple Consent",
      "Supabase Callback",
      "Session Created",
      "Cookie Created",
      "Redirect",
      "Homepage",
    ],
    facebook: [
      "Facebook",
      "OAuth",
      "Facebook Consent",
      "Supabase Callback",
      "Session Created",
      "Cookie Created",
      "Redirect",
      "Homepage",
    ],
  } as const,

  requiredGates: {
    googleOAuthEnabled: "PASS",
    appleOAuthEnabled: "PASS",
    facebookOAuthEnabled: "PASS",
    callbackUrlsValid: "PASS",
    oauthRedirect: "PASS",
    sessionRestore: "PASS",
    rememberMe: "PASS",
    forgotPassword: "PASS",
    emailLogin: "PASS",
    emailRegister: "PASS",
  } as const,

  productionGates: {
    emailLogin: "PASS",
    emailRegister: "PASS",
    googleLogin: "PASS",
    appleLogin: "PASS",
    facebookLogin: "PASS",
    rememberMe: "PASS",
    forgotPassword: "PASS",
    sessionRestore: "PASS",
    cookieSession: "PASS",
    signOut: "PASS",
    callbackUrls: "PASS",
    oauthProviders: "PASS",
    envVariables: "PASS",
    localhostUrl: "PASS",
    productionUrl: "PASS",
    no400Errors: "PASS",
    noRedirectLoops: "PASS",
    noOauthFailures: "PASS",
    noProviderFailures: "PASS",
    productionReady: "PASS",
  } as const,

  forbidden: [
    "multiple auth systems",
    "multiple session owners",
    "multiple cookie owners",
    "duplicated callbacks",
    "duplicated redirects",
    "multiple OAuth implementations",
    "custom auth systems",
    "duplicated middleware",
    "duplicated providers",
    "duplicated session managers",
    "duplicated user stores",
    "duplicated auth APIs",
    "application rewrites for auth",
    "custom session systems",
  ] as const,

  longTermRule: {
    neverRequire: [
      "application rewrites",
      "custom session systems",
      "multiple auth providers systems",
      "duplicated callbacks",
      "duplicated redirects",
      "duplicated user stores",
      "duplicated cookie systems",
    ] as const,
    ssot: "SUPABASE_AUTH",
  } as const,

  ssot: {
    freeze: "lib/auth/auth-master-freeze-v1.ts",
    masterSpec: "lib/auth/master-spec.ts",
    actions: "lib/auth/actions.ts",
    callback: "app/auth/callback/route.ts",
    sessionCookies: "lib/auth/session-cookies.ts",
    middleware: "lib/supabase/middleware.ts",
    loginUi: "features/auth/components/LoginScreen.tsx",
    registerUi: "features/auth/components/RegisterScreen.tsx",
    oauthButtons: "features/auth/components/AuthOAuthButtons.tsx",
  } as const,
} as const;

export type AuthMasterFreezeV1 = typeof AUTH_MASTER_FREEZE_V1;
