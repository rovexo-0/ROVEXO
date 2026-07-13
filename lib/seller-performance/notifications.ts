import { dispatchNotification } from "@/lib/notifications/dispatch";
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
  await dispatchNotification({
    userId: input.userId,
    type: "system",
    title: delta > 0 ? "Seller score improved" : "Seller score updated",
    subtitle: `Your seller score ${direction} to ${input.scoreAfter} (${SELLER_LEVEL_LABELS[input.level]}). ${input.reason}`,
    detail: "Open Seller Performance to review your reputation progress.",
    href: "/seller/performance",
  });
}

export async function notifySellerLevelUp(input: {
  userId: string;
  level: SellerLevel;
}): Promise<void> {
  await dispatchNotification({
    userId: input.userId,
    type: "system",
    title: "Congratulations!",
    subtitle: `You reached ${SELLER_LEVEL_LABELS[input.level]}.`,
    detail: "Your marketplace reputation level was upgraded automatically.",
    href: "/seller/performance",
  });
}

export async function notifyAchievementUnlocked(input: {
  userId: string;
  achievementLabel: string;
}): Promise<void> {
  await dispatchNotification({
    userId: input.userId,
    type: "system",
    title: "Achievement unlocked",
    subtitle: `You earned the ${input.achievementLabel} badge.`,
    detail: "Buyers can now see this badge on your profile.",
    href: "/seller/performance",
  });
}

export async function notifySellerPerformanceWarning(input: {
  userId: string;
  message: string;
}): Promise<void> {
  await dispatchNotification({
    userId: input.userId,
    type: "system",
    title: "Seller performance warning",
    subtitle: input.message,
    detail: "Improve your metrics to protect your seller level.",
    href: "/seller/performance",
  });
}
