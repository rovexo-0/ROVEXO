import { CRON_STALE_AFTER_MS } from "@/lib/cron/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStripeConfigured, getStripeClient } from "@/lib/stripe/server";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export type HealthCheckResult = {
  status: HealthStatus;
  latencyMs: number;
  message?: string;
};

export type PlatformHealthReport = {
  status: HealthStatus;
  timestamp: string;
  version: string;
  checks: {
    api: HealthCheckResult;
    database: HealthCheckResult;
    storage: HealthCheckResult;
    stripe: HealthCheckResult;
    redis: HealthCheckResult;
    cron: HealthCheckResult;
    email: HealthCheckResult;
    push: HealthCheckResult;
  };
};

function overallStatus(checks: HealthCheckResult[]): HealthStatus {
  if (checks.some((check) => check.status === "unhealthy")) return "unhealthy";
  if (checks.some((check) => check.status === "degraded")) return "degraded";
  return "healthy";
}

async function timedCheck(run: () => Promise<HealthCheckResult>): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const result = await run();
    return { ...result, latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : "Check failed",
    };
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return { status: "unhealthy", latencyMs: 0, message: "Supabase URL not configured" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").select("id", { head: true, count: "exact" }).limit(1);
  if (error) {
    return { status: "unhealthy", latencyMs: 0, message: error.message };
  }
  return { status: "healthy", latencyMs: 0 };
}

async function checkStorage(): Promise<HealthCheckResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return { status: "degraded", latencyMs: 0, message: "Storage not configured" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.listBuckets();
  if (error) {
    return { status: "degraded", latencyMs: 0, message: error.message };
  }
  if (!data?.length) {
    return { status: "degraded", latencyMs: 0, message: "No storage buckets found" };
  }
  return { status: "healthy", latencyMs: 0 };
}

async function checkStripe(): Promise<HealthCheckResult> {
  if (!isStripeConfigured()) {
    return { status: "degraded", latencyMs: 0, message: "Stripe not configured" };
  }

  const stripe = getStripeClient();
  await stripe.balance.retrieve();
  return { status: "healthy", latencyMs: 0 };
}

async function checkRedis(): Promise<HealthCheckResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return { status: "degraded", latencyMs: 0, message: "Redis not configured (memory fallback active)" };
  }

  const response = await fetch(`${url}/ping`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return { status: "unhealthy", latencyMs: 0, message: `Redis ping failed (${response.status})` };
  }

  return { status: "healthy", latencyMs: 0 };
}

async function checkCron(): Promise<HealthCheckResult> {
  if (!process.env.CRON_SECRET?.trim()) {
    return { status: "degraded", latencyMs: 0, message: "CRON_SECRET not configured" };
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("cron_job_runs")
      .select("status, started_at")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return { status: "degraded", latencyMs: 0, message: "No cron runs recorded yet" };
    }

    if (data.status === "failed") {
      return { status: "degraded", latencyMs: 0, message: "Last cron run failed" };
    }

    const ageMs = Date.now() - new Date(data.started_at).getTime();
    if (ageMs > CRON_STALE_AFTER_MS) {
      return {
        status: "degraded",
        latencyMs: 0,
        message: `Last cron run over ${Math.round(CRON_STALE_AFTER_MS / 60_000)} minutes ago`,
      };
    }

    return { status: "healthy", latencyMs: 0 };
  } catch {
    return { status: "degraded", latencyMs: 0, message: "Cron history unavailable" };
  }
}

function checkEmail(): HealthCheckResult {
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  const hasFrom = Boolean(process.env.EMAIL_FROM?.trim());

  if (!hasResend || !hasFrom) {
    return {
      status: "degraded",
      latencyMs: 0,
      message: "Email provider not fully configured",
    };
  }

  return { status: "healthy", latencyMs: 0 };
}

function checkPush(): HealthCheckResult {
  const hasPublic = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());
  const hasPrivate = Boolean(process.env.VAPID_PRIVATE_KEY?.trim());
  const hasSubject = Boolean(process.env.VAPID_SUBJECT?.trim());

  if (hasPublic && hasPrivate && hasSubject) {
    return { status: "healthy", latencyMs: 0, message: "Web push VAPID configured" };
  }

  if (hasPublic || hasPrivate || hasSubject) {
    return { status: "degraded", latencyMs: 0, message: "Web push partially configured" };
  }

  return { status: "degraded", latencyMs: 0, message: "Web push optional — VAPID keys not configured" };
}

export async function getPlatformHealthReport(): Promise<PlatformHealthReport> {
  const [database, storage, stripe, redis, cron] = await Promise.all([
    timedCheck(checkDatabase),
    timedCheck(checkStorage),
    timedCheck(checkStripe),
    timedCheck(checkRedis),
    timedCheck(checkCron),
  ]);

  const api: HealthCheckResult = { status: "healthy", latencyMs: 0 };
  const email = checkEmail();
  const push = checkPush();
  const checks = { api, database, storage, stripe, redis, cron, email, push };

  return {
    status: overallStatus(Object.values(checks)),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    checks,
  };
}
