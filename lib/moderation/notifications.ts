import { emitSmartNotification } from "@/lib/notifications/events";
import { createAdminClient } from "@/lib/supabase/admin";

type ModerationNotificationInput = {
  userId: string;
  title: string;
  subtitle: string;
  href?: string;
  detail?: string;
  idempotencyKey: string;
};

export async function notifyModerationEvent(input: ModerationNotificationInput): Promise<void> {
  await emitSmartNotification({
    userId: input.userId,
    eventType: "admin_announcement",
    idempotencyKey: input.idempotencyKey,
    notificationType: "moderation",
    title: input.title,
    subtitle: input.subtitle,
    href: input.href,
    detail: input.detail,
  });
}

export async function notifySellerReviewCaseCreated(input: {
  sellerId: string;
  productTitle: string;
  caseId: string;
}): Promise<void> {
  await notifyModerationEvent({
    userId: input.sellerId,
    title: "Listing under review",
    subtitle: `“${input.productTitle}” was reported and is hidden from search while we review it.`,
    href: `/seller/review-center/${input.caseId}`,
    detail: "Open Review Center to respond or update your listing.",
    idempotencyKey: `moderation-case-created-${input.caseId}-${input.sellerId}`,
  });
}

export async function notifySuperAdminsNewReport(input: {
  productTitle: string;
  reason: string;
  queueId: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["super_admin", "admin"]);

  for (const profile of admins ?? []) {
    await notifyModerationEvent({
      userId: profile.id,
      title: "New listing report",
      subtitle: `“${input.productTitle}” — ${input.reason}`,
      href: `/super-admin/moderation?case=${input.queueId}`,
      detail: "A buyer report requires moderation review.",
      idempotencyKey: `moderation-new-report-${input.queueId}-${profile.id}`,
    });
  }
}

export async function notifySellerModerationResolved(input: {
  sellerId: string;
  productTitle: string;
  outcome: "restored" | "changes" | "removed" | "closed";
  caseId: string;
}): Promise<void> {
  const copy = {
    restored: {
      title: "Listing restored",
      subtitle: `“${input.productTitle}” is live again.`,
    },
    changes: {
      title: "Changes requested",
      subtitle: `Update “${input.productTitle}” to resolve the review.`,
    },
    removed: {
      title: "Listing removed",
      subtitle: `“${input.productTitle}” was removed after review.`,
    },
    closed: {
      title: "Review case closed",
      subtitle: `The review for “${input.productTitle}” is complete.`,
    },
  }[input.outcome];

  await notifyModerationEvent({
    userId: input.sellerId,
    title: copy.title,
    subtitle: copy.subtitle,
    href: `/seller/review-center/${input.caseId}`,
    idempotencyKey: `moderation-resolved-${input.caseId}-${input.outcome}-${input.sellerId}`,
  });
}
