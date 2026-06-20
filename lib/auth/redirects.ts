import type { UserRole } from "@/lib/supabase/types/database";

const AUTH_ROUTE_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

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
  if (role === "business") return "/business/dashboard";
  if (role === "seller" || role === "admin") return "/seller/dashboard";
  return "/account";
}

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: "Sign-in link expired or invalid. Please try again.",
  reset_session_required: "Open the password reset link from your email to continue.",
};
