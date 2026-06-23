import {
  getRateLimitStatus,
  recordRateLimitFailure,
  resetRateLimit,
  type RateLimitResult,
} from "@/lib/api/rate-limit";

export type AuthRateLimitScope = "login" | "register" | "reset" | "verify-resend";

const AUTH_RATE_LIMIT_ALLOWED: RateLimitResult = {
  allowed: true,
  retryAfterSeconds: 0,
};

/** Auth rate limits are enforced in production only. */
export function isAuthRateLimitDisabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

const AUTH_RATE_LIMITS: Record<
  AuthRateLimitScope,
  { production: { limit: number; windowMs: number }; development: { limit: number; windowMs: number } }
> = {
  login: {
    production: { limit: 10, windowMs: 15 * 60_000 },
    development: { limit: 50, windowMs: 5 * 60_000 },
  },
  register: {
    production: { limit: 5, windowMs: 15 * 60_000 },
    development: { limit: 30, windowMs: 5 * 60_000 },
  },
  reset: {
    production: { limit: 5, windowMs: 15 * 60_000 },
    development: { limit: 30, windowMs: 5 * 60_000 },
  },
  "verify-resend": {
    production: { limit: 5, windowMs: 15 * 60_000 },
    development: { limit: 30, windowMs: 5 * 60_000 },
  },
};

export function authRateLimitKey(scope: AuthRateLimitScope, ip: string): string {
  return `auth-${scope}:${ip}`;
}

export function getAuthRateLimitConfig(scope: AuthRateLimitScope): {
  limit: number;
  windowMs: number;
} {
  const env = process.env.NODE_ENV === "production" ? "production" : "development";
  return AUTH_RATE_LIMITS[scope][env];
}

/** Check whether an auth action is currently blocked (does not increment). */
export async function checkAuthRateLimit(
  scope: AuthRateLimitScope,
  ip: string,
): Promise<RateLimitResult> {
  if (isAuthRateLimitDisabled()) {
    return AUTH_RATE_LIMIT_ALLOWED;
  }

  const { limit, windowMs } = getAuthRateLimitConfig(scope);
  return getRateLimitStatus(authRateLimitKey(scope, ip), limit, windowMs);
}

/** Record a failed auth attempt (increments the counter). */
export async function recordAuthRateLimitFailure(
  scope: AuthRateLimitScope,
  ip: string,
): Promise<RateLimitResult> {
  if (isAuthRateLimitDisabled()) {
    return AUTH_RATE_LIMIT_ALLOWED;
  }

  const { limit, windowMs } = getAuthRateLimitConfig(scope);
  return recordRateLimitFailure(authRateLimitKey(scope, ip), limit, windowMs);
}

/** Clear the counter after successful authentication. */
export async function clearAuthRateLimit(scope: AuthRateLimitScope, ip: string): Promise<void> {
  if (isAuthRateLimitDisabled()) {
    return;
  }

  await resetRateLimit(authRateLimitKey(scope, ip));
}

/**
 * Rate-limit sensitive auth requests where every attempt counts (e.g. password reset).
 * Peeks first, then increments when allowed.
 */
export async function enforceAuthRequestRateLimit(
  scope: AuthRateLimitScope,
  ip: string,
): Promise<RateLimitResult> {
  if (isAuthRateLimitDisabled()) {
    return AUTH_RATE_LIMIT_ALLOWED;
  }

  const status = await checkAuthRateLimit(scope, ip);
  if (!status.allowed) {
    return status;
  }
  return recordAuthRateLimitFailure(scope, ip);
}
