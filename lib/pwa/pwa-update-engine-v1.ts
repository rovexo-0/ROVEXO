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

export function pwaReleaseIdentity() {
  return {
    web: ROVEXO_APP_VERSION,
    pwa: ROVEXO_APP_VERSION,
    swEpoch: ROVEXO_SW_CACHE_EPOCH,
    swCacheName: ROVEXO_SW_CACHE_NAME,
    id: ROVEXO_PWA_ID,
  } as const;
}
