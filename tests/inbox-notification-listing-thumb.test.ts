import { describe, expect, it } from "vitest";
import {
  buildInboxListingImageIndex,
  notificationPrefersListingThumbnail,
  resolveNotificationListingImageSrc,
} from "@/lib/inbox/notification-listing-thumb";
import type { Conversation } from "@/lib/messages/types";
import type { Notification } from "@/lib/notifications/types";

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

describe("Inbox notification listing thumbnails", () => {
  it("prefers listing thumb for commerce types", () => {
    expect(notificationPrefersListingThumbnail(base({ type: "order", title: "New order" }))).toBe(
      true,
    );
    expect(
      notificationPrefersListingThumbnail(base({ type: "payment", title: "Funds pending" })),
    ).toBe(true);
    expect(notificationPrefersListingThumbnail(base({ type: "offer", title: "Offer received" }))).toBe(
      true,
    );
    expect(notificationPrefersListingThumbnail(base({ type: "review", title: "Review received" }))).toBe(
      true,
    );
    expect(
      notificationPrefersListingThumbnail(base({ type: "price_reduced", title: "Price drop" })),
    ).toBe(true);
    expect(
      notificationPrefersListingThumbnail(
        base({ type: "saved_item_sold", title: "Favourite item sold" }),
      ),
    ).toBe(true);
  });

  it("keeps coloured icons for non-listing system notices", () => {
    expect(
      notificationPrefersListingThumbnail(base({ type: "system", title: "Trust score updated" })),
    ).toBe(false);
    expect(
      notificationPrefersListingThumbnail(base({ type: "system", title: "Welcome to ROVEXO" })),
    ).toBe(false);
    expect(
      notificationPrefersListingThumbnail(
        base({ type: "system", title: "Account verification complete" }),
      ),
    ).toBe(false);
  });

  it("resolves avatarUrl first (API-joined primary listing image)", () => {
    const src = resolveNotificationListingImageSrc(
      base({
        type: "order",
        title: "New order",
        avatarUrl: "https://cdn.example.com/cover.jpg",
        href: "/listing/iphone",
      }),
      new Map([["iphone", "https://cdn.example.com/from-messages.jpg"]]),
    );
    expect(src).toBe("https://cdn.example.com/cover.jpg");
  });

  it("joins Messages listing images in memory when avatarUrl missing", () => {
    const conversations = [
      {
        id: "c1",
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
      },
    ] as Conversation[];

    const index = buildInboxListingImageIndex(conversations);
    const src = resolveNotificationListingImageSrc(
      base({
        type: "offer",
        title: "Offer received",
        href: "/listing/nike-air",
        avatarUrl: null,
      }),
      index,
    );
    expect(src).toBe("https://cdn.example.com/nike.jpg");
  });

  it("returns null when no image exists (SafeImage placeholder path)", () => {
    expect(
      resolveNotificationListingImageSrc(
        base({ type: "order", title: "New order", href: "/inbox?order=o1" }),
        new Map(),
      ),
    ).toBeNull();
  });
});
