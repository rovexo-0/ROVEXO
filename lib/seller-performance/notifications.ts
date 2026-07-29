import { emitSmartNotification } from "@/lib/notifications/events";
import { SELLER_LEVEL_LABELS, type SellerLevel } from "@/lib/seller-performance/master-spec";

export async function notifySellerPerformanceChange(input: {
  userId: string;
  scoreBefore: number;
  scoreAfter: number;
  level: SellerLevel;
  reason: string;
}): Promise<void> {
  const delta = input.scoreAfter - input.scoreBefore;
  if (delta === 0) return;

  const direction = delta > 0 ? "increased" : "decreased";
  await emitSmartNotification({
    userId: input.userId,
    eventType: "trust_verification",
    idempotencyKey: `seller-perf-${input.userId}-${input.scoreBefore}-${input.scoreAfter}`,
    notificationType: "system",
    title: delta > 0 ? "Seller score improved" : "Seller score updated",
    subtitle: `Your seller score ${direction} to ${input.scoreAfter} (${SELLER_LEVEL_LABELS[input.level]}). ${input.reason}`,
    detail: "Open Seller Performance to review your reputation progress.",
    href: "/seller/performance",
    payload: {
      scoreBefore: input.scoreBefore,
      scoreAfter: input.scoreAfter,
      level: input.level,
    },
  });
}

export async function notifySellerLevelUp(input: {
  userId: string;
  level: SellerLevel;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.userId,
    eventType: "follow_seller_badge",
    idempotencyKey: `seller-level-up-${input.userId}-${input.level}`,
    notificationType: "system",
    title: "Congratulations!",
    subtitle: `You reached ${SELLER_LEVEL_LABELS[input.level]}.`,
    detail: "Your marketplace reputation level was upgraded automatically.",
    href: "/seller/performance",
    payload: { level: input.level },
  });
}

export async function notifyAchievementUnlocked(input: {
  userId: string;
  achievementLabel: string;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.userId,
    eventType: "follow_seller_badge",
    idempotencyKey: `seller-achievement-${input.userId}-${input.achievementLabel}`,
    notificationType: "system",
    title: "Achievement unlocked",
    subtitle: `You earned the ${input.achievementLabel} badge.`,
    detail: "Buyers can now see this badge on your profile.",
    href: "/seller/performance",
    payload: { achievementLabel: input.achievementLabel },
  });
}

export async function notifySellerPerformanceWarning(input: {
  userId: string;
  message: string;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.userId,
    eventType: "security_alert",
    idempotencyKey: `seller-perf-warning-${input.userId}-${input.message.slice(0, 48)}`,
    notificationType: "system",
    title: "Seller performance warning",
    subtitle: input.message,
    detail: "Improve your metrics to protect your seller level.",
    href: "/seller/performance",
  });
}
