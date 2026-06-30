import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";
import { getAdminStats } from "@/lib/admin/queries";
import { getMonetizationOverview } from "@/lib/monetization/service";
import { getPlatformHealthReport } from "@/lib/ops/health";
import { getTrustAnalyticsSummary } from "@/lib/trust/service";

export type ProductionOperationsSnapshot = {
  health: Awaited<ReturnType<typeof getPlatformHealthReport>>;
  platform: {
    totalUsers: number;
    activeUsers7d: number;
    totalOrders: number;
    awaitingPayment: number;
    awaitingShipment: number;
    completedOrders: number;
    activeSubscriptions: number;
    pendingWithdrawals: number;
    pendingModeration: number;
    pendingVerifications: number;
    openProtectionCases: number;
    failedEmails: number;
    pendingEmails: number;
  };
  cron: {
    lastRunAt: string | null;
    lastStatus: string | null;
    recentRuns: Array<{ id: string; jobName: string; status: string; startedAt: string; errorMessage: string | null }>;
  };
  errors: Array<{
    id: string;
    level: string;
    category: string;
    message: string;
    createdAt: string;
  }>;
  environment: {
    supabase: boolean;
    stripe: boolean;
    resend: boolean;
    redis: boolean;
    cron: boolean;
    appUrl: boolean;
  };
};

export async function getProductionOperationsSnapshot(): Promise<ProductionOperationsSnapshot> {
  const admin = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();

  const [
    health,
    orders,
    monetization,
    trustSummary,
    cronRuns,
    errorLogs,
    totalUsers,
    activeUsers7d,
    moderationCount,
    protectionCount,
    failedEmails,
    pendingEmails,
    withdrawalCount,
  ] = await Promise.all([
    getPlatformHealthReport(),
    getAdminStats(),
    getMonetizationOverview(),
    getTrustAnalyticsSummary(),
    admin.from("cron_job_runs").select("*").order("started_at", { ascending: false }).limit(5),
    admin.from("platform_error_logs").select("id, level, category, message, created_at").order("created_at", { ascending: false }).limit(20),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("updated_at", weekAgo),
    admin.from("moderation_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("protection_cases").select("*", { count: "exact", head: true }).in("status", ["open", "awaiting_seller", "awaiting_buyer", "under_review", "appealed"]),
    admin.from("email_outbox").select("*", { count: "exact", head: true }).eq("status", "failed"),
    admin.from("email_outbox").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin
      .from("wallet_transactions")
      .select("*", { count: "exact", head: true })
      .eq("type", "withdrawal")
      .eq("status", "pending"),
  ]);

  const lastRun = cronRuns.data?.[0] ?? null;

  return {
    health,
    platform: {
      totalUsers: totalUsers.count ?? 0,
      activeUsers7d: activeUsers7d.count ?? 0,
      totalOrders: orders.totalOrders,
      awaitingPayment: orders.awaitingPayment,
      awaitingShipment: orders.awaitingShipment,
      completedOrders: orders.completed,
      activeSubscriptions: monetization.activeSubscriptions,
      pendingWithdrawals: withdrawalCount.count ?? 0,
      pendingModeration: moderationCount.count ?? 0,
      pendingVerifications: trustSummary.pendingVerifications,
      openProtectionCases: protectionCount.count ?? 0,
      failedEmails: failedEmails.count ?? 0,
      pendingEmails: pendingEmails.count ?? 0,
    },
    cron: {
      lastRunAt: lastRun?.started_at ?? null,
      lastStatus: lastRun?.status ?? null,
      recentRuns: (cronRuns.data ?? []).map((row) => ({
        id: row.id,
        jobName: row.job_name,
        status: row.status,
        startedAt: row.started_at,
        errorMessage: row.error_message,
      })),
    },
    errors: (errorLogs.data ?? []).map((row) => ({
      id: row.id,
      level: row.level,
      category: row.category,
      message: row.message,
      createdAt: row.created_at,
    })),
    environment: {
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim()),
      resend: Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim()),
      redis: Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()),
      cron: Boolean(process.env.CRON_SECRET?.trim()),
      appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
    },
  };
}

export async function recordCronJobRun(input: {
  jobName: string;
  status: "success" | "failed";
  result?: Record<string, unknown>;
  errorMessage?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("cron_job_runs").insert({
      job_name: input.jobName,
      status: input.status,
      result: (input.result ?? {}) as Json,
      error_message: input.errorMessage ?? null,
      finished_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking
  }
}
