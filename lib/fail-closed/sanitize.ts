/**
 * ROVEXO GLOBAL FAIL CLOSED — sanitize any unknown error into Owner-safe copy.
 */

import {
  FAIL_CLOSED_COPY,
  FAIL_CLOSED_FORBIDDEN_PATTERNS,
  type FailClosedVariant,
} from "@/lib/fail-closed/constants";

export type UserSafeFailClosedMessage = {
  title: string;
  body: string;
  hint: string;
  retryLabel: string;
  variant: FailClosedVariant;
  /** Always false for user payloads — never attach digests or raw messages. */
  safe: true;
};

function containsForbidden(text: string): boolean {
  return FAIL_CLOSED_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Convert any thrown value into Owner-approved copy.
 * Never returns raw Error.message, stack, ENV names, or secret material.
 */
export function toUserSafeFailClosedMessage(
  _error?: unknown,
  variant: FailClosedVariant = "unavailable",
): UserSafeFailClosedMessage {
  void _error;

  if (variant === "updating") {
    return {
      title: FAIL_CLOSED_COPY.updatingTitle,
      body: FAIL_CLOSED_COPY.updatingBody,
      hint: "",
      retryLabel: FAIL_CLOSED_COPY.retryLabel,
      variant,
      safe: true,
    };
  }

  return {
    title: FAIL_CLOSED_COPY.title,
    body: FAIL_CLOSED_COPY.body,
    hint: FAIL_CLOSED_COPY.hint,
    retryLabel: FAIL_CLOSED_COPY.retryLabel,
    variant: "unavailable",
    safe: true,
  };
}

/**
 * Returns true when a string is unsafe to show to end users.
 * Used by tests and defensive UI gates.
 */
export function isUnsafeUserFacingErrorText(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  return containsForbidden(text);
}

/**
 * If `candidate` is already safe Owner copy, keep it; otherwise replace with fail-closed copy.
 * Prefer `toUserSafeFailClosedMessage` for new code.
 */
export function coerceUserSafeText(candidate: string | null | undefined): string {
  const trimmed = candidate?.trim() ?? "";
  if (!trimmed || isUnsafeUserFacingErrorText(trimmed)) {
    return `${FAIL_CLOSED_COPY.body} ${FAIL_CLOSED_COPY.hint}`.trim();
  }
  // Allow short Owner-style messages that do not leak internals.
  if (trimmed.length > 180) {
    return `${FAIL_CLOSED_COPY.body} ${FAIL_CLOSED_COPY.hint}`.trim();
  }
  return trimmed;
}
