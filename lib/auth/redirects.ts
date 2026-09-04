import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/supabase/types/database";
import { getAppUrl } from "@/lib/supabase/env";

const AUTH_ROUTE_PREFIXES = [
  "/splash",
  "/welcome",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

/**
 * Exact path only — password recovery callback destination.
 * Must remain allowlisted so authCallbackUrl("/reset-password") is not collapsed to "/".
 */
export const PASSWORD_RECOVERY_NEXT_PATH = "/reset-password";

const SUPER_ADMIN_ROUTE_PREFIXES = ["/admin", "/super-admin", "/dashboard", "/staff"];

function matchesRoutePrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isSuperAdminOnlyRoute(path: string): boolean {
  return matchesRoutePrefix(path, SUPER_ADMIN_ROUTE_PREFIXES);
}

export function sanitizeNextPath(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (!next) {
    return fallback;
  }

  const trimmed = next.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // Explicit recovery allowlist (exact match only — not generally permissive).
  if (trimmed === PASSWORD_RECOVERY_NEXT_PATH) {
    return PASSWORD_RECOVERY_NEXT_PATH;
  }

  if (AUTH_ROUTE_PREFIXES.some((path) => trimmed === path || trimmed.startsWith(`${path}/`))) {
    return fallback;
  }

  return trimmed;
}

/** Canonical auth callback URL with sanitized `next` (recovery uses `/reset-password`). */
export function authCallbackUrl(next: string, appUrl?: string): string {
  const base = (appUrl ?? getAppUrl()).replace(/\/$/, "");
  return `${base}/auth/callback?next=${encodeURIComponent(sanitizeNextPath(next))}`;
}

export function redirectPathForRole(role: UserRole): string {
  if (role === "super_admin") return "/super-admin";
  return "/";
}

/** Post-login redirect that never sends non–super-admins to super-admin-only URLs (403). */
export function redirectAfterSignIn(role: UserRole, next?: string | null): never {
  const defaultPath = redirectPathForRole(role);

  if (!next?.trim()) {
    redirect(defaultPath);
  }

  const destination = sanitizeNextPath(next, defaultPath);
  if (isSuperAdminOnlyRoute(destination) && role !== "super_admin") {
    redirect(defaultPath);
  }

  redirect(destination);
}

/** Default destination after auth when already signed in — Homepage. */
export const AUTHENTICATED_HOME = "/";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: "Sign-in link expired or invalid. Please try again.",
  oauth_provider_unavailable: "This sign-in method is temporarily unavailable.",
  oauth_cancelled: "Sign-in was cancelled.",
  oauth_account_exists: "An account with this email already exists. Sign in with email and password.",
  oauth_network: "Network error. Check your connection and try again.",
  reset_session_required: "Open the password reset link from your email to continue.",
  profile_missing: "Your account session is incomplete. Please sign in again.",
  localhost_production_auth_profile_missing:
    "Your Production account is not mirrored on this localhost database. Local profile not found for this user.",
  localhost_production_auth_user_missing:
    "Your Production account UUID is not present in local Auth. A localhost session cannot be created.",
  localhost_production_auth_mfa:
    "This account requires two-factor authentication. Localhost cannot complete Production MFA while marketplace data stays local. Sign-in was blocked.",
};
