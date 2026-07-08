import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";
import { onProtectionResolved } from "@/lib/trust/events";
import { holdForClaim, releaseHoldForClaim, emitCommerceEvent } from "@/lib/commerce-engine";
import { onProtectionCaseOpened } from "@/lib/resolution-engine/hooks.server";

export type ProtectionCaseType = "refund" | "return" | "dispute" | "appeal";
export type ProtectionCaseStatus =
  | "open"
  | "awaiting_seller"
  | "awaiting_buyer"
  | "under_review"
  | "resolved"
  | "appealed"
  | "closed";
export type ProtectionCaseOutcome =
  | "pending"
  | "refund_full"
  | "refund_partial"
  | "return_accepted"
  | "return_rejected"
  | "no_action"
  | "seller_favour"
  | "buyer_favour";

export type ProtectionCase = {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  caseType: ProtectionCaseType;
  status: ProtectionCaseStatus;
  outcome: ProtectionCaseOutcome;
  reason: string;
  description: string;
  refundAmount: number | null;
  adminNotes: string;
  appealReason: string | null;
  appealedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type ProtectionCaseEvent = {
  id: string;
  caseId: string;
  actorId: string | null;
  eventType: string;
  message: string;
  createdAt: string;
};

export type ProtectionEvidence = {
  id: string;
  caseId: string;
  uploadedBy: string;
  fileUrl: string;
  fileName: string;
  description: string;
  createdAt: string;
};

type CaseRow = {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  case_type: ProtectionCaseType;
  status: ProtectionCaseStatus;
  outcome: ProtectionCaseOutcome;
  reason: string;
  description: string;
  refund_amount: number | null;
  admin_notes: string;
  appeal_reason: string | null;
  appealed_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

function mapCase(row: CaseRow): ProtectionCase {
  return {
    id: row.id,
    orderId: row.order_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    caseType: row.case_type,
    status: row.status,
    outcome: row.outcome,
    reason: row.reason,
    description: row.description,
    refundAmount: row.refund_amount,
    adminNotes: row.admin_notes,
    appealReason: row.appeal_reason,
    appealedAt: row.appealed_at,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  };
}

async function addCaseEvent(input: {
  caseId: string;
  actorId?: string;
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("protection_case_events").insert({
    case_id: input.caseId,
    actor_id: input.actorId ?? null,
    event_type: input.eventType,
    message: input.message,
    metadata: (input.metadata ?? {}) as Json,
  });
}

const DISPUTABLE_ORDER_STATUSES = new Set([
  "awaiting_shipment",
  "shipped",
  "delivered",
  "completed",
]);

export async function createProtectionCase(input: {
  orderId: string;
  buyerId: string;
  caseType: ProtectionCaseType;
  reason: string;
  description?: string;
}): Promise<ProtectionCase | null> {
  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, buyer_id, seller_id, status")
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError || !order) {
    return null;
  }

  if (order.buyer_id !== input.buyerId) {
    return null;
  }

  if (!DISPUTABLE_ORDER_STATUSES.has(String(order.status))) {
    return null;
  }

  const { data: existingCase } = await admin
    .from("protection_cases")
    .select("id")
    .eq("order_id", input.orderId)
    .in("status", ["open", "awaiting_seller", "awaiting_buyer", "under_review", "appealed"])
    .maybeSingle();

  if (existingCase) {
    return null;
  }

  const { data, error } = await admin
    .from("protection_cases")
    .insert({
      order_id: input.orderId,
      buyer_id: input.buyerId,
      seller_id: order.seller_id,
      case_type: input.caseType,
      reason: input.reason,
      description: input.description ?? "",
      status: "open",
    })
    .select("*")
    .single();

  if (error || !data) return null;

  const caseRecord = mapCase(data as CaseRow);

  await addCaseEvent({
    caseId: caseRecord.id,
    actorId: input.buyerId,
    eventType: "case_opened",
    message: `${input.caseType} case opened: ${input.reason}`,
  });

  await admin.from("orders").update({ status: "issue_open" }).eq("id", input.orderId);

  // Commerce Engine — move seller escrow to ON_HOLD; blocks any auto-payout.
  await holdForClaim({
    orderId: input.orderId,
    reason: input.reason,
    claimType: input.caseType,
  });
  if (input.caseType === "return") {
    await emitCommerceEvent({
      event: "REFUND_STARTED",
      orderId: input.orderId,
      userId: input.buyerId,
      rule: "return_requested",
      result: "on_hold",
    });
  }

  void onProtectionCaseOpened({
    orderId: input.orderId,
    protectionCaseId: caseRecord.id,
    caseType: input.caseType,
  });

  return caseRecord;
}

export async function getProtectionCase(caseId: string): Promise<ProtectionCase | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("protection_cases").select("*").eq("id", caseId).maybeSingle();
  return data ? mapCase(data as CaseRow) : null;
}

export async function getProtectionCaseByOrderId(orderId: string): Promise<ProtectionCase | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("protection_cases")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapCase(data as CaseRow) : null;
}

export async function listProtectionCasesForUser(
  userId: string,
  role: "buyer" | "seller",
): Promise<ProtectionCase[]> {
  const admin = createAdminClient();
  const column = role === "buyer" ? "buyer_id" : "seller_id";
  const { data } = await admin
    .from("protection_cases")
    .select("*")
    .eq(column, userId)
    .order("created_at", { ascending: false });

  return ((data as CaseRow[] | null) ?? []).map(mapCase);
}

export async function listProtectionCaseEvents(caseId: string): Promise<ProtectionCaseEvent[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("protection_case_events")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as Array<{
    id: string;
    case_id: string;
    actor_id: string | null;
    event_type: string;
    message: string;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    caseId: row.case_id,
    actorId: row.actor_id,
    eventType: row.event_type,
    message: row.message,
    createdAt: row.created_at,
  }));
}

export async function addProtectionEvidence(input: {
  caseId: string;
  uploadedBy: string;
  fileUrl: string;
  fileName: string;
  description?: string;
}): Promise<ProtectionEvidence | null> {
  const admin = createAdminClient();
  const caseRecord = await getProtectionCase(input.caseId);

  if (
    !caseRecord ||
    (caseRecord.buyerId !== input.uploadedBy && caseRecord.sellerId !== input.uploadedBy)
  ) {
    return null;
  }

  const { data, error } = await admin
    .from("protection_evidence")
    .insert({
      case_id: input.caseId,
      uploaded_by: input.uploadedBy,
      file_url: input.fileUrl,
      file_name: input.fileName,
      description: input.description ?? "",
    })
    .select("*")
    .single();

  if (error || !data) return null;

  await addCaseEvent({
    caseId: input.caseId,
    actorId: input.uploadedBy,
    eventType: "evidence_uploaded",
    message: `Evidence uploaded: ${input.fileName}`,
  });

  return {
    id: data.id,
    caseId: data.case_id,
    uploadedBy: data.uploaded_by,
    fileUrl: data.file_url,
    fileName: data.file_name,
    description: data.description,
    createdAt: data.created_at,
  };
}

export async function submitCaseAppeal(input: {
  caseId: string;
  userId: string;
  reason: string;
}): Promise<ProtectionCase | null> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("protection_cases")
    .select("*")
    .eq("id", input.caseId)
    .maybeSingle();

  if (!existing) return null;
  if (existing.buyer_id !== input.userId && existing.seller_id !== input.userId) return null;

  const { data } = await admin
    .from("protection_cases")
    .update({
      status: "appealed",
      appeal_reason: input.reason,
      appealed_at: new Date().toISOString(),
    })
    .eq("id", input.caseId)
    .select("*")
    .single();

  if (!data) return null;

  await addCaseEvent({
    caseId: input.caseId,
    actorId: input.userId,
    eventType: "appeal_submitted",
    message: input.reason,
  });

  return mapCase(data as CaseRow);
}

export async function resolveProtectionCase(input: {
  caseId: string;
  adminId: string;
  outcome: ProtectionCaseOutcome;
  notes: string;
  refundAmount?: number;
}): Promise<ProtectionCase | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("protection_cases")
    .update({
      status: "resolved",
      outcome: input.outcome,
      admin_id: input.adminId,
      admin_notes: input.notes,
      refund_amount: input.refundAmount ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", input.caseId)
    .select("*")
    .single();

  if (!data) return null;

  await addCaseEvent({
    caseId: input.caseId,
    actorId: input.adminId,
    eventType: "admin_decision",
    message: input.notes,
    metadata: { outcome: input.outcome, refundAmount: input.refundAmount },
  });

  void onProtectionResolved({
    caseId: input.caseId,
    buyerId: String(data.buyer_id),
    sellerId: String(data.seller_id),
    outcome: input.outcome,
  });

  // Commerce Engine — a seller-favour resolution (no refund) unblocks escrow so
  // the delivered + 24h auto-release can proceed. Buyer-favour / refunds keep
  // the funds held (the refund flow reverses them).
  const sellerFavour =
    input.outcome === "seller_favour" ||
    input.outcome === "no_action" ||
    input.outcome === "return_rejected";
  if (sellerFavour) {
    await releaseHoldForClaim({ orderId: String(data.order_id) });
  } else {
    await emitCommerceEvent({
      event: "REFUND_COMPLETED",
      orderId: String(data.order_id),
      userId: String(data.seller_id),
      rule: "claim_resolved",
      result: input.outcome,
    });
  }

  return mapCase(data as CaseRow);
}

export async function listOpenProtectionCases(limit = 50): Promise<ProtectionCase[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("protection_cases")
    .select("*")
    .in("status", ["open", "awaiting_seller", "awaiting_buyer", "under_review", "appealed"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data as CaseRow[] | null) ?? []).map(mapCase);
}
