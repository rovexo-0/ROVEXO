/**
 * ROVEXO GLOBAL FAIL CLOSED ENGINE v1.0 (LOCK) — orchestration SSOT.
 */

import {
  FAIL_CLOSED_CRASH_PREVENTION_ALWAYS_ACTIVE,
  FAIL_CLOSED_ENGINE_NAME,
  FAIL_CLOSED_ENGINE_VERSION,
  FAIL_CLOSED_FEATURE_ID,
  FAIL_CLOSED_PRODUCTION_READY,
  type FailClosedSurface,
  type FailClosedVariant,
} from "@/lib/fail-closed/constants";
import {
  toUserSafeFailClosedMessage,
  type UserSafeFailClosedMessage,
} from "@/lib/fail-closed/sanitize";
import { areProductionRulesActive } from "@/lib/master-engine/activation";

export type FailClosedState = {
  surface: FailClosedSurface;
  message: UserSafeFailClosedMessage;
  /** Soft-fail — page chrome must remain. */
  softFail: true;
  /** Never expose to client logs as secrets. */
  exposeInternals: false;
};

/**
 * Crash prevention is always active (local + production).
 * Users must never see a white screen or secret leakage.
 */
export function isFailClosedCrashPreventionActive(): boolean {
  return FAIL_CLOSED_CRASH_PREVENTION_ALWAYS_ACTIVE === true;
}

/**
 * Production fail-closed latch (also true after activateProductionRules).
 * Crash prevention remains always-on regardless.
 */
export function isFailClosedProductionModeActive(): boolean {
  return areProductionRulesActive();
}

export function resolveFailClosedState(
  surface: FailClosedSurface = "unknown",
  error?: unknown,
  variant: FailClosedVariant = "unavailable",
): FailClosedState {
  return {
    surface,
    message: toUserSafeFailClosedMessage(error, variant),
    softFail: true,
    exposeInternals: false,
  };
}

/**
 * Safe wrapper for async page data loaders.
 * On failure → soft fail state (never throw to the route unless rethrow=true for notFound).
 */
export async function withFailClosed<T>(
  surface: FailClosedSurface,
  loader: () => Promise<T>,
  fallback: T,
): Promise<{ ok: true; data: T } | { ok: false; data: T; state: FailClosedState }> {
  try {
    const data = await loader();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      data: fallback,
      state: resolveFailClosedState(surface, error),
    };
  }
}

export function getFailClosedEngineSnapshot() {
  return {
    name: FAIL_CLOSED_ENGINE_NAME,
    version: FAIL_CLOSED_ENGINE_VERSION,
    productionReady: FAIL_CLOSED_PRODUCTION_READY,
    featureId: FAIL_CLOSED_FEATURE_ID,
    crashPreventionActive: isFailClosedCrashPreventionActive(),
    productionModeActive: isFailClosedProductionModeActive(),
  };
}

export {
  toUserSafeFailClosedMessage,
};
