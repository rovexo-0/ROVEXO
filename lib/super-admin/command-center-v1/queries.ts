import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/orders/types";

export function startOfTodayIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export function startOfWeekIso(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff).toISOString();
}

export function startOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function startOfYearIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1).toISOString();
}

export function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60_000).toISOString();
}

export function bucketCountsByHour(
  timestamps: string[],
  bucketCount = 12,
): number[] {
  const now = new Date();
  const buckets = Array.from({ length: bucketCount }, () => 0);
  const windowStart = new Date(now.getTime() - bucketCount * 60 * 60_000);

  for (const timestamp of timestamps) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime()) || date < windowStart) continue;
    const hoursFromStart = Math.floor((date.getTime() - windowStart.getTime()) / (60 * 60_000));
    const index = Math.min(bucketCount - 1, Math.max(0, hoursFromStart));
    buckets[index] += 1;
  }

  return buckets;
}

export function bucketSumsByHour(
  rows: Array<{ createdAt: string; value: number }>,
  bucketCount = 12,
): number[] {
  const now = new Date();
  const buckets = Array.from({ length: bucketCount }, () => 0);
  const windowStart = new Date(now.getTime() - bucketCount * 60 * 60_000);

  for (const row of rows) {
    const date = new Date(row.createdAt);
    if (Number.isNaN(date.getTime()) || date < windowStart) continue;
    const hoursFromStart = Math.floor((date.getTime() - windowStart.getTime()) / (60 * 60_000));
    const index = Math.min(bucketCount - 1, Math.max(0, hoursFromStart));
    buckets[index] += row.value;
  }

  return buckets;
}

export async function countTableRows(
  table:
    | "profiles"
    | "products"
    | "orders"
    | "messages"
    | "saved_items"
    | "cart_items"
    | "content_reports"
    | "support_tickets"
    | "moderation_queue"
    | "protection_cases"
    | "wallet_transactions"
    | "live_visitor_sessions"
    | "platform_error_logs"
    | "platform_audit_logs"
    | "platform_analytics_events"
    | "protection_cases"
    | "cron_job_runs"
    | "live_visitor_sessions",
  filters?: (query: ReturnType<ReturnType<typeof createAdminClient>["from"]>) => ReturnType<
    ReturnType<typeof createAdminClient>["from"]
  >,
): Promise<number> {
  try {
    const admin = createAdminClient();
    let query = admin.from(table).select("*", { count: "exact", head: true });
    if (filters) query = filters(query);
    const { count } = await query;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function countOrdersSince(
  since: string,
  statuses?: readonly OrderStatus[],
): Promise<number> {
  return countTableRows("orders", (query) => {
    let next = query.gte("created_at", since);
    if (statuses?.length) next = next.in("status", [...statuses]);
    return next;
  });
}

export async function sumOrderRevenueSince(since: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("orders")
      .select("total, created_at")
      .gte("created_at", since)
      .in("status", ["completed", "awaiting_shipment", "shipped", "delivered"]);
    return (data ?? []).reduce((sum, row) => sum + Number(row.total), 0);
  } catch {
    return 0;
  }
}

export async function sumOrderRevenueRowsSince(since: string): Promise<Array<{ createdAt: string; value: number }>> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("orders")
      .select("total, created_at")
      .gte("created_at", since)
      .in("status", ["completed", "awaiting_shipment", "shipped", "delivered"]);
    return (data ?? []).map((row) => ({
      createdAt: row.created_at,
      value: Number(row.total),
    }));
  } catch {
    return [];
  }
}

export async function countProfilesByRole(
  role: "admin" | "super_admin" | "business" | "seller" | "buyer",
): Promise<number> {
  return countTableRows("profiles", (query) => query.eq("role", role));
}

export async function countProfilesVerified(): Promise<number> {
  return countTableRows("profiles", (query) => query.eq("verified", true));
}

export async function countProfilesByStatus(status: string): Promise<number> {
  return countTableRows("profiles", (query) => query.eq("account_status", status));
}

export async function countProductsByStatus(
  status: "draft" | "published" | "paused" | "sold" | "deleted",
): Promise<number> {
  return countTableRows("products", (query) => query.eq("status", status));
}

export async function countModerationQueuePending(): Promise<number> {
  return countTableRows("moderation_queue", (query) => query.eq("status", "pending"));
}

export async function countContentReportsOpen(): Promise<number> {
  return countTableRows("content_reports", (query) => query.eq("status", "pending"));
}

export async function countSupportTicketsByStatus(
  status: "open" | "in_progress" | "resolved" | "closed",
): Promise<number> {
  return countTableRows("support_tickets", (query) => query.eq("status", status));
}

export async function countSupportTicketsResolvedSince(since: string): Promise<number> {
  return countTableRows("support_tickets", (query) =>
    query.eq("status", "resolved").gte("updated_at", since),
  );
}

export async function countWalletTransactionsSince(
  since: string,
  type: "sale" | "withdrawal" | "fee" | "refund" | "promotion",
): Promise<number> {
  return countTableRows("wallet_transactions", (query) =>
    query.gte("created_at", since).eq("type", type),
  );
}

export async function sumWalletTransactionsSince(
  since: string,
  type: "sale" | "withdrawal" | "fee" | "refund" | "promotion",
): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("wallet_transactions")
      .select("amount")
      .gte("created_at", since)
      .eq("type", type);
    return (data ?? []).reduce((sum, row) => sum + Math.abs(Number(row.amount)), 0);
  } catch {
    return 0;
  }
}

export async function countErrorLogsSince(
  since: string,
  category?: string,
): Promise<number> {
  return countTableRows("platform_error_logs", (query) => {
    let next = query.gte("created_at", since);
    if (category) next = next.eq("category", category);
    return next;
  });
}

export async function countAuditActionsSince(
  since: string,
  actionPrefix?: string,
): Promise<number> {
  return countTableRows("platform_audit_logs", (query) => {
    let next = query.gte("created_at", since);
    if (actionPrefix) next = next.like("action", `${actionPrefix}%`);
    return next;
  });
}

export async function countLiveSessionsSince(since: string): Promise<number> {
  return countTableRows("live_visitor_sessions", (query) => query.gte("last_seen_at", since));
}

export async function sumProductViews(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("products").select("views");
    return (data ?? []).reduce((sum, row) => sum + Number(row.views ?? 0), 0);
  } catch {
    return 0;
  }
}

export async function averageProductListingAgeDays(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("products")
      .select("created_at")
      .eq("status", "published")
      .limit(5000);
    if (!data?.length) return 0;
    const now = Date.now();
    const totalDays = data.reduce((sum, row) => {
      const created = new Date(row.created_at).getTime();
      return sum + (now - created) / (24 * 60 * 60_000);
    }, 0);
    return Math.round((totalDays / data.length) * 10) / 10;
  } catch {
    return 0;
  }
}

export async function countOrdersByCarrierSince(since: string, carrier: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since)
      .ilike("delivery_carrier", `%${carrier}%`);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function sumOrderShippingRevenueSince(since: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("orders").select("delivery_fee, created_at").gte("created_at", since);
    return (data ?? []).reduce((sum, row) => sum + Number(row.delivery_fee ?? 0), 0);
  } catch {
    return 0;
  }
}

export async function fetchTimestampsSince(
  table:
    | "orders"
    | "profiles"
    | "messages"
    | "products"
    | "platform_error_logs"
    | "wallet_transactions"
    | "platform_audit_logs"
    | "live_visitor_sessions",
  since: string,
  column = "created_at",
): Promise<string[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from(table).select(column).gte(column, since).limit(5000);
    return (data ?? [])
      .map((row) => {
        const record = row as unknown as Record<string, string>;
        return record[column] ?? "";
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function fetchErrorLogTimestampsSince(since: string, category?: string): Promise<string[]> {
  try {
    const admin = createAdminClient();
    let query = admin.from("platform_error_logs").select("created_at").gte("created_at", since).limit(5000);
    if (category) query = query.eq("category", category);
    const { data } = await query;
    return (data ?? []).map((row) => row.created_at);
  } catch {
    return [];
  }
}

export async function fetchPlatformAnalyticsMetricSum(
  domain: string,
  metric: string,
  since: string,
): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("platform_analytics_events")
      .select("value")
      .eq("domain", domain)
      .eq("metric", metric)
      .gte("recorded_at", since);
    return (data ?? []).reduce((sum, row) => sum + Number(row.value ?? 0), 0);
  } catch {
    return 0;
  }
}

export function envConfigured(label: string, value: string | undefined): string {
  return value?.trim() ? label : "Not configured";
}

export function carrierActivityLabel(count: number, gatewayConfigured: boolean): string {
  if (!gatewayConfigured) return "Not configured";
  if (count > 0) return "Active";
  return "Idle";
}

export function carrierHealthStatus(
  orderCount: number,
  gatewayConfigured: boolean,
  gatewayHealthy: boolean,
): string {
  if (!gatewayConfigured) return "Offline";
  if (!gatewayHealthy) return "Offline";
  if (orderCount > 0) return "Online";
  return "Degraded";
}

export async function countDistinctOrderBuyers(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("orders").select("buyer_id").limit(10000);
    const ids = new Set((data ?? []).map((row) => row.buyer_id).filter(Boolean));
    return ids.size;
  } catch {
    return 0;
  }
}

export async function fetchOrderTimestampsSince(
  since: string,
  statuses?: readonly OrderStatus[],
): Promise<string[]> {
  try {
    const admin = createAdminClient();
    let query = admin.from("orders").select("created_at").gte("created_at", since).limit(5000);
    if (statuses?.length) query = query.in("status", [...statuses]);
    const { data } = await query;
    return (data ?? []).map((row) => row.created_at);
  } catch {
    return [];
  }
}

export async function fetchAnalyticsMetricPointsSince(
  domain: string,
  metric: string,
  since: string,
): Promise<Array<{ recordedAt: string; value: number }>> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("platform_analytics_events")
      .select("recorded_at, value")
      .eq("domain", domain)
      .eq("metric", metric)
      .gte("recorded_at", since)
      .limit(5000);
    return (data ?? []).map((row) => ({
      recordedAt: row.recorded_at,
      value: Number(row.value ?? 0),
    }));
  } catch {
    return [];
  }
}

export function bucketAnalyticsValuesByHour(
  rows: Array<{ recordedAt: string; value: number }>,
  bucketCount = 12,
): number[] {
  return bucketSumsByHour(
    rows.map((row) => ({ createdAt: row.recordedAt, value: row.value })),
    bucketCount,
  );
}
