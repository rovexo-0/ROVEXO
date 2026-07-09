import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/supabase/types/database";

const AUTH_ROUTE_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

const SUPER_ADMIN_ROUTE_PREFIXES = ["/admin", "/super-admin", "/dashboard", "/staff"];

function matchesRoutePrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isSuperAdminOnlyRoute(path: string): boolean {
  return matchesRoutePrefix(path, SUPER_ADMIN_ROUTE_PREFIXES);
}

export function sanitizeNextPath(
  next: string | null | undefined,
  fallback = "/account",
): string {
  if (!next) {
    return fallback;
  }

  const trimmed = next.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (AUTH_ROUTE_PREFIXES.some((path) => trimmed === path || trimmed.startsWith(`${path}/`))) {
    return fallback;
  }

  return trimmed;
}

export function redirectPathForRole(role: UserRole): string {
  if (role === "super_admin") return "/super-admin";
  return "/account";
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

/** Default destination after auth when already signed in (middleware + post-login). */
export const AUTHENTICATED_HOME = "/account";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: "Sign-in link expired or invalid. Please try again.",
  reset_session_required: "Open the password reset link from your email to continue.",
  profile_missing: "Your account session is incomplete. Please sign in again.",
};
