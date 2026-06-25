import { createAdminClient } from "@/lib/supabase/admin";
import { requiresModerationQueue } from "@/lib/moderation/risk";
import type {
  ContentReport,
  ModerationDecision,
  ModerationQueueItem,
  ModerationResult,
  ModerationTarget,
} from "@/lib/moderation/types";
import { toAuditLogMetadata, type AuditLogMetadata } from "@/lib/audit/metadata";
import type { Json } from "@/lib/supabase/types/database";
import { onContentReportTargeted, onModerationDecision } from "@/lib/trust/events";

type QueueInsert = {
  targetType: ModerationTarget;
  targetId: string;
  productId?: string | null;
  sellerId?: string | null;
  source: string;
  result: ModerationResult;
  payload?: Record<string, unknown>;
};

function mapQueueRow(row: Record<string, unknown>): ModerationQueueItem {
  return {
    id: String(row.id),
    targetType: row.target_type as ModerationTarget,
    targetId: String(row.target_id),
    productId: row.product_id ? String(row.product_id) : null,
    sellerId: row.seller_id ? String(row.seller_id) : null,
    source: String(row.source),
    decision: row.decision as ModerationDecision,
    confidence: Number(row.confidence),
    categories: (row.categories as ModerationQueueItem["categories"]) ?? [],
    summary: String(row.summary ?? ""),
    riskLevel: (row.risk_level as ModerationQueueItem["riskLevel"]) ?? "low",
    riskScore: Number(row.risk_score ?? 0),
    status: row.status as ModerationQueueItem["status"],
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    overrideDecision: (row.override_decision as ModerationDecision | null) ?? null,
    overrideNotes: row.override_notes ? String(row.override_notes) : null,
  };
}

export async function enqueueModerationReview(input: QueueInsert): Promise<ModerationQueueItem | null> {
  const admin = createAdminClient();
  const status =
    input.result.decision === "approved"
      ? "approved"
      : input.result.decision === "warning"
        ? "warning"
        : "blocked";

  const needsQueue =
    input.result.decision !== "approved" &&
    (requiresModerationQueue(input.result.riskLevel) || input.result.decision === "blocked");

  const { data, error } = await admin
    .from("moderation_queue")
    .insert({
      target_type: input.targetType,
      target_id: input.targetId,
      product_id: input.productId ?? null,
      seller_id: input.sellerId ?? null,
      source: input.source,
      decision: input.result.decision,
      confidence: input.result.confidence,
      categories: input.result.categories,
      summary: input.result.summary,
      risk_level: input.result.riskLevel,
      risk_score: input.result.riskScore,
      status: needsQueue ? "pending" : input.result.decision === "approved" ? "approved" : status,
      payload: {
        hits: input.result.hits,
        riskLevel: input.result.riskLevel,
        riskScore: input.result.riskScore,
        ...(input.payload ?? {}),
      },
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  await writeAuditLog({
    queueId: String(data.id),
    action: "queued",
    newStatus: status === "approved" ? "approved" : "pending",
    decision: input.result.decision,
    notes: input.result.summary,
    metadata: { source: input.source },
  });

  return mapQueueRow(data as Record<string, unknown>);
}

export async function listModerationQueue(limit = 50): Promise<ModerationQueueItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("moderation_queue")
    .select("*")
    .in("status", ["pending", "warning", "blocked"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data as Record<string, unknown>[] | null) ?? []).map(mapQueueRow);
}

export async function overrideModerationDecision(input: {
  queueId: string;
  reviewerId: string;
  decision: ModerationDecision;
  notes: string;
}): Promise<ModerationQueueItem | null> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("moderation_queue")
    .select("*")
    .eq("id", input.queueId)
    .maybeSingle();

  if (!existing) {
    return null;
  }

  const { data } = await admin
    .from("moderation_queue")
    .update({
      status: "overridden",
      override_decision: input.decision,
      override_notes: input.notes,
      reviewer_id: input.reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.queueId)
    .select("*")
    .single();

  if (!data) {
    return null;
  }

  if (existing.target_type === "listing" && existing.product_id) {
    await admin
      .from("products")
      .update({
        moderation_status: input.decision,
        moderation_confidence: 1,
        moderation_summary: input.notes || existing.summary,
        moderation_reviewed_at: new Date().toISOString(),
        status: input.decision === "blocked" ? "paused" : "published",
      })
      .eq("id", existing.product_id);
  }

  await writeAuditLog({
    queueId: input.queueId,
    actorId: input.reviewerId,
    action: "override",
    previousStatus: existing.status,
    newStatus: "overridden",
    decision: input.decision,
    notes: input.notes,
  });

  return mapQueueRow(data as Record<string, unknown>);
}

export async function resolveModerationQueueItem(input: {
  queueId: string;
  reviewerId: string;
  decision: ModerationDecision;
  notes?: string;
}): Promise<ModerationQueueItem | null> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("moderation_queue")
    .select("*")
    .eq("id", input.queueId)
    .maybeSingle();

  if (!existing) {
    return null;
  }

  const status =
    input.decision === "approved"
      ? "approved"
      : input.decision === "warning"
        ? "warning"
        : "blocked";

  const { data } = await admin
    .from("moderation_queue")
    .update({
      status,
      reviewer_id: input.reviewerId,
      reviewed_at: new Date().toISOString(),
      override_notes: input.notes ?? null,
    })
    .eq("id", input.queueId)
    .select("*")
    .single();

  if (!data) {
    return null;
  }

  if (existing.target_type === "listing" && existing.product_id) {
    await admin
      .from("products")
      .update({
        moderation_status: input.decision,
        moderation_confidence: Number(existing.confidence),
        moderation_summary: input.notes || existing.summary,
        moderation_reviewed_at: new Date().toISOString(),
        status: input.decision === "blocked" ? "paused" : "published",
      })
      .eq("id", existing.product_id);
  }

  await writeAuditLog({
    queueId: input.queueId,
    actorId: input.reviewerId,
    action: "reviewed",
    previousStatus: existing.status,
    newStatus: status,
    decision: input.decision,
    notes: input.notes ?? "",
  });

  if (existing.seller_id) {
    void onModerationDecision({
      sellerId: String(existing.seller_id),
      decision: input.decision,
      queueId: input.queueId,
    });
  }

  return mapQueueRow(data as Record<string, unknown>);
}

async function resolveReportTargetUserId(input: {
  reporterId: string;
  targetType: ModerationTarget;
  targetId: string;
}): Promise<string | null> {
  const admin = createAdminClient();

  if (input.targetType === "profile") {
    return input.targetId;
  }

  if (input.targetType === "listing" || input.targetType === "listing_image") {
    const { data: product } = await admin
      .from("products")
      .select("seller_id")
      .eq("id", input.targetId)
      .maybeSingle();
    return product?.seller_id ? String(product.seller_id) : null;
  }

  if (input.targetType === "conversation") {
    const { data: conversation } = await admin
      .from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", input.targetId)
      .maybeSingle();
    if (!conversation) return null;
    if (conversation.buyer_id === input.reporterId) {
      return String(conversation.seller_id);
    }
    if (conversation.seller_id === input.reporterId) {
      return String(conversation.buyer_id);
    }
    return null;
  }

  if (input.targetType === "message") {
    const { data: message } = await admin
      .from("messages")
      .select("sender_id")
      .eq("id", input.targetId)
      .maybeSingle();
    return message?.sender_id ? String(message.sender_id) : null;
  }

  return null;
}

export async function createContentReport(input: {
  reporterId: string;
  targetType: ModerationTarget;
  targetId: string;
  productSlug?: string;
  reason: string;
  details?: string;
}): Promise<ContentReport | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_reports")
    .insert({
      reporter_id: input.reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      product_slug: input.productSlug ?? null,
      reason: input.reason,
      details: input.details ?? "",
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  await enqueueModerationReview({
    targetType: input.targetType,
    targetId: input.targetId,
    source: "user_report",
    result: {
      decision: "warning",
      confidence: 0.7,
      categories: [],
      hits: [],
      summary: `User report: ${input.reason}`,
      riskLevel: "medium",
      riskScore: 55,
    },
    payload: { reportId: data.id, details: input.details ?? "" },
  });

  const targetUserId = await resolveReportTargetUserId(input);
  if (targetUserId && targetUserId !== input.reporterId) {
    void onContentReportTargeted({
      targetUserId,
      reportId: String(data.id),
    });
  }

  return {
    id: String(data.id),
    reporterId: input.reporterId,
    targetType: input.targetType,
    targetId: input.targetId,
    productSlug: input.productSlug ?? null,
    reason: input.reason,
    details: input.details ?? "",
    status: "pending",
    createdAt: String(data.created_at),
  };
}

export async function listModerationAuditLogs(queueId?: string, limit = 100) {
  const admin = createAdminClient();
  let query = admin
    .from("moderation_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (queueId) {
    query = query.eq("queue_id", queueId);
  }

  const { data } = await query;
  return data ?? [];
}

async function writeAuditLog(input: {
  queueId: string;
  actorId?: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  decision?: ModerationDecision;
  notes?: string;
  metadata?: AuditLogMetadata | Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("moderation_audit_logs").insert({
    queue_id: input.queueId,
    actor_id: input.actorId ?? null,
    action: input.action,
    previous_status: (input.previousStatus as ModerationQueueItem["status"] | undefined) ?? null,
    new_status: (input.newStatus as ModerationQueueItem["status"] | undefined) ?? null,
    decision: input.decision ?? null,
    notes: input.notes ?? "",
    metadata: toAuditLogMetadata(input.metadata) ?? {},
  });
}

export async function applyListingModeration(input: {
  productId: string;
  sellerId: string;
  result: ModerationResult;
  source: string;
}): Promise<{ allowed: boolean; result: ModerationResult }> {
  const admin = createAdminClient();

  await admin
    .from("products")
    .update({
      moderation_status: input.result.decision,
      moderation_confidence: input.result.confidence,
      moderation_summary: input.result.summary,
      moderation_reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.productId);

  if (input.result.decision !== "approved") {
    const shouldQueue =
      requiresModerationQueue(input.result.riskLevel) || input.result.decision === "blocked";

    if (shouldQueue) {
      await enqueueModerationReview({
        targetType: "listing",
        targetId: input.productId,
        productId: input.productId,
        sellerId: input.sellerId,
        source: input.source,
        result: input.result,
      });
    }
  }

  if (input.result.decision === "blocked") {
    await admin.from("products").update({ status: "paused" }).eq("id", input.productId);
    return { allowed: false, result: input.result };
  }

  return { allowed: true, result: input.result };
}
