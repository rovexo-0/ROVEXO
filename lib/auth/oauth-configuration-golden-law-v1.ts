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
 * P10.6R — Authentication Roadmap (Owner Decision):
 *   Google → REQUIRED v1.0
 *   Apple → DEFERRED v2.0 (NOT a production blocker)
 *   Facebook → DEFERRED v2.0 (NOT a production blocker)
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
    /** Google ops configured per Owner Decision P10.6R — no longer the open blocker. */
    SUPABASE_CONFIGURATION: false,
    AWAITING_OWNER_LIVE_GOOGLE_CONFIRMATION: true,
    HISTORICAL_ERROR_WHEN_DISABLED:
      "400 validation_failed : provider is not enabled",
    /** @deprecated Prefer HISTORICAL_ERROR_WHEN_DISABLED */
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
   * OAUTH (v1.0 roadmap)
   *
   ***************************************************************/
  OAUTH: Object.freeze({
    GOOGLE_OPS_CONFIGURED: true,
    GOOGLE_LIVE: false,
    GOOGLE_LIVE_STATUS: "AWAITING_OWNER_LIVE_CONFIRMATION",
    APPLE: false,
    APPLE_ROADMAP: "DEFERRED_V2_NOT_BLOCKING",
    FACEBOOK: false,
    FACEBOOK_ROADMAP: "DEFERRED_V2_NOT_BLOCKING",
    ROOT_CAUSE_LEGACY: "Provider Disabled (historical)",
  }),

  /***************************************************************
   *
   * PROVIDERS
   *
   ***************************************************************/
  PROVIDERS: Object.freeze({
    GOOGLE: "MUST BE ENABLED (v1.0 REQUIRED)",
    APPLE: "DEFERRED_V2_NOT_BLOCKING",
    FACEBOOK: "DEFERRED_V2_NOT_BLOCKING",
  }),

  /***************************************************************
   *
   * CALLBACKS
   *
   ***************************************************************/
  CALLBACKS: Object.freeze({
    LOCAL: "http://localhost:3000/auth/callback",
    PRODUCTION: "https://www.rovexo.co.uk/auth/callback",
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
    "BLOCK V1 DEPLOY ON APPLE OAUTH",
    "BLOCK V1 DEPLOY ON FACEBOOK OAUTH",
  ]),

  /***************************************************************
   *
   * ALLOWED
   *
   ***************************************************************/
  ALLOWED: Object.freeze([
    "ENABLE GOOGLE",
    "ADD CALLBACK URLS",
    "ALLOWLIST ORIGINS",
    "SAVE CONFIGURATION",
    "TEST GOOGLE",
    "OWNER LIVE GOOGLE CONFIRMATION",
    "DEFER APPLE TO V2",
    "DEFER FACEBOOK TO V2",
  ]),

  /***************************************************************
   *
   * DEPLOYMENT LAW
   *
   ***************************************************************/
  DEPLOYMENT: Object.freeze({
    IF_GOOGLE_LIVE_FAILS: "NO DEPLOY",
    IF_APPLE_DEFERRED: "DO NOT BLOCK V1",
    IF_FACEBOOK_DEFERRED: "DO NOT BLOCK V1",
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
    GOOGLE_OPS_CONFIGURED: true,
    GOOGLE_LOGIN: false,
    GOOGLE_LIVE_STATUS: "AWAITING_OWNER_LIVE_CONFIRMATION",
    APPLE_LOGIN: false,
    APPLE_ROADMAP: "DEFERRED_V2_NOT_BLOCKING",
    FACEBOOK_LOGIN: false,
    FACEBOOK_ROADMAP: "DEFERRED_V2_NOT_BLOCKING",
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
    OAUTH_V1: "EMAIL + GOOGLE LIVE = V1 OAUTH GATE · APPLE/FACEBOOK = DEFERRED V2",
    IF_CONFIG_FAILS_AND_AUTH_CORE_PASSES:
      "NO CODE CHANGES. ONLY ENABLE GOOGLE + ALLOWLIST CALLBACK URLS + OWNER LIVE TEST + PASS + DEPLOY.",
    DEPLOY_GATE: "100/100 = DEPLOY · 99/100 = NO DEPLOY · 1 FAIL = NO DEPLOY · ZERO EXCEPTIONS",
  }),
});

export type RovexoOauthConfigurationGoldenLawV1 =
  typeof ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1;

export default ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1;
