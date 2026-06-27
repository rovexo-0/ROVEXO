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
import {
  notifySellerModerationResolved,
  notifySellerReviewCaseCreated,
  notifySuperAdminsNewReport,
} from "@/lib/moderation/notifications";
import {
  appendTimelineStep,
  buildInitialTimeline,
  buildSellerEvidence,
  formatReportReason,
  getEstimatedReviewTime,
  getHowToFix,
  mapSellerReviewStatus,
  parseTimeline,
  type AdminModerationCaseDetail,
  type SellerReviewCase,
} from "@/lib/moderation/review-center";
import { onContentReportTargeted, onModerationDecision } from "@/lib/trust/events";

type QueueInsert = {
  targetType: ModerationTarget;
  targetId: string;
  productId?: string | null;
  sellerId?: string | null;
  source: string;
  result: ModerationResult;
  payload?: Record<string, unknown>;
  forcePending?: boolean;
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
      status: input.forcePending
        ? "pending"
        : needsQueue
          ? "pending"
          : input.result.decision === "approved"
            ? "approved"
            : status,
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

  await syncContentReportStatus(existing, input.decision === "blocked" ? "blocked" : input.decision === "warning" ? "warning" : "approved");

  if (existing.seller_id) {
    void notifySellerModerationResolved({
      sellerId: String(existing.seller_id),
      productTitle: String(existing.summary ?? "Listing"),
      outcome: input.decision === "approved" ? "restored" : input.decision === "blocked" ? "removed" : "changes",
      caseId: input.queueId,
    });
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

  await syncContentReportStatus(existing, status);

  if (existing.seller_id) {
    void notifySellerModerationResolved({
      sellerId: String(existing.seller_id),
      productTitle: String(existing.summary ?? "Listing"),
      outcome:
        input.decision === "approved"
          ? "restored"
          : input.decision === "blocked"
            ? "removed"
            : "changes",
      caseId: input.queueId,
    });
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

  let queueItem: ModerationQueueItem | null = null;

  if (input.targetType === "listing") {
    const { data: product } = await admin
      .from("products")
      .select("id, seller_id, slug, title")
      .eq("id", input.targetId)
      .maybeSingle();

    const reportCount = await countListingReports(input.targetId);
    const reporterLabel = reportCount > 1 ? "Multiple Verified Users" : "Verified ROVEXO User";
    const timeline = buildInitialTimeline(String(data.created_at));

    queueItem = await enqueueModerationReview({
      targetType: input.targetType,
      targetId: input.targetId,
      productId: product?.id ?? input.targetId,
      sellerId: product?.seller_id ?? null,
      source: "user_report",
      forcePending: true,
      result: {
        decision: "warning",
        confidence: 0.7,
        categories: [],
        hits: [],
        summary: `User report: ${formatReportReason(input.reason)}`,
        riskLevel: "medium",
        riskScore: 55,
      },
      payload: {
        reportId: data.id,
        reason: input.reason,
        details: input.details ?? "",
        timeline,
        reporterLabel,
      },
    });

    if (product) {
      await admin
        .from("products")
        .update({
          status: "paused",
          moderation_status: "warning",
          moderation_summary: `Under review: ${formatReportReason(input.reason)}`,
          moderation_reviewed_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (product.seller_id && queueItem) {
        void notifySellerReviewCaseCreated({
          sellerId: String(product.seller_id),
          productTitle: product.title,
          caseId: queueItem.id,
        });
      }

      if (queueItem) {
        void notifySuperAdminsNewReport({
          productTitle: product.title,
          reason: formatReportReason(input.reason),
          queueId: queueItem.id,
        });
      }
    }
  } else {
    queueItem = await enqueueModerationReview({
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
  }

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

async function countListingReports(productId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("content_reports")
    .select("*", { count: "exact", head: true })
    .eq("target_type", "listing")
    .eq("target_id", productId);
  return count ?? 0;
}

async function syncContentReportStatus(
  queueRow: Record<string, unknown>,
  status: ModerationQueueItem["status"],
): Promise<void> {
  const payload = (queueRow.payload as Record<string, unknown> | undefined) ?? {};
  const reportId = payload.reportId ? String(payload.reportId) : null;
  if (!reportId) return;

  const admin = createAdminClient();
  await admin.from("content_reports").update({ status }).eq("id", reportId);
}

async function mapQueueToSellerCase(
  item: ModerationQueueItem,
  product: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
  },
): Promise<SellerReviewCase> {
  const payload = item.payload ?? {};
  const reason = String(payload.reason ?? "other");
  const mapped = mapSellerReviewStatus(item);
  const timeline = parseTimeline(payload);
  const reporterLabel = String(payload.reporterLabel ?? "Verified ROVEXO User");

  return {
    id: item.id,
    queueId: item.id,
    productId: product.id,
    productSlug: product.slug,
    productTitle: product.title,
    productImageUrl: product.imageUrl,
    status: mapped.status,
    statusLabel: mapped.label,
    reason,
    reasonLabel: formatReportReason(reason),
    howToFix: getHowToFix(reason),
    estimatedReviewTime: getEstimatedReviewTime(item.riskScore),
    moderatorNotes: item.overrideNotes ?? item.summary,
    evidence: buildSellerEvidence({
      reason,
      details: String(payload.details ?? ""),
      summary: item.summary,
      overrideNotes: item.overrideNotes,
      reporterLabel,
    }),
    reporterLabel,
    timeline,
    sellerResponse: payload.sellerResponse ? String(payload.sellerResponse) : null,
    canRespond: mapped.status === "under_review" || mapped.status === "changes_requested",
    canEditListing: mapped.status !== "removed",
    decision: mapped.decision,
    createdAt: item.createdAt,
    updatedAt: item.reviewedAt ?? item.createdAt,
  };
}

export async function listSellerReviewCases(sellerId: string): Promise<SellerReviewCase[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("moderation_queue")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("target_type", "listing")
    .in("status", ["pending", "warning", "blocked", "overridden"])
    .order("created_at", { ascending: false })
    .limit(50);

  const items = ((data as Record<string, unknown>[] | null) ?? []).map(mapQueueRow);
  const cases: SellerReviewCase[] = [];

  for (const item of items) {
    if (!item.productId) continue;
    const { data: product } = await admin
      .from("products")
      .select("id, slug, title, product_images(url, sort_order)")
      .eq("id", item.productId)
      .maybeSingle();

    if (!product) continue;

    const images = (product.product_images as Array<{ url: string; sort_order: number }> | null) ?? [];
    const imageUrl = images.sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;

    cases.push(
      await mapQueueToSellerCase(item, {
        id: product.id,
        slug: product.slug,
        title: product.title,
        imageUrl,
      }),
    );
  }

  return cases;
}

export async function getSellerReviewCase(
  sellerId: string,
  queueId: string,
): Promise<SellerReviewCase | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("moderation_queue")
    .select("*")
    .eq("id", queueId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (!data) return null;

  const item = mapQueueRow(data as Record<string, unknown>);
  if (!item.productId) return null;

  const { data: product } = await admin
    .from("products")
    .select("id, slug, title, product_images(url, sort_order)")
    .eq("id", item.productId)
    .maybeSingle();

  if (!product) return null;

  const images = (product.product_images as Array<{ url: string; sort_order: number }> | null) ?? [];
  const imageUrl = images.sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;

  return mapQueueToSellerCase(item, {
    id: product.id,
    slug: product.slug,
    title: product.title,
    imageUrl,
  });
}

export async function submitSellerReviewResponse(input: {
  sellerId: string;
  queueId: string;
  explanation: string;
}): Promise<SellerReviewCase | null> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("moderation_queue")
    .select("*")
    .eq("id", input.queueId)
    .eq("seller_id", input.sellerId)
    .maybeSingle();

  if (!existing) return null;

  const payload = (existing.payload as Record<string, unknown>) ?? {};
  const timeline = appendTimelineStep(parseTimeline(payload), "seller_response");
  const nextTimeline = appendTimelineStep(timeline, "decision_pending");

  await admin
    .from("moderation_queue")
    .update({
      payload: {
        ...payload,
        sellerResponse: input.explanation.trim(),
        timeline: nextTimeline,
      },
    })
    .eq("id", input.queueId);

  await writeAuditLog({
    queueId: input.queueId,
    actorId: input.sellerId,
    action: "seller_response",
    notes: input.explanation.trim(),
  });

  return getSellerReviewCase(input.sellerId, input.queueId);
}

export async function getAdminModerationCaseDetail(queueId: string): Promise<AdminModerationCaseDetail | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("moderation_queue").select("*").eq("id", queueId).maybeSingle();
  if (!data) return null;

  const item = mapQueueRow(data as Record<string, unknown>);
  const payload = item.payload ?? {};
  const reportId = payload.reportId ? String(payload.reportId) : null;

  let report: AdminModerationCaseDetail["report"] = null;
  let reporter: AdminModerationCaseDetail["reporter"] = null;
  let reportCount = 0;

  if (reportId) {
    const { data: reportRow } = await admin.from("content_reports").select("*").eq("id", reportId).maybeSingle();
    if (reportRow) {
      report = {
        id: String(reportRow.id),
        reason: String(reportRow.reason),
        details: String(reportRow.details ?? ""),
        createdAt: String(reportRow.created_at),
        status: String(reportRow.status),
      };

      const { data: reporterProfile } = await admin
        .from("profiles")
        .select("id, full_name, email, username")
        .eq("id", reportRow.reporter_id)
        .maybeSingle();

      if (reporterProfile) {
        reporter = {
          id: reporterProfile.id,
          name: reporterProfile.full_name ?? reporterProfile.username ?? "User",
          email: reporterProfile.email,
          username: reporterProfile.username,
        };
      }
    }
  }

  if (item.productId) {
    reportCount = await countListingReports(item.productId);
  }

  let product: AdminModerationCaseDetail["product"] = null;
  if (item.productId) {
    const { data: productRow } = await admin
      .from("products")
      .select("id, slug, title, seller_id")
      .eq("id", item.productId)
      .maybeSingle();
    if (productRow) {
      product = {
        id: productRow.id,
        slug: productRow.slug,
        title: productRow.title,
        sellerId: String(productRow.seller_id),
      };
    }
  }

  return {
    queue: item,
    report,
    reporter,
    reportCount,
    product,
    timeline: parseTimeline(payload),
    sellerResponse: payload.sellerResponse ? String(payload.sellerResponse) : null,
  };
}
