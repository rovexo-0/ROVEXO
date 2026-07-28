/******************************************************************
 *
 * ROVEXO PRODUCTION CERTIFICATION LAW v1.0
 *
 * LEVEL 8
 * OWNER APPROVED
 * LOCKED
 * FROZEN
 * CANONICAL SSOT
 *
 ******************************************************************/

export const ROVEXO_PRODUCTION_CERTIFICATION_V1 = Object.freeze({
  VERSION: "1.0",
  STATUS: "LOCKED",
  LEVEL: 8,
  CANONICAL: true,
  APPROVED_BY_OWNER: true,
  FROZEN: true,
  SSOT_READY: true,

  /******************************************************************
   *
   * BUILD GATES
   *
   ******************************************************************/
  BUILD: Object.freeze({
    TYPESCRIPT: true,
    ESLINT: true,
    BUILD: true,
    TESTS: true,
    PREVIEW_DEPLOY: true,
  }),

  /******************************************************************
   *
   * AUTH GATES
   *
   ******************************************************************/
  AUTH: Object.freeze({
    EMAIL_LOGIN: true,
    EMAIL_REGISTER: true,
    COOKIE_SESSION: true,
    SESSION_RESTORE: true,
    FORGOT_PASSWORD: true,
    REMEMBER_ME: true,
    AUTH_CALLBACK: true,
    GOOGLE_LOGIN: false,
    APPLE_LOGIN: false,
    FACEBOOK_LOGIN: false,
  }),

  /******************************************************************
   *
   * SEARCH GATES
   *
   ******************************************************************/
  SEARCH: Object.freeze({
    SEARCH_ENGINE: true,
    SEARCH_PROVIDER: true,
    CAMERA_SEARCH: true,
    IMAGE_SEARCH: true,
    FILTERS: true,
    ROUTER: true,
    HYDRATION: true,
  }),

  /******************************************************************
   *
   * HEADER GATES
   *
   ******************************************************************/
  HEADER: Object.freeze({
    ONE_HEADER: true,
    ONE_OWNER: true,
    ONE_SSOT: true,
    HEADER_PROVIDER: true,
    HEADER_SURVIVES_NAVIGATION: true,
    AVATAR_SURVIVES_NAVIGATION: true,
    SECOND_API_FETCH: false,
    HEADER_REMOUNT: false,
    AVATAR_REMOUNT: false,
  }),

  /******************************************************************
   *
   * ARCHITECTURE
   *
   ******************************************************************/
  ARCHITECTURE: Object.freeze({
    ONE_AUTH_SYSTEM: true,
    ONE_SEARCH_SYSTEM: true,
    ONE_HEADER_SYSTEM: true,
    ONE_COOKIE_SYSTEM: true,
    ONE_SESSION_SYSTEM: true,
    ONE_CALLBACK_SYSTEM: true,
    ONE_OWNER_PER_DOMAIN: true,
  }),

  /******************************************************************
   *
   * GOLDEN DEPLOYMENT LAW
   *
   ******************************************************************/
  DEPLOYMENT: Object.freeze({
    PASS_100: "DEPLOY",
    PASS_99: "NO DEPLOY",
    ONE_FAIL: "NO DEPLOY",
    ZERO_EXCEPTIONS: true,
  }),

  /******************************************************************
   *
   * FORBIDDEN
   *
   ******************************************************************/
  FORBIDDEN: Object.freeze([
    "AUTH V2",
    "SEARCH V2",
    "HEADER V2",
    "NEW SYSTEMS",
    "NEW OWNERS",
    "PARALLEL IMPLEMENTATIONS",
    "PRODUCTION HOTFIX DEPLOY",
    "BUILD -> DEPLOY -> FIX AFTER",
    "DEPLOY AT 99 PERCENT",
    "IGNORE FAILED GATES",
  ]),

  /******************************************************************
   *
   * REQUIRED ORDER
   *
   ******************************************************************/
  ORDER: Object.freeze([
    "BUILD",
    "AUDIT",
    "TEST",
    "CERTIFY",
    "LOCK",
    "PASS",
    "100_OF_100",
    "PREVIEW",
    "PRODUCTION_DEPLOY",
    "DONE",
  ]),

  /******************************************************************
   *
   * LEVEL 8 EQUATION
   *
   ******************************************************************/
  PRODUCTION_EQUATION: Object.freeze({
    HEADER: true,
    SEARCH: true,
    CAMERA_SEARCH: true,
    AUTH_CORE: true,
    COOKIE_SESSION: true,
    SESSION_RESTORE: true,
    ROUTER: true,
    IMAGE_SEARCH: true,
    BUILD: true,
    TESTS: true,
    GOOGLE: false,
    APPLE: false,
    FACEBOOK: false,
    PRODUCTION_READY: false,
  }),

  /******************************************************************
   *
   * OWNER LAW
   *
   ******************************************************************/
  OWNER_LAW: Object.freeze({
    IF_CODE_IS_CORRECT: "DO NOT TOUCH",
    IF_CONFIGURATION_FAILS: "FIX CONFIGURATION ONLY",
    IF_ARCHITECTURE_PASSES: "PRESERVE ARCHITECTURE",
    IF_ONE_GATE_FAILS: "NO DEPLOY",
    IF_ALL_GATES_PASS: "DEPLOY_ALLOWED",
  }),

  /******************************************************************
   *
   * CURRENT CERTIFICATION STATUS
   *
   ******************************************************************/
  CURRENT_STATUS: Object.freeze({
    ROOT_CAUSE: "SUPABASE_OAUTH_CONFIGURATION",
    PRODUCTION_READY: false,
    NO_CODE_CHANGES_REQUIRED: true,
    NO_ARCHITECTURE_CHANGES_REQUIRED: true,
    OWNER_OPS_ONLY: true,
    UNTIL_OAUTH_PASSES: "NO DEPLOY",
    SMALLEST_FIX: Object.freeze([
      "ENABLE GOOGLE",
      "ENABLE APPLE",
      "ENABLE FACEBOOK",
      "ADD CALLBACK URLS",
      "SAVE",
      "TEST",
      "PASS",
    ]),
    LEVEL_8_VERDICT: Object.freeze({
      CODE: "PASS",
      ARCHITECTURE: "PASS",
      AUTH_CORE: "PASS",
      SEARCH: "PASS",
      HEADER: "PASS",
      SESSION: "PASS",
      OAUTH_CONFIG: "FAIL",
    }),
  }),
});

export type RovexoProductionCertificationV1 =
  typeof ROVEXO_PRODUCTION_CERTIFICATION_V1;

export default ROVEXO_PRODUCTION_CERTIFICATION_V1;
