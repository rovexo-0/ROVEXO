/**
 * Canonical guest entry for ROVEXO Auth.
 * Unauthenticated users land on Login — Splash and Welcome removed.
 */

import { AUTH_ROUTES } from "@/lib/auth/canonical";

/** Locked guest destination (AUTH_MASTER_SPEC.startup.guestEntry). */
export const AUTH_GUEST_ENTRY_PATH = AUTH_ROUTES.login;

/**
 * Build a path for unauthenticated redirects.
 * Optional `next` is preserved for post-auth deep links.
 */
export function buildGuestAuthPath(nextPathname?: string | null): string {
  if (!nextPathname) {
    return AUTH_GUEST_ENTRY_PATH;
  }

  const trimmed = nextPathname.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return AUTH_GUEST_ENTRY_PATH;
  }

  if (
    trimmed === AUTH_GUEST_ENTRY_PATH ||
    trimmed.startsWith(`${AUTH_GUEST_ENTRY_PATH}/`) ||
    trimmed === AUTH_ROUTES.register ||
    trimmed.startsWith(`${AUTH_ROUTES.register}/`) ||
    trimmed === "/splash" ||
    trimmed.startsWith("/splash/") ||
    trimmed === "/welcome" ||
    trimmed.startsWith("/welcome/")
  ) {
    return AUTH_GUEST_ENTRY_PATH;
  }

  return `${AUTH_GUEST_ENTRY_PATH}?next=${encodeURIComponent(trimmed)}`;
}
