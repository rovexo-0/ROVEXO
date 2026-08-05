import "server-only";

import {
  AuthApiError,
  isAuthApiError,
  isAuthError,
  isAuthSessionMissingError,
} from "@supabase/supabase-js";

/**
 * Invalid / expired refresh tokens must never crash RSC or middleware.
 * Treat as anonymous after local session clear.
 */
const INVALID_REFRESH_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_not_found",
  "session_expired",
]);

export function isInvalidOrExpiredRefreshError(error: unknown): boolean {
  if (!error) return false;

  if (isAuthSessionMissingError(error)) return true;

  if (isAuthApiError(error) || isAuthError(error) || error instanceof AuthApiError) {
    const code = typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";
    if (code && INVALID_REFRESH_CODES.has(code)) return true;

    const message = error instanceof Error ? error.message : String(error);
    if (/refresh[_ ]token[_ ]not[_ ]found|invalid refresh token|refresh token not found/i.test(message)) {
      return true;
    }
  }

  return false;
}
