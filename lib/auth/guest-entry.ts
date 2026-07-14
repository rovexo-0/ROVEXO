/**
 * Canonical guest entry for ROVEXO Auth v1.0.
 * Unauthenticated users land on Welcome — never duplicate guest gates.
 */

import { AUTH_ROUTES } from "@/lib/auth/canonical";

/** Locked guest destination (AUTH_MASTER_SPEC.routes.welcome). */
export const AUTH_GUEST_ENTRY_PATH = AUTH_ROUTES.welcome;

/**
 * Build a path for unauthenticated redirects.
 * Optional `next` is preserved for post-auth deep links (Login may read via URL on later hops).
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
    trimmed === AUTH_ROUTES.login ||
    trimmed.startsWith(`${AUTH_ROUTES.login}/`) ||
    trimmed === AUTH_ROUTES.register ||
    trimmed.startsWith(`${AUTH_ROUTES.register}/`) ||
    trimmed === AUTH_ROUTES.splash ||
    trimmed.startsWith(`${AUTH_ROUTES.splash}/`)
  ) {
    return AUTH_GUEST_ENTRY_PATH;
  }

  return `${AUTH_GUEST_ENTRY_PATH}?next=${encodeURIComponent(trimmed)}`;
}
