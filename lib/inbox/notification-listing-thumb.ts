/**
 * Inbox Notifications — listing thumbnail SSOT (UI only).
 * Uses already-joined notification.avatarUrl + in-memory Messages product images.
 * Never triggers per-notification network requests.
 */

import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import type { Conversation } from "@/lib/messages/types";
import type { Notification } from "@/lib/notifications/types";

/**
 * Commerce / listing-related notifications show the product image.
 * Trust / verification / welcome / system stay on coloured icons.
 */
export function notificationPrefersListingThumbnail(notification: Notification): boolean {
  switch (notification.type) {
    case "message":
    case "order":
    case "offer":
    case "payment":
    case "review":
    case "saved_item_sold":
    case "price_reduced":
    case "saved_search_match":
      return true;
    default:
      break;
  }

  const title = notification.title.trim().toLowerCase();
  return (
    title.includes("new message") ||
    title.includes("new order") ||
    title.includes("funds pending") ||
    title.includes("payment received") ||
    title.includes("payment available") ||
    title.includes("funds are now available") ||
    title.includes("order shipped") ||
    title.includes("order delivered") ||
    title.includes("offer received") ||
    title.includes("counter offer") ||
    title.includes("bundle offer") ||
    title.includes("bundle counter") ||
    title.includes("offer accepted") ||
    title.includes("offer declined") ||
    title.includes("price drop") ||
    title.includes("price reduced") ||
    title.includes("favourite item sold") ||
    title.includes("favorite item sold") ||
    title.includes("review received") ||
    title.includes("shipping label") ||
    title.includes("label generated") ||
    title.includes("tracking updated") ||
    title.includes("tracking")
  );
}

/** Extract conversation id from Inbox Conversation Hub hrefs. */
export function extractConversationIdFromNotificationHref(href: string): string | null {
  const match = (href ?? "").match(/\/inbox\/conversation\/([^/?#]+)/i);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Build a key → image map from already-loaded Inbox Messages (zero extra fetches). */
export function buildInboxListingImageIndex(
  conversations: readonly Conversation[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const conversation of conversations) {
    const url = conversation.product.imageUrl?.trim() ?? "";
    if (!isRenderableImageSrc(url)) continue;
    if (conversation.id) map.set(conversation.id, url);
    if (conversation.product.id) map.set(conversation.product.id, url);
    if (conversation.product.slug) map.set(conversation.product.slug, url);
    const title = conversation.product.title?.trim();
    if (title) map.set(`title:${title.toLowerCase()}`, url);
  }
  return map;
}

/**
 * Primary listing image for a notification.
 * Priority: notification.avatarUrl (API-joined cover / images[0] / order image)
 * → in-memory Messages listing index (incl. conversationId) → null (SafeImage placeholder).
 */
export function resolveNotificationListingImageSrc(
  notification: Notification,
  listingImageByKey?: ReadonlyMap<string, string>,
): string | null {
  if (isRenderableImageSrc(notification.avatarUrl)) {
    return notification.avatarUrl.trim();
  }

  if (!listingImageByKey?.size) return null;

  const keys: string[] = [];
  const conversationId = extractConversationIdFromNotificationHref(notification.href);
  if (conversationId) keys.push(conversationId);
  const listingMatch = notification.href.match(/\/listing\/([^/?#]+)/);
  if (listingMatch?.[1]) keys.push(decodeURIComponent(listingMatch[1]));
  const checkoutMatch = notification.href.match(/\/checkout\/([^/?#]+)/);
  if (checkoutMatch?.[1]) keys.push(decodeURIComponent(checkoutMatch[1]));
  const highlightMatch = notification.href.match(/[?&]highlight=([^&#]+)/);
  if (highlightMatch?.[1]) keys.push(decodeURIComponent(highlightMatch[1]));

  for (const key of keys) {
    const hit = listingImageByKey.get(key);
    if (hit && isRenderableImageSrc(hit)) return hit;
  }

  const avatarName = notification.avatarName?.trim();
  if (avatarName) {
    const byTitle = listingImageByKey.get(`title:${avatarName.toLowerCase()}`);
    if (byTitle && isRenderableImageSrc(byTitle)) return byTitle;
  }

  return null;
}
