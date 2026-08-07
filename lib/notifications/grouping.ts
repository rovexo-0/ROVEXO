import type { PushPriority } from "@/lib/push/vapid";

export function buildNotificationGroupKey(input: {
  userId: string;
  type: string;
  href?: string;
}): string {
  const hrefPart = input.href?.split("?")[0] ?? "general";
  return `${input.userId}:${input.type}:${hrefPart}`;
}

export function resolveNotificationPriority(eventType: string): PushPriority {
  if (eventType === "admin_announcement" || eventType === "emergency") return "emergency";
  if (
    eventType === "new_order" ||
    eventType === "payment_received" ||
    eventType === "new_message" ||
    // P0 Lock Screen: offer lifecycle must be user-visible (Apple forbids silent-only Web Push).
    eventType === "new_offer" ||
    eventType === "offer_accepted" ||
    eventType === "offer_declined" ||
    eventType === "offer_cancelled" ||
    eventType === "offer_expired" ||
    eventType === "seller_offer_accepted" ||
    eventType === "seller_offer_declined" ||
    eventType === "seller_offer_expired" ||
    eventType === "order_shipped" ||
    eventType === "order_delivered" ||
    eventType === "order_confirmed" ||
    eventType === "review_received"
  ) {
    return "high";
  }
  if (eventType === "marketing" || eventType === "promotion") return "low";
  return "normal";
}

/** Visible OS/Lock Screen push (not badge-only silent sync). */
export function shouldSendForegroundPush(priority: PushPriority): boolean {
  return priority === "high" || priority === "emergency";
}
