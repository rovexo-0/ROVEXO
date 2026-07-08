import { createAdminClient } from "@/lib/supabase/admin";
import { createResolutionAdminClient } from "@/lib/resolution-engine/db-client";
import { recordResolutionEvent } from "@/lib/resolution-engine/audit";
import type {
  ResolutionCaseRow,
  ResolutionCaseStatus,
  ResolutionCaseType,
  ResolutionTriggerEvent,
} from "@/lib/resolution-engine/types";

const RULE_BY_TYPE: Record<ResolutionCaseType, string> = {
  lost: "lost_auto_refund",
  damaged: "damaged_auto_refund",
  failed_delivery: "failed_delivery_auto_refund",
  carrier_exception: "failed_delivery_auto_refund",
  return: "return_auto_refund",
  delivery: "delivery_auto_close",
  buyer_confirm: "buyer_confirm_auto_close",
  buyer_timeout: "delivery_auto_close",
  dispute: "return_auto_refund",
};

export async function getResolutionCase(caseId: string): Promise<ResolutionCaseRow | null> {
  const admin = createResolutionAdminClient();
  const { data } = await admin.from("resolution_cases").select("*").eq("id", caseId).maybeSingle();
  return (data as ResolutionCaseRow | null) ?? null;
}

export async function getActiveResolutionCaseForOrder(orderId: string): Promise<ResolutionCaseRow | null> {
  const admin = createResolutionAdminClient();
  const { data } = await admin
    .from("resolution_cases")
    .select("*")
    .eq("order_id", orderId)
    .in("status", ["OPEN", "PROCESSING", "WAITING_CARRIER", "WAITING_TRACKING", "WAITING_RETURN", "APPROVED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ResolutionCaseRow | null) ?? null;
}

export async function openResolutionCase(input: {
  orderId: string;
  caseType: ResolutionCaseType;
  triggerEvent: ResolutionTriggerEvent;
  protectionCaseId?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
  estimatedCompletionAt?: string | null;
}): Promise<ResolutionCaseRow | null> {
  const existing = await getActiveResolutionCaseForOrder(input.orderId);
  if (existing && existing.case_type === input.caseType) {
    return existing;
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, buyer_id, seller_id, total, item_price")
    .eq("id", input.orderId)
    .maybeSingle();
  if (!order) return null;

  const ruleId = RULE_BY_TYPE[input.caseType];
  const resolutionAdmin = createResolutionAdminClient();
  const { data, error } = await resolutionAdmin
    .from("resolution_cases")
    .insert({
      order_id: input.orderId,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      protection_case_id: input.protectionCaseId ?? null,
      case_type: input.caseType,
      status: "OPEN",
      trigger_event: input.triggerEvent,
      rule_id: ruleId,
      estimated_completion_at: input.estimatedCompletionAt ?? null,
      correlation_id: input.correlationId ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) {
    if (/duplicate key|unique/i.test(error?.message ?? "")) {
      return getActiveResolutionCaseForOrder(input.orderId);
    }
    return null;
  }

  const row = data as ResolutionCaseRow;
  await recordResolutionEvent({
    caseId: row.id,
    orderId: input.orderId,
    eventType: "CASE_OPENED",
    message: `Resolution case opened: ${input.caseType}`,
    ruleId,
    metadata: { triggerEvent: input.triggerEvent },
  });
  return row;
}

export async function updateResolutionCaseStatus(input: {
  caseId: string;
  status: ResolutionCaseStatus;
  decision?: string | null;
  refundAmount?: number | null;
  resolvedAt?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const resolutionAdmin = createResolutionAdminClient();
  const updates: Record<string, unknown> = { status: input.status };
  if (input.decision != null) updates.decision = input.decision;
  if (input.refundAmount != null) updates.refund_amount = input.refundAmount;
  if (input.resolvedAt != null) updates.resolved_at = input.resolvedAt;
  if (input.metadata) updates.metadata = input.metadata;

  await resolutionAdmin.from("resolution_cases").update(updates).eq("id", input.caseId);

  await recordResolutionEvent({
    caseId: input.caseId,
    eventType: "STATUS_CHANGED",
    message: `Case status → ${input.status}`,
    metadata: { decision: input.decision ?? null },
  });
}
