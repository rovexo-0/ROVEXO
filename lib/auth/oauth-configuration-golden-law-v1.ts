/***************************************************************
 *
 * ROVEXO OAUTH CONFIGURATION GOLDEN LAW v1.0
 *
 * LEVEL 8
 * OWNER APPROVED
 * LOCKED
 * FROZEN
 * CANONICAL SSOT
 *
 * IF CONFIGURATION FAILS AND AUTH CORE PASSES →
 * NO CODE CHANGES. ENABLE PROVIDERS + ALLOWLIST CALLBACKS ONLY.
 *
 ***************************************************************/

export const ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1 = Object.freeze({
  VERSION: "1.0",
  STATUS: "LOCKED",
  LEVEL: 8,
  CANONICAL: true,
  APPROVED_BY_OWNER: true,
  FROZEN: true,
  SSOT_READY: true,

  /***************************************************************
   *
   * ROOT CAUSE
   *
   ***************************************************************/
  ROOT_CAUSE: Object.freeze({
    CODE: false,
    ARCHITECTURE: false,
    AUTH_SYSTEM: false,
    HEADER: false,
    SEARCH: false,
    CAMERA_SEARCH: false,
    COOKIE_SESSION: false,
    SUPABASE_CONFIGURATION: true,
    ERROR: "400 validation_failed : provider is not enabled",
  }),

  /***************************************************************
   *
   * AUTH CORE
   *
   ***************************************************************/
  AUTH_CORE: Object.freeze({
    EMAIL_LOGIN: true,
    EMAIL_REGISTER: true,
    COOKIE_SESSION: true,
    SESSION_RESTORE: true,
    AUTH_CALLBACK: true,
    HEADER: true,
    SEARCH: true,
    CAMERA_SEARCH: true,
    PRODUCTION_READY: true,
  }),

  /***************************************************************
   *
   * OAUTH
   *
   ***************************************************************/
  OAUTH: Object.freeze({
    GOOGLE: false,
    APPLE: false,
    FACEBOOK: false,
    ROOT_CAUSE: "Provider Disabled",
  }),

  /***************************************************************
   *
   * PROVIDERS
   *
   ***************************************************************/
  PROVIDERS: Object.freeze({
    GOOGLE: "MUST BE ENABLED",
    APPLE: "MUST BE ENABLED",
    FACEBOOK: "OPTIONAL BUT SUPPORTED",
  }),

  /***************************************************************
   *
   * CALLBACKS
   *
   ***************************************************************/
  CALLBACKS: Object.freeze({
    LOCAL: "http://localhost:3000/auth/callback",
    PRODUCTION: "https://rovexo.com/auth/callback",
    STAGING: "https://staging.rovexo.com/auth/callback",
  }),

  /***************************************************************
   *
   * GOLDEN PRINCIPLE
   *
   ***************************************************************/
  GOLDEN_PRINCIPLE: Object.freeze({
    RULE_1: "CODE IS ALWAYS THE LAST SUSPECT",
    RULE_2: "CONFIGURATION BEFORE CODE",
    RULE_3: "ONE ROOT CAUSE",
    RULE_4: "ONE SMALLEST FIX",
    RULE_5: "MAXIMUM ARCHITECTURE PRESERVATION",
    RULE_6: "NO AUTH REWRITES",
    RULE_7: "NO NEW SYSTEMS",
    RULE_8: "NO EXCEPTIONS",
  }),

  /***************************************************************
   *
   * FORBIDDEN
   *
   ***************************************************************/
  FORBIDDEN: Object.freeze([
    "AUTH V2",
    "OAUTH V2",
    "NEW AUTH SYSTEM",
    "NEW PROVIDERS",
    "COOKIE REWRITES",
    "SESSION REWRITES",
    "HEADER REWRITES",
    "SEARCH REWRITES",
    "CALLBACK REWRITES",
    "SUPABASE REPLACEMENT",
    "CODE CHANGES FOR CONFIG ERRORS",
  ]),

  /***************************************************************
   *
   * ALLOWED
   *
   ***************************************************************/
  ALLOWED: Object.freeze([
    "ENABLE GOOGLE",
    "ENABLE APPLE",
    "ENABLE FACEBOOK",
    "ADD CALLBACK URLS",
    "ALLOWLIST ORIGINS",
    "SAVE CONFIGURATION",
    "TEST PROVIDERS",
  ]),

  /***************************************************************
   *
   * DEPLOYMENT LAW
   *
   ***************************************************************/
  DEPLOYMENT: Object.freeze({
    IF_ONE_PROVIDER_FAILS: "NO DEPLOY",
    IF_CONFIGURATION_FAILS: "FIX CONFIGURATION ONLY",
    IF_CODE_FAILS: "FIX CODE",
    IF_ARCHITECTURE_FAILS: "FIX ARCHITECTURE",
    IF_99_PERCENT: "NO DEPLOY",
    IF_100_PERCENT: "DEPLOY ALLOWED",
  }),

  /***************************************************************
   *
   * SUCCESS GATES
   *
   ***************************************************************/
  SUCCESS_GATES: Object.freeze({
    EMAIL_LOGIN: true,
    EMAIL_REGISTER: true,
    COOKIE_SESSION: true,
    SESSION_RESTORE: true,
    AUTH_CALLBACK: true,
    GOOGLE_LOGIN: false,
    APPLE_LOGIN: false,
    FACEBOOK_LOGIN: false,
    NO_REDIRECT_LOOPS: true,
    NO_HEADER_REMOUNT: true,
    NO_SEARCH_FAILURES: true,
    NO_CAMERA_FAILURES: true,
    PRODUCTION_READY: false,
  }),

  /***************************************************************
   *
   * LEVEL 8 EQUATION (documentation)
   *
   ***************************************************************/
  LEVEL_8_EQUATION: Object.freeze({
    AUTH_CORE_PLUS_PLATFORM:
      "AUTH CORE + SEARCH + HEADER + SESSION + COOKIE + CAMERA + CALLBACK + SUPABASE = 100% PASS (core)",
    OAUTH_IS_CONFIGURATION: "GOOGLE + APPLE + FACEBOOK = CONFIGURATION",
    IF_CONFIG_FAILS_AND_AUTH_CORE_PASSES:
      "NO CODE CHANGES. ONLY ENABLE PROVIDERS + ALLOWLIST CALLBACK URLS + TEST + PASS + DEPLOY.",
    DEPLOY_GATE: "100/100 = DEPLOY · 99/100 = NO DEPLOY · 1 FAIL = NO DEPLOY · ZERO EXCEPTIONS",
  }),
});

export type RovexoOauthConfigurationGoldenLawV1 =
  typeof ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1;

export default ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1;
