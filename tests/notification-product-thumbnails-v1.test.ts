import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildInboxListingImageIndex,
  extractConversationIdFromNotificationHref,
  notificationPrefersListingThumbnail,
  resolveNotificationListingImageSrc,
} from "@/lib/inbox/notification-listing-thumb";
import { resolveInboxNotificationAvatar } from "@/lib/inbox/official-rovexo-avatar";
import type { Conversation } from "@/lib/messages/types";
import type { Notification } from "@/lib/notifications/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function base(partial: Partial<Notification>): Notification {
  return {
    id: "n1",
    type: "system",
    title: "Notice",
    subtitle: "Detail",
    createdAt: new Date().toISOString(),
    read: false,
    href: "/inbox",
    icon: "system",
    ...partial,
  };
}

function sampleConversation(): Conversation {
  return {
    id: "conv-abc",
    product: {
      id: "p1",
      slug: "nike-air",
      title: "Nike Air Max",
      price: 90,
      condition: "New",
      imageUrl: "https://cdn.example.com/nike.jpg",
      status: "published",
      listingType: "fixed",
      acceptOffers: true,
    },
    participant: {
      id: "u1",
      name: "Seller",
      role: "seller",
      online: false,
    },
    lastMessage: "Hi",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    pinned: false,
    archived: false,
    muted: false,
    blocked: false,
    messages: [],
  };
}

describe("COD SÂNGE — Notification product thumbnails", () => {
  const index = buildInboxListingImageIndex([sampleConversation()]);

  it("message notification resolves product thumbnail via conversation href", () => {
    const notification = base({
      type: "message",
      title: "New message",
      href: "/inbox/conversation/conv-abc",
      avatarUrl: null,
    });
    expect(notificationPrefersListingThumbnail(notification)).toBe(true);
    expect(extractConversationIdFromNotificationHref(notification.href)).toBe("conv-abc");
    const src = resolveNotificationListingImageSrc(notification, index);
    expect(src).toBe("https://cdn.example.com/nike.jpg");
    expect(resolveInboxNotificationAvatar(notification, src)).toEqual({
      kind: "listing",
      src: "https://cdn.example.com/nike.jpg",
    });
  });

  it("offer notification resolves product thumbnail", () => {
    const notification = base({
      type: "offer",
      title: "Offer received",
      href: "/inbox/conversation/conv-abc?offerId=o1",
      avatarUrl: null,
    });
    const src = resolveNotificationListingImageSrc(notification, index);
    expect(src).toBe("https://cdn.example.com/nike.jpg");
    expect(resolveInboxNotificationAvatar(notification, src).kind).toBe("listing");
  });

  it("counter offer resolves product thumbnail (not bell / RX)", () => {
    const notification = base({
      type: "offer",
      title: "Counter offer",
      subtitle: "Counter offer £4.50",
      href: "/inbox/conversation/conv-abc?offerId=c1&focus=counter",
      avatarUrl: null,
    });
    expect(notificationPrefersListingThumbnail(notification)).toBe(true);
    const src = resolveNotificationListingImageSrc(notification, index);
    expect(src).toBe("https://cdn.example.com/nike.jpg");
    const avatar = resolveInboxNotificationAvatar(notification, src);
    expect(avatar.kind).toBe("listing");
    expect(avatar.src).toBe("https://cdn.example.com/nike.jpg");
  });

  it("bundle offer / bundle counter offer resolve product thumbnail", () => {
    const bundle = base({
      type: "offer",
      title: "Bundle offer",
      href: "/inbox/conversation/conv-abc",
      avatarUrl: null,
    });
    const counter = base({
      type: "offer",
      title: "Bundle counter offer",
      href: "/inbox/conversation/conv-abc",
      avatarUrl: null,
    });
    expect(notificationPrefersListingThumbnail(bundle)).toBe(true);
    expect(notificationPrefersListingThumbnail(counter)).toBe(true);
    expect(resolveNotificationListingImageSrc(bundle, index)).toBe(
      "https://cdn.example.com/nike.jpg",
    );
    expect(resolveNotificationListingImageSrc(counter, index)).toBe(
      "https://cdn.example.com/nike.jpg",
    );
  });

  it("notification without listing context uses existing fallback icon path", () => {
    const notification = base({
      type: "system",
      title: "Welcome to ROVEXO",
      href: "/account/settings",
    });
    expect(notificationPrefersListingThumbnail(notification)).toBe(false);
    expect(resolveInboxNotificationAvatar(notification, null).kind).toBe("official-rx");
  });

  it("avatarUrl from API enrich wins (actual image URL rendered)", () => {
    const notification = base({
      type: "message",
      title: "New message",
      href: "/inbox/conversation/conv-abc",
      avatarUrl: "https://cdn.example.com/from-api.jpg",
    });
    const src = resolveNotificationListingImageSrc(notification, index);
    expect(src).toBe("https://cdn.example.com/from-api.jpg");
    expect(resolveInboxNotificationAvatar(notification, src).src).toBe(
      "https://cdn.example.com/from-api.jpg",
    );
  });

  it("thumbnail does not change notification destination / unread", () => {
    const hub = readSource("features/inbox/components/InboxPage.tsx");
    expect(hub).toContain("resolveNotificationOpenHrefSync");
    expect(hub).toContain("handleNotificationDeepLinkClick");
    expect(hub).toContain("resolveNotificationListingImageSrc");
    expect(hub).toContain("data-inbox-notif-thumb=\"listing\"");
    expect(hub).not.toMatch(/listingImageSrc[\s\S]{0,80}href\s*=/);
  });

  it("enrich batches conversation product images (no N+1)", () => {
    const enrich = readSource("lib/notifications/enrich-product-media.ts");
    expect(enrich).toContain("extractConversationIdFromNotificationHref");
    expect(enrich).toContain(".in(\"id\", [...conversationIds])");
    expect(enrich).not.toContain("for (const item of needs) {\n    await supabase");
    expect(enrich).not.toContain("notification_product_images");
  });

  it("no duplicate listing/image data source / engines frozen", () => {
    const thumb = readSource("lib/inbox/notification-listing-thumb.ts");
    expect(thumb).toContain("Never triggers per-notification network requests");
    expect(thumb).not.toContain("createListingThumbnail");
    const deep = readSource("lib/notifications/notification-deep-link-v1.ts");
    expect(deep).toContain("NOTIFICATION_DEEP_LINK_VERSION");
    const counter = readSource("lib/offers/counter-offer-engine-v1.ts");
    expect(counter).not.toContain("resolveNotificationListingImageSrc");
  });
});
