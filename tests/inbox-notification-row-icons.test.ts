import { describe, expect, it } from "vitest";
import { resolveInboxNotificationRowIcon } from "@/lib/inbox/notification-row-icon";
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

describe("Inbox notification row icons — Owner colored family", () => {
  it("maps Funds pending to green wallet", () => {
    expect(resolveInboxNotificationRowIcon(base({ title: "Funds pending", type: "payment" }))).toEqual(
      { name: "wallet", color: "#22C55E" },
    );
  });

  it("maps New order to amber package", () => {
    expect(resolveInboxNotificationRowIcon(base({ title: "New order", type: "order" }))).toEqual({
      name: "orders",
      color: "#F59E0B",
    });
  });

  it("maps Counter offer to purple returns", () => {
    expect(resolveInboxNotificationRowIcon(base({ title: "Counter offer", type: "offer" }))).toEqual({
      name: "returns",
      color: "#9333EA",
    });
  });

  it("maps Offer received to red product", () => {
    expect(resolveInboxNotificationRowIcon(base({ title: "Offer received", type: "offer" }))).toEqual({
      name: "product",
      color: "#EF4444",
    });
  });

  it("maps shipping titles to truck icon", () => {
    expect(resolveInboxNotificationRowIcon(base({ title: "Order shipped", type: "order" }))).toEqual({
      name: "shipping",
      color: "#EAB308",
    });
  });

  it("maps read notifications to muted check", () => {
    expect(
      resolveInboxNotificationRowIcon(base({ title: "System update", type: "system", read: true })),
    ).toEqual({ name: "verification", color: "#94A3B8" });
  });
});
