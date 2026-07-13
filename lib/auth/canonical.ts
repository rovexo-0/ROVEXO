/** ROVEXO AUTH v1 — re-exports AUTH_MASTER_SPEC v1.0 SSOT */

import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";

export {
  AUTH_MASTER_SPEC,
  AUTH_MASTER_SPEC_VERSION,
  type AuthSplashPhase,
} from "@/lib/auth/master-spec";

export const AUTH_MODULE_VERSION = AUTH_MASTER_SPEC_VERSION;

export const AUTH_ROUTES = AUTH_MASTER_SPEC.routes;

export const AUTH_MOBILE_REFERENCE = AUTH_MASTER_SPEC.mobileReference;

export const AUTH_SPLASH = {
  phases: AUTH_MASTER_SPEC.splash.phases,
  fadeDurationMs: AUTH_MASTER_SPEC.splash.fadeDurationMs,
  minDisplayMs: AUTH_MASTER_SPEC.splash.minDisplayMs,
  maxWaitMs: AUTH_MASTER_SPEC.splash.maxWaitMs,
} as const;
