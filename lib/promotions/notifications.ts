import { dispatchNotification } from "@/lib/notifications/dispatch";
import type { AdminPromotionAction } from "@/lib/promotions/canonical-engine";

export type PromotionActivationKind = "bump" | "store_featured" | "boost_package" | "feature";

function formatExpiresDate(endsAt: string | Date): string {
  const date = endsAt instanceof Date ? endsAt : new Date(endsAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function resolveActivationCopy(input: {
  kind: PromotionActivationKind;
  durationLabel: string;
  endsAt?: string | null;
}): { title: string; subtitle: string; detail: string } {
  const duration = input.durationLabel.replace(/^Expires in:\s*/i, "").trim() || "7 Days";
  const expires = input.endsAt ? formatExpiresDate(input.endsAt) : "";

  if (input.kind === "store_featured") {
    const detail = [
      "Store Showcase has been activated successfully.",
      `Duration: ${duration}`,
      expires ? `Expires: ${expires}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    return {
      title: "Promotion activated.",
      subtitle: "Store Showcase has been activated successfully.",
      detail,
    };
  }

  if (input.kind === "boost_package") {
    return {
      title: "Boost Package activated successfully.",
      subtitle: "Your promotion is now live.",
      detail: `Your promotion is now live.\nDuration: ${duration}.`,
    };
  }

  // bump + feature
  return {
    title: "Bump Listing activated successfully.",
    subtitle: "Your listing visibility has been increased.",
    detail: `Your listing visibility has been increased.\nDuration: ${duration}.`,
  };
}

/** Phone / in-app push after payment success — timer started. */
export async function notifyPromotionActivated(input: {
  userId: string;
  kind: PromotionActivationKind;
  durationLabel: string;
  endsAt?: string | null;
}): Promise<void> {
  const copy = resolveActivationCopy(input);
  try {
    await dispatchNotification({
      userId: input.userId,
      type: "payment",
      title: copy.title,
      subtitle: copy.subtitle,
      href: "/promote",
      detail: copy.detail,
      priority: "high",
    });
  } catch {
    try {
      const { createNotification } = await import("@/lib/notifications/create");
      await createNotification({
        userId: input.userId,
        type: "payment",
        title: copy.title,
        subtitle: copy.subtitle,
        href: "/promote",
        detail: copy.detail,
      });
    } catch {
      // Fail closed — activation already succeeded; notification is best-effort.
    }
  }
}

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
    href: "/promote",
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

export { resolveActivationCopy, formatExpiresDate };
