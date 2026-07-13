/** ROVEXO AUTH v1 — Sprint 1 SSOT */

export const AUTH_MODULE_VERSION = "v1.0-sprint1" as const;

export const AUTH_ROUTES = {
  splash: "/splash",
  welcome: "/welcome",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  verifyEmail: "/verify-email",
  resetPassword: "/reset-password",
  home: "/",
} as const;

/** iPhone 17 Pro Max reference — 430 CSS px logical width. */
export const AUTH_MOBILE_REFERENCE = {
  viewportWidthPx: 430,
  maxContentWidthPx: 430,
  minTouchTargetPx: 48,
  primaryButtonHeightPx: 52,
  inputFontSizePx: 17,
} as const;

export const AUTH_SPLASH = {
  fadeDurationMs: 600,
  minDisplayMs: 800,
  maxWaitMs: 4000,
} as const;
