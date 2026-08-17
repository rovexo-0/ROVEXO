/**
 * ROVEXO PWA update engine — ONE canonical install + update lifecycle.
 * Used by PwaProvider. Does not register a second service worker.
 */

import {
  ROVEXO_APP_VERSION,
  ROVEXO_SW_CACHE_EPOCH,
  ROVEXO_SW_CACHE_NAME,
} from "@/lib/app/version";

export const ROVEXO_PWA_ID = "https://www.rovexo.co.uk/" as const;
export const ROVEXO_SW_SCRIPT = "/sw.js" as const;
export const ROVEXO_SW_SCOPE = "/" as const;
export const ROVEXO_SW_SKIP_WAITING_MESSAGE = "ROVEXO_SKIP_WAITING" as const;
export const ROVEXO_SW_RELOAD_SESSION_KEY = "rovexo-sw-reload-version" as const;

/** Paths where a forced reload can lose money, auth, or in-progress work. */
export const ROVEXO_PWA_UNSAFE_RELOAD_PREFIXES = [
  "/checkout",
  "/sell",
  "/login",
  "/register",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/inbox/conversation",
  "/orders/",
] as const;

export function isUnsafePwaReloadPath(pathname: string): boolean {
  const path = (pathname.split("?")[0] ?? pathname).replace(/\/+$/, "") || "/";
  if (path === "/orders") return false;
  return ROVEXO_PWA_UNSAFE_RELOAD_PREFIXES.some((prefix) => {
    if (prefix.endsWith("/")) {
      return path === prefix.slice(0, -1) || path.startsWith(prefix);
    }
    return path === prefix || path.startsWith(`${prefix}/`);
  });
}

export function shouldReloadForServiceWorkerUpdate(input: {
  pathname: string;
  nextVersion: string;
  alreadyReloadedForVersion: string | null;
  isFormActive: boolean;
}): boolean {
  if (!input.nextVersion) return false;
  if (input.alreadyReloadedForVersion === input.nextVersion) return false;
  if (input.isFormActive) return false;
  if (isUnsafePwaReloadPath(input.pathname)) return false;
  return true;
}

export type DeferredSafeReloadDecision = "skipped" | "scheduled" | "already-armed";

type DeferredReloadSchedulerState = {
  scheduled: boolean;
  executed: boolean;
};

let deferredReloadScheduler: DeferredReloadSchedulerState = {
  scheduled: false,
  executed: false,
};

export function resetDeferredSafeServiceWorkerReloadForTests(): void {
  deferredReloadScheduler = { scheduled: false, executed: false };
}

export type ScheduleDeferredSafeServiceWorkerReloadInput = {
  getPathname: () => string;
  nextVersion: string;
  getAlreadyReloadedForVersion: () => string | null;
  getIsFormActive: () => boolean;
  reload: () => void;
  /** Test injection. Production uses after-paint / idle scheduling. */
  schedule?: (run: () => void) => void;
};

function policyAllowsReload(
  input: ScheduleDeferredSafeServiceWorkerReloadInput,
): boolean {
  return shouldReloadForServiceWorkerUpdate({
    pathname: input.getPathname(),
    nextVersion: input.nextVersion,
    alreadyReloadedForVersion: input.getAlreadyReloadedForVersion(),
    isFormActive: input.getIsFormActive(),
  });
}

function scheduleAfterInitialPaint(run: () => void): void {
  const afterPaint = () => {
    const idle = (
      globalThis as typeof globalThis & {
        requestIdleCallback?: (
          callback: () => void,
          options?: { timeout: number },
        ) => number;
      }
    ).requestIdleCallback;
    if (typeof idle === "function") {
      idle(() => run(), { timeout: 2500 });
      return;
    }
    setTimeout(run, 0);
  };

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      requestAnimationFrame(afterPaint);
    });
    return;
  }
  afterPaint();
}

/**
 * Arm at most one safe SW update reload for this page lifecycle.
 * Never reloads synchronously — first paint / idle must complete first.
 */
export function scheduleDeferredSafeServiceWorkerReload(
  input: ScheduleDeferredSafeServiceWorkerReloadInput,
): DeferredSafeReloadDecision {
  if (deferredReloadScheduler.executed || deferredReloadScheduler.scheduled) {
    return "already-armed";
  }
  if (!policyAllowsReload(input)) {
    return "skipped";
  }

  deferredReloadScheduler.scheduled = true;

  const fire = () => {
    if (deferredReloadScheduler.executed) return;
    if (!policyAllowsReload(input)) return;
    deferredReloadScheduler.executed = true;
    input.reload();
  };

  (input.schedule ?? scheduleAfterInitialPaint)(fire);
  return "scheduled";
}

export function pwaReleaseIdentity() {
  return {
    web: ROVEXO_APP_VERSION,
    pwa: ROVEXO_APP_VERSION,
    swEpoch: ROVEXO_SW_CACHE_EPOCH,
    swCacheName: ROVEXO_SW_CACHE_NAME,
    id: ROVEXO_PWA_ID,
  } as const;
}
