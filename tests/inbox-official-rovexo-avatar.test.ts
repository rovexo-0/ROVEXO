import { describe, expect, it } from "vitest";
import {
  isOfficialRovexoNotification,
  isOfficialRovexoParticipant,
  resolveInboxMessageAvatar,
  resolveInboxNotificationAvatar,
} from "@/lib/inbox/official-rovexo-avatar";
import type { Conversation } from "@/lib/messages/types";
import type { Notification } from "@/lib/notifications/types";

function notification(partial: Partial<Notification>): Notification {
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

function conversation(partial: Partial<Conversation> & { participantName?: string }): Conversation {
  const { participantName, ...rest } = partial;
  return {
    id: "c1",
    participant: {
      id: "u1",
      name: participantName ?? "Alice",
      role: "seller",
      online: false,
      avatarUrl: "https://cdn.example.com/user.jpg",
    },
    product: {
      id: "p1",
      slug: "item",
      title: "Item",
      price: 10,
      condition: "New",
      imageUrl: "https://cdn.example.com/item.jpg",
      status: "published",
      listingType: "fixed",
      acceptOffers: true,
    },
    lastMessage: "Hi",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    pinned: false,
    archived: false,
    muted: false,
    blocked: false,
    messages: [],
    ...rest,
  };
}

describe("Official ROVEXO Inbox avatar", () => {
  it("detects official ROVEXO participants", () => {
    expect(isOfficialRovexoParticipant({ id: "x", name: "ROVEXO LIVE SELLER" })).toBe(true);
    expect(isOfficialRovexoParticipant({ id: "x", name: "ROVEXO SYSTEM" })).toBe(true);
    expect(isOfficialRovexoParticipant({ id: "x", name: "ROVEXO SUPPORT" })).toBe(true);
    expect(isOfficialRovexoParticipant({ id: "rovexo_live_buyer", name: "Buyer" })).toBe(true);
    expect(isOfficialRovexoParticipant({ id: "x", name: "Alice" })).toBe(false);
  });

  it("messages: official → RX even when listing image exists", () => {
    expect(
      resolveInboxMessageAvatar(conversation({ participantName: "ROVEXO LIVE BUYER" })).kind,
    ).toBe("official-rx");
  });

  it("messages: listing photo for user conversations with product image", () => {
    expect(resolveInboxMessageAvatar(conversation({})).kind).toBe("listing");
  });

  it("messages: user avatar when no listing image", () => {
    const result = resolveInboxMessageAvatar(
      conversation({
        product: {
          id: "p1",
          slug: "item",
          title: "Item",
          price: 10,
          condition: "New",
          imageUrl: "",
          status: "published",
          listingType: "fixed",
          acceptOffers: true,
        },
      }),
    );
    expect(result.kind).toBe("user");
    expect(result.src).toBe("https://cdn.example.com/user.jpg");
  });

  it("notifications: official platform events → RX", () => {
    expect(isOfficialRovexoNotification(notification({ title: "New order", type: "order" }))).toBe(
      true,
    );
    expect(
      isOfficialRovexoNotification(notification({ title: "Payment received", type: "payment" })),
    ).toBe(true);
    expect(
      isOfficialRovexoNotification(notification({ title: "Trust score updated", type: "system" })),
    ).toBe(true);
    expect(
      resolveInboxNotificationAvatar(
        notification({ title: "New order", type: "order" }),
        "https://cdn.example.com/item.jpg",
      ).kind,
    ).toBe("official-rx");
  });

  it("notifications: offers keep listing thumb when not official", () => {
    expect(
      resolveInboxNotificationAvatar(
        notification({ title: "Offer received", type: "offer" }),
        "https://cdn.example.com/item.jpg",
      ).kind,
    ).toBe("listing");
  });
});
