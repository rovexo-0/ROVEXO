/**
 * Auth API clients (e.g. @supabase/auth-js `_getErrorMessage`) may set
 * `error.message` to `JSON.stringify({})` → `"{}"` when GoTrue returns a
 * body without msg/message fields. Those must never reach the UI.
 */
export function isUselessAuthErrorMessage(
  message: string | null | undefined,
): boolean {
  if (message == null) return true;
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (trimmed === "{}") return true;
  if (trimmed === "[object Object]") return true;
  return false;
}

export function mapAuthErrorMessage(
  message: string | null | undefined,
): string {
  if (message == null || isUselessAuthErrorMessage(message)) {
    return "";
  }

  const usable: string = message.trim();
  const normalized = usable.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please verify your email before signing in.";
  }
  if (normalized.includes("user already registered")) {
    return "An account with this email already exists.";
  }
  if (
    normalized.includes("identity is already linked") ||
    normalized.includes("identity_already_exists") ||
    normalized.includes("already been registered")
  ) {
    return "An account with this email already exists. Sign in with email and password.";
  }
  if (normalized.includes("provider is not enabled") || normalized.includes("unsupported provider")) {
    return "This sign-in method is temporarily unavailable.";
  }
  if (normalized.includes("oauth") && normalized.includes("cancel")) {
    return "Sign-in was cancelled.";
  }
  if (normalized.includes("password should be at least")) {
    return "Password must be at least 8 characters.";
  }
  if (normalized.includes("signup is disabled")) {
    return "Registration is temporarily unavailable. Please try again later.";
  }
  if (normalized.includes("rate limit") || normalized.includes("over_request_rate")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (normalized.includes("network") || normalized.includes("fetch failed")) {
    return "Network error. Check your connection and try again.";
  }

  return usable;
}
