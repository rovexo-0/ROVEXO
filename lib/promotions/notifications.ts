import { dispatchNotification } from "@/lib/notifications/dispatch";
import type { AdminPromotionAction } from "@/lib/promotions/canonical-engine";

const ACTION_TITLES: Partial<Record<AdminPromotionAction, string>> = {
  activate: "Promotion activated",
  schedule: "Promotion scheduled",
  pause: "Promotion paused",
  resume: "Promotion resumed",
  extend: "Promotion extended",
  expire: "Promotion expired",
  revoke: "Promotion revoked",
};

export async function notifyPromotionLifecycle(input: {
  userId: string;
  action: AdminPromotionAction | "expiring_soon" | "granted";
  promotionLabel: string;
  detail?: string;
}): Promise<void> {
  const title =
    input.action === "expiring_soon"
      ? "Promotion expires in 24 hours"
      : input.action === "granted"
        ? "Promotion granted"
        : ACTION_TITLES[input.action] ?? "Promotion update";

  const subtitle =
    input.detail ??
    (input.action === "granted"
      ? `ROVEXO granted ${input.promotionLabel}.`
      : `Your ${input.promotionLabel} promotion was updated.`);

  await dispatchNotification({
    userId: input.userId,
    type: input.action === "expire" || input.action === "expiring_soon" ? "promotion_expired" : "system",
    title,
    subtitle,
    href: "/account/promotion-tools",
    detail: subtitle,
  });
}

export async function notifyPromotionExpiringSoon(input: {
  userId: string;
  promotionLabel: string;
  endsAt: string;
}): Promise<void> {
  await notifyPromotionLifecycle({
    userId: input.userId,
    action: "expiring_soon",
    promotionLabel: input.promotionLabel,
    detail: `${input.promotionLabel} expires on ${new Date(input.endsAt).toLocaleDateString("en-GB")}.`,
  });
}
