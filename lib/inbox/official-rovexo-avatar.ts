/**
 * Official ROVEXO Inbox avatar — UI only.
 * Same Level III App Icon as Home header (OFFICIAL_BRAND_APP_ICON).
 *
 * Priority:
 * 1. Official ROVEXO → RX logo
 * 2. Listing-related → listing photo
 * 3. Private user conversation → user avatar
 */

import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import type { Conversation, ConversationParticipant } from "@/lib/messages/types";
import type { Notification } from "@/lib/notifications/types";
import { notificationPrefersListingThumbnail } from "@/lib/inbox/notification-listing-thumb";

const OFFICIAL_NAME_MARKERS = [
  "rovexo live buyer",
  "rovexo live seller",
  "rovexo system",
  "rovexo support",
  "rovexo",
] as const;

const OFFICIAL_USERNAME_MARKERS = [
  "rovexo_live_buyer",
  "rovexo_live_seller",
  "rovexo_system",
  "rovexo_support",
  "rovexo",
] as const;

function normalizeIdentity(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isOfficialRovexoParticipant(
  participant: Pick<ConversationParticipant, "name" | "id"> & { username?: string | null },
): boolean {
  const name = normalizeIdentity(participant.name);
  const username = normalizeIdentity(participant.username);
  const id = normalizeIdentity(participant.id);

  if (OFFICIAL_USERNAME_MARKERS.some((marker) => username === marker || id === marker)) {
    return true;
  }

  if (
    name === "rovexo" ||
    name === "rovexo system" ||
    name === "rovexo support" ||
    name === "rovexo live buyer" ||
    name === "rovexo live seller"
  ) {
    return true;
  }

  return OFFICIAL_NAME_MARKERS.some(
    (marker) => marker !== "rovexo" && (name === marker || name.startsWith(`${marker} `)),
  );
}

/** Platform / marketplace-generated notifications use the RX mark. */
export function isOfficialRovexoNotification(notification: Notification): boolean {
  if (notification.type === "system" || notification.type === "moderation") return true;

  const title = normalizeIdentity(notification.title);
  if (
    title.includes("rovexo live") ||
    title.includes("rovexo system") ||
    title.includes("rovexo support") ||
    title.includes("platform announcement") ||
    title.includes("welcome to rovexo") ||
    title.includes("trust score") ||
    title.includes("account verification") ||
    title.includes("payment confirmed") ||
    title.includes("payment received") ||
    title.includes("payment available") ||
    title.includes("funds pending") ||
    title.includes("funds are now available") ||
    title.includes("new order") ||
    title.includes("order confirmed") ||
    title.includes("order shipped") ||
    title.includes("order delivered") ||
    title.includes("shipping label") ||
    title.includes("label generated") ||
    title.includes("tracking updated") ||
    title.includes("tracking") ||
    title.includes("refund completed") ||
    title.includes("refund") ||
    title.includes("wallet") ||
    title.includes("payout") ||
    title.includes("withdrawal")
  ) {
    return true;
  }

  /* Order / payment platform events — RX. Offers / reviews stay listing thumbs. */
  return notification.type === "order" || notification.type === "payment";
}

export type InboxMessageAvatarKind = "official-rx" | "listing" | "user";

export function resolveInboxMessageAvatar(conversation: Conversation): {
  kind: InboxMessageAvatarKind;
  src: string | null;
} {
  if (isOfficialRovexoParticipant(conversation.participant)) {
    return { kind: "official-rx", src: null };
  }
  if (isRenderableImageSrc(conversation.product.imageUrl)) {
    return { kind: "listing", src: conversation.product.imageUrl.trim() };
  }
  return {
    kind: "user",
    src: isRenderableImageSrc(conversation.participant.avatarUrl)
      ? conversation.participant.avatarUrl.trim()
      : null,
  };
}

export type InboxNotificationAvatarKind = "official-rx" | "listing" | "icon";

export function resolveInboxNotificationAvatar(
  notification: Notification,
  listingImageSrc: string | null,
): { kind: InboxNotificationAvatarKind; src: string | null } {
  if (isOfficialRovexoNotification(notification)) {
    return { kind: "official-rx", src: null };
  }
  if (notificationPrefersListingThumbnail(notification)) {
    return { kind: "listing", src: listingImageSrc };
  }
  return { kind: "icon", src: null };
}
