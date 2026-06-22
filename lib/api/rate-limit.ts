import { NextResponse } from "next/server";

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

async function upstashRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult | null> {
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
      body: JSON.stringify([
        ["INCR", key],
        ["TTL", key],
      ]),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{ result: number | null }>;
    const count = Number(results[0]?.result ?? 1);
    const ttl = Number(results[1]?.result ?? -1);

    if (ttl === -1) {
      await fetch(`${url}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["EXPIRE", key, windowSec]),
      });
    }

    if (count > limit) {
      return {
        allowed: false,
        retryAfterSeconds: ttl > 0 ? ttl : windowSec,
      };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  } catch {
    return null;
  }
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
  const windowSec = Math.ceil(windowMs / 1000);
  const upstash = await upstashRateLimit(key, limit, windowSec);
  if (upstash) {
    return upstash;
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[rate-limit] Upstash is not configured in production.");
    return { allowed: false, retryAfterSeconds: windowSec };
  }

  return memoryRateLimit(key, limit, windowMs);
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
