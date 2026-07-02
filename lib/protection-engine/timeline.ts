import type { ProtectionCase, ProtectionCaseEvent, ProtectionCaseStatus } from "@/lib/protection/service";
import { PROTECTION_ENGINE_TIMELINE_EVENTS } from "@/lib/protection-engine/registry";
import type {
  ProtectionEngineCaseStatusId,
  ProtectionEngineCaseSummary,
  ProtectionEngineFilterId,
  ProtectionEngineProtectionPhase,
  ProtectionEngineTimelineEvent,
  ProtectionEngineTimelineEventId,
} from "@/lib/protection-engine/types";

export function mapLegacyStatusToEnterprise(status: ProtectionCaseStatus): ProtectionEngineCaseStatusId {
  const map: Record<ProtectionCaseStatus, ProtectionEngineCaseStatusId> = {
    open: "submitted",
    awaiting_seller: "waiting-for-seller",
    awaiting_buyer: "waiting-for-buyer",
    under_review: "admin-investigation",
    resolved: "resolved",
    appealed: "appealed",
    closed: "closed",
  };
  return map[status];
}

export function mapCaseToFilters(status: ProtectionCaseStatus, outcome: string): ProtectionEngineFilterId[] {
  const tags: ProtectionEngineFilterId[] = [];
  if (["open", "awaiting_seller", "awaiting_buyer"].includes(status)) tags.push("open", "waiting");
  if (status === "under_review") tags.push("under-review", "open");
  if (status === "appealed") tags.push("appealed", "open");
  if (status === "resolved") tags.push("resolved");
  if (status === "closed") tags.push("closed");
  if (outcome === "refund_full" || outcome === "refund_partial") tags.push("refunded");
  if (outcome === "return_rejected" || outcome === "seller_favour") tags.push("rejected");
  return tags.length ? tags : ["open"];
}

export function mapCaseToSummary(
  caseRecord: ProtectionCase,
  role: "buyer" | "seller",
): ProtectionEngineCaseSummary {
  return {
    caseId: caseRecord.id,
    orderId: caseRecord.orderId,
    caseType: caseRecord.caseType,
    enterpriseStatus: mapLegacyStatusToEnterprise(caseRecord.status),
    legacyStatus: caseRecord.status,
    reason: caseRecord.reason,
    outcome: caseRecord.outcome,
    refundAmount: caseRecord.refundAmount,
    role,
    createdAt: caseRecord.createdAt,
    resolvedAt: caseRecord.resolvedAt,
    filterTags: mapCaseToFilters(caseRecord.status, caseRecord.outcome),
  };
}

function currentTimelineStage(
  status: ProtectionCaseStatus,
  events: ProtectionCaseEvent[],
): ProtectionEngineTimelineEventId {
  if (status === "closed") return "case-closed";
  if (status === "resolved") {
    return events.some((e) => e.eventType.includes("refund")) ? "refund" : "decision";
  }
  if (status === "appealed") return "additional-evidence";
  if (status === "under_review") return "admin-review";
  if (status === "awaiting_seller") return "seller-response";
  if (events.some((e) => e.eventType === "evidence_uploaded")) return "evidence-uploaded";
  return "case-created";
}

const TIMELINE_ORDER: ProtectionEngineTimelineEventId[] = PROTECTION_ENGINE_TIMELINE_EVENTS.map((e) => e.id);

export function buildCaseTimeline(
  caseRecord: ProtectionCase,
  events: ProtectionCaseEvent[],
): ProtectionEngineTimelineEvent[] {
  const current = currentTimelineStage(caseRecord.status, events);
  const currentIndex = TIMELINE_ORDER.indexOf(current);

  const evidenceEvent = events.find((e) => e.eventType === "evidence_uploaded");
  const adminEvent = events.find((e) => e.eventType === "admin_decision");
  const appealEvent = events.find((e) => e.eventType === "appeal_submitted");

  const timestamps: Partial<Record<ProtectionEngineTimelineEventId, string | undefined>> = {
    "case-created": caseRecord.createdAt,
    "evidence-uploaded": evidenceEvent?.createdAt,
    "seller-response": caseRecord.status === "awaiting_seller" ? caseRecord.createdAt : undefined,
    "admin-review": caseRecord.status === "under_review" ? caseRecord.createdAt : undefined,
    "additional-evidence": appealEvent?.createdAt,
    decision: adminEvent?.createdAt ?? caseRecord.resolvedAt ?? undefined,
    refund: caseRecord.refundAmount != null ? caseRecord.resolvedAt ?? undefined : undefined,
    "wallet-update": caseRecord.resolvedAt ?? undefined,
    "case-closed": caseRecord.resolvedAt ?? undefined,
  };

  return PROTECTION_ENGINE_TIMELINE_EVENTS.map((event) => {
    const index = TIMELINE_ORDER.indexOf(event.id);
    return {
      id: event.id,
      label: event.label,
      timestamp: timestamps[event.id],
      done: index <= currentIndex,
      current: event.id === current,
    };
  });
}

export function deriveProtectionPhase(openCases: number, appealedCases: number): ProtectionEngineProtectionPhase {
  if (appealedCases > 0) return "disputed";
  if (openCases > 0) return "review-period";
  return "activated";
}

export function matchesSummaryFilter(status: ProtectionEngineCaseStatusId, filter: ProtectionEngineFilterId): boolean {
  if (filter === "open" && ["submitted", "waiting-for-buyer", "waiting-for-seller", "admin-investigation", "appealed"].includes(status)) return true;
  if (filter === "under-review" && status === "admin-investigation") return true;
  if (filter === "waiting" && ["waiting-for-buyer", "waiting-for-seller"].includes(status)) return true;
  if (filter === "evidence" && ["evidence-requested", "evidence-received"].includes(status)) return true;
  if (filter === "resolved" && status === "resolved") return true;
  if (filter === "refunded" && ["refund-approved", "partial-refund", "resolved"].includes(status)) return true;
  if (filter === "rejected" && status === "rejected") return true;
  if (filter === "appealed" && status === "appealed") return true;
  if (filter === "closed" && status === "closed") return true;
  return false;
}

export function matchesSearch(query: string, fields: { reason?: string; caseType?: string; orderId?: string }): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [fields.reason, fields.caseType, fields.orderId]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}
