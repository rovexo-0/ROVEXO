import { createResolutionAdminClient } from "@/lib/resolution-engine/db-client";
import type {
  OrderResolutionSummary,
  ResolutionCaseRow,
  ResolutionEventRow,
  ResolutionMonitorStats,
} from "@/lib/resolution-engine/types";

export async function getOrderResolutionSummary(orderId: string): Promise<OrderResolutionSummary> {
  const admin = createResolutionAdminClient();

  const [{ data: cases }, { data: events }, { data: claims }, { data: returns }] = await Promise.all([
    admin
      .from("resolution_cases")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1),
    admin
      .from("resolution_events")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("carrier_claims").select("status").eq("order_id", orderId).order("created_at", { ascending: false }).limit(1),
    admin.from("carrier_returns").select("status").eq("order_id", orderId).order("created_at", { ascending: false }).limit(1),
  ]);

  const activeCase = ((cases as ResolutionCaseRow[] | null) ?? [])[0] ?? null;
  const eventRows = ((events as ResolutionEventRow[] | null) ?? []).reverse();

  return {
    orderId,
    activeCase,
    status: activeCase?.status ?? "none",
    refundAmount: activeCase?.refund_amount ?? null,
    estimatedCompletionAt: activeCase?.estimated_completion_at ?? null,
    claimStatus: (claims as Array<{ status: string }> | null)?.[0]?.status ?? null,
    returnStatus: (returns as Array<{ status: string }> | null)?.[0]?.status ?? null,
    events: eventRows,
  };
}

export async function getResolutionMonitorStats(): Promise<ResolutionMonitorStats> {
  const admin = createResolutionAdminClient();
  const since24h = new Date(Date.now() - 24 * 3600_000).toISOString();

  const [
    { data: openCases },
    { data: processingCases },
    { data: refundedCases },
    { data: closedCases },
    { data: claimsOpen },
    { data: automation24h },
  ] = await Promise.all([
    admin.from("resolution_cases").select("id").eq("status", "OPEN"),
    admin.from("resolution_cases").select("id").in("status", ["PROCESSING", "WAITING_CARRIER", "WAITING_TRACKING", "WAITING_RETURN"]),
    admin.from("resolution_cases").select("id").eq("status", "REFUNDED"),
    admin.from("resolution_cases").select("id").eq("status", "CLOSED"),
    admin.from("carrier_claims").select("id").in("status", ["submitted", "waiting"]),
    admin.from("automation_logs").select("id").gte("created_at", since24h),
  ]);

  return {
    openCases: (openCases as unknown[] | null)?.length ?? 0,
    processingCases: (processingCases as unknown[] | null)?.length ?? 0,
    refundedCases: (refundedCases as unknown[] | null)?.length ?? 0,
    closedCases: (closedCases as unknown[] | null)?.length ?? 0,
    carrierClaimsOpen: (claimsOpen as unknown[] | null)?.length ?? 0,
    automationActions24h: (automation24h as unknown[] | null)?.length ?? 0,
  };
}
