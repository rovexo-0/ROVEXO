import type { ModerationQueueItem } from "@/lib/moderation/types";

export type ReviewTimelineStep = {
  id: string;
  label: string;
  at: string;
  complete: boolean;
};

export type ReviewEvidenceItem = {
  type: "moderator" | "buyer" | "system";
  label: string;
  content: string;
};

export type SellerReviewCaseStatus =
  | "under_review"
  | "changes_requested"
  | "decision_pending"
  | "resolved"
  | "removed";

export type SellerReviewCase = {
  id: string;
  queueId: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  productImageUrl: string | null;
  status: SellerReviewCaseStatus;
  statusLabel: string;
  reason: string;
  reasonLabel: string;
  howToFix: string[];
  estimatedReviewTime: string;
  moderatorNotes: string;
  evidence: ReviewEvidenceItem[];
  reporterLabel: string;
  timeline: ReviewTimelineStep[];
  sellerResponse: string | null;
  canRespond: boolean;
  canEditListing: boolean;
  decision: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminModerationCaseDetail = {
  queue: ModerationQueueItem;
  report: {
    id: string;
    reason: string;
    details: string;
    createdAt: string;
    status: string;
  } | null;
  reporter: {
    id: string;
    name: string;
    email: string;
    username: string | null;
  } | null;
  reportCount: number;
  product: {
    id: string;
    slug: string;
    title: string;
    sellerId: string;
  } | null;
  timeline: ReviewTimelineStep[];
  sellerResponse: string | null;
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  misleading: "Misleading Description",
  wrong_category: "Wrong Category",
  wrong_photos: "Wrong Photos",
  duplicate: "Duplicate Listing",
  suspicious: "Suspicious Listing",
  wrong_location: "Wrong Location",
  counterfeit: "Counterfeit or Replica",
  prohibited: "Prohibited Item",
  spam: "Spam or Scam",
  other: "Other",
};

export const HOW_TO_FIX_BY_REASON: Record<string, string[]> = {
  misleading: ["Upload clearer photos", "Correct description", "Adjust pricing"],
  wrong_category: ["Choose correct category", "Correct description"],
  wrong_photos: ["Upload clearer photos", "Correct description"],
  duplicate: ["Remove duplicate listings", "Choose correct category"],
  suspicious: ["Correct description", "Upload clearer photos", "Adjust pricing"],
  wrong_location: ["Correct listing location", "Correct description"],
  counterfeit: ["Correct description", "Upload clearer photos"],
  prohibited: ["Correct description", "Choose correct category"],
  spam: ["Correct description", "Remove external contact details"],
  other: ["Upload clearer photos", "Correct description", "Choose correct category"],
};

export const DEFAULT_HOW_TO_FIX = [
  "Upload clearer photos",
  "Correct description",
  "Choose correct category",
  "Correct listing location",
  "Adjust pricing",
];

export function formatReportReason(reason: string): string {
  return REPORT_REASON_LABELS[reason] ?? reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getHowToFix(reason: string): string[] {
  return HOW_TO_FIX_BY_REASON[reason] ?? DEFAULT_HOW_TO_FIX;
}

export function getEstimatedReviewTime(riskScore: number): string {
  if (riskScore >= 75) return "24–48 hours";
  if (riskScore >= 50) return "1–3 business days";
  return "2–5 business days";
}

export function buildInitialTimeline(now = new Date().toISOString()): ReviewTimelineStep[] {
  return [
    { id: "reported", label: "Listing Reported", at: now, complete: true },
    { id: "hidden", label: "Listing Hidden", at: now, complete: true },
    { id: "reviewing", label: "Moderator Reviewing", at: now, complete: false },
    { id: "seller_response", label: "Seller Response", at: now, complete: false },
    { id: "decision_pending", label: "Decision Pending", at: now, complete: false },
    { id: "resolved", label: "Resolved", at: now, complete: false },
  ];
}

export function parseTimeline(payload: Record<string, unknown>): ReviewTimelineStep[] {
  const raw = payload.timeline;
  if (!Array.isArray(raw)) return buildInitialTimeline();
  return raw
    .filter((step): step is ReviewTimelineStep => Boolean(step && typeof step === "object" && "label" in step))
    .map((step) => ({
      id: String((step as ReviewTimelineStep).id ?? (step as ReviewTimelineStep).label),
      label: String((step as ReviewTimelineStep).label),
      at: String((step as ReviewTimelineStep).at ?? new Date().toISOString()),
      complete: Boolean((step as ReviewTimelineStep).complete),
    }));
}

export function appendTimelineStep(
  timeline: ReviewTimelineStep[],
  id: string,
): ReviewTimelineStep[] {
  const now = new Date().toISOString();
  return timeline.map((step) =>
    step.id === id ? { ...step, label: step.label, complete: true, at: now } : step,
  );
}

export function mapSellerReviewStatus(item: ModerationQueueItem): {
  status: SellerReviewCaseStatus;
  label: string;
  decision: string | null;
} {
  const payload = item.payload ?? {};
  const sellerResponded = Boolean(payload.sellerResponse);

  if (item.status === "approved" || item.overrideDecision === "approved") {
    return { status: "resolved", label: "Listing Restored", decision: "Listing Restored" };
  }

  if (item.status === "blocked") {
    return { status: "removed", label: "Listing Removed", decision: "Listing Removed" };
  }

  if (item.status === "overridden" && item.overrideDecision === "blocked") {
    return { status: "removed", label: "Listing Removed", decision: "Listing Removed" };
  }

  if (item.status === "warning" && item.reviewedAt) {
    return {
      status: "changes_requested",
      label: "Request Changes",
      decision: "Request Changes",
    };
  }

  if (sellerResponded && item.status === "pending") {
    return { status: "decision_pending", label: "Decision Pending", decision: null };
  }

  return { status: "under_review", label: "Under Review", decision: null };
}

export function buildSellerEvidence(input: {
  reason: string;
  details: string;
  summary: string;
  overrideNotes: string | null;
  reporterLabel: string;
}): ReviewEvidenceItem[] {
  const items: ReviewEvidenceItem[] = [];

  if (input.summary) {
    items.push({
      type: "moderator",
      label: "Moderator review",
      content: input.summary,
    });
  }

  if (input.overrideNotes) {
    items.push({
      type: "moderator",
      label: "Moderator notes",
      content: input.overrideNotes,
    });
  }

  if (input.details?.trim()) {
    items.push({
      type: "buyer",
      label: input.reporterLabel,
      content: input.details.trim(),
    });
  } else if (input.reason) {
    items.push({
      type: "buyer",
      label: input.reporterLabel,
      content: `Report reason: ${formatReportReason(input.reason)}`,
    });
  }

  return items;
}

export function statusColor(
  status: SellerReviewCaseStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "resolved":
      return "success";
    case "under_review":
    case "decision_pending":
      return "warning";
    case "removed":
    case "changes_requested":
      return "danger";
    default:
      return "default";
  }
}
