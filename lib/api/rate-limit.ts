import { NextResponse } from "next/server";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

const UNLIMITED_RESULT: RateLimitResult = {
  allowed: true,
  retryAfterSeconds: 0,
};

function isAuthRateLimitKey(key: string): boolean {
  return key.startsWith("auth-");
}

function shouldBypassAuthRateLimit(key: string): boolean {
  return process.env.NODE_ENV !== "production" && isAuthRateLimitKey(key);
}

async function upstashPipeline(
  commands: Array<[string, ...Array<string | number>]>,
): Promise<Array<{ result: number | string | null }> | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Array<{ result: number | string | null }>;
  } catch {
    return null;
  }
}

function parseRedisInteger(value: unknown, fallback: number): number {
  if (value === null || value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Ensure a rate-limit key expires; repairs keys that were incremented without TTL. */
async function ensureUpstashExpiry(key: string, windowSec: number): Promise<number> {
  const expireResults = await upstashPipeline([["EXPIRE", key, windowSec]]);
  if (!expireResults) {
    return windowSec;
  }

  const ttlResults = await upstashPipeline([["TTL", key]]);
  const ttl = parseRedisInteger(ttlResults?.[0]?.result, -1);
  return ttl > 0 ? ttl : windowSec;
}

async function upstashDeleteKey(key: string): Promise<boolean> {
  const results = await upstashPipeline([["DEL", key]]);
  return results !== null;
}

async function upstashRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult | null> {
  const results = await upstashPipeline([
    ["INCR", key],
    ["TTL", key],
  ]);

  if (!results) {
    return null;
  }

  const count = parseRedisInteger(results[0]?.result, 1);
  let ttl = parseRedisInteger(results[1]?.result, -1);

  if (ttl === -1) {
    ttl = await ensureUpstashExpiry(key, windowSec);
  }

  if (count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: ttl > 0 ? ttl : windowSec,
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

async function upstashGetRateLimitStatus(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult | null> {
  const results = await upstashPipeline([
    ["GET", key],
    ["TTL", key],
  ]);

  if (!results) {
    return null;
  }

  const count = parseRedisInteger(results[0]?.result, 0);
  let ttl = parseRedisInteger(results[1]?.result, -1);

  if (count > 0 && ttl === -1) {
    ttl = await ensureUpstashExpiry(key, windowSec);
  }

  if (count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: ttl > 0 ? ttl : windowSec,
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

async function upstashResetRateLimit(key: string): Promise<boolean> {
  if (await upstashDeleteKey(key)) {
    return true;
  }

  // If DEL failed transiently, force a near-immediate expiry so successful auth clears lockouts.
  const expireResults = await upstashPipeline([["EXPIRE", key, 1]]);
  return expireResults !== null;
}

function memoryGetRateLimitStatus(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function memoryResetRateLimit(key: string): void {
  memoryBuckets.delete(key);
}

function failClosedInProduction(windowMs: number): RateLimitResult {
  const windowSec = Math.ceil(windowMs / 1000);
  console.error("[rate-limit] Upstash is not configured in production.");
  return { allowed: false, retryAfterSeconds: windowSec };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (shouldBypassAuthRateLimit(key)) {
    return UNLIMITED_RESULT;
  }

  const windowSec = Math.ceil(windowMs / 1000);
  const upstash = await upstashRateLimit(key, limit, windowSec);
  if (upstash) {
    return upstash;
  }

  if (process.env.NODE_ENV === "production") {
    return failClosedInProduction(windowMs);
  }

  return memoryRateLimit(key, limit, windowMs);
}

/** Read current rate-limit status without incrementing the counter. */
export async function getRateLimitStatus(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (shouldBypassAuthRateLimit(key)) {
    return UNLIMITED_RESULT;
  }

  const windowSec = Math.ceil(windowMs / 1000);
  const upstash = await upstashGetRateLimitStatus(key, limit, windowSec);
  if (upstash) {
    return upstash;
  }

  if (process.env.NODE_ENV === "production") {
    return failClosedInProduction(windowMs);
  }

  return memoryGetRateLimitStatus(key, limit);
}

/** Increment the counter after a failed or abusive attempt. */
export async function recordRateLimitFailure(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  return checkRateLimit(key, limit, windowMs);
}

/** Clear a rate-limit bucket after successful authentication. */
export async function resetRateLimit(key: string): Promise<void> {
  if (shouldBypassAuthRateLimit(key)) {
    return;
  }

  const deleted = await upstashResetRateLimit(key);
  if (deleted) {
    return;
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[rate-limit] Upstash is not configured in production.");
    return;
  }

  memoryResetRateLimit(key);
}

export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: retryAfterSeconds > 0 ? { "Retry-After": String(retryAfterSeconds) } : undefined,
    },
  );
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const result = await checkRateLimit(`${scope}:${ip}`, limit, windowMs);
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSeconds);
  }
  return null;
}

export async function enforceRateLimitForUser(
  userId: string,
  scope: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(`${scope}:user:${userId}`, limit, windowMs);
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSeconds);
  }
  return null;
}
