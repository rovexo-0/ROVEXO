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
    eventType === "new_message"
  ) {
    return "high";
  }
  if (eventType === "marketing" || eventType === "promotion") return "low";
  return "normal";
}

export function shouldSendForegroundPush(priority: PushPriority): boolean {
  return priority === "high" || priority === "emergency";
}
