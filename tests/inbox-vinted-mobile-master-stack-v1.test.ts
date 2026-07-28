import { describe, expect, it } from "vitest";
import { formatInboxRelativeTime } from "@/lib/messages/utils";
import { formatNotificationTime, resolveInboxNotificationDisplay } from "@/lib/notifications/utils";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Inbox Vinted mobile Master Stack — conversation cards", () => {
  it("formats relative list times like Vinted", () => {
    const now = Date.parse("2026-07-23T12:00:00.000Z");
    expect(formatInboxRelativeTime(new Date(now - 2 * 60_000).toISOString(), now)).toBe(
      "2 min ago",
    );
    expect(formatInboxRelativeTime(new Date(now - 60 * 60_000).toISOString(), now)).toBe(
      "1 hour ago",
    );
    expect(formatInboxRelativeTime(new Date(now - 14 * 60 * 60_000).toISOString(), now)).toBe(
      "14 hours ago",
    );
    expect(formatInboxRelativeTime(new Date(now - 24 * 60 * 60_000).toISOString(), now)).toBe(
      "Yesterday",
    );
  });

  it("keeps Master Stack card fields in InboxPage", () => {
    const page = readSource("features/inbox/components/InboxPage.tsx");
    const css = readSource("styles/rovexo/inbox-hub-v1.css");
    expect(page).not.toContain("inbox-hub__avatar-face");
    expect(page).not.toContain("inbox-hub__avatar");
    expect(page).toContain("inbox-hub__party-name");
    expect(page).toContain("inbox-hub__product-title");
    expect(page).toContain("inbox-hub__thumb");
    expect(page).toContain("sizes=\"56px\"");
    expect(css).toContain("--inbox-thumb: 56px");
    expect(css).toContain("grid-template-columns: var(--inbox-thumb) minmax(0, 1fr) auto");
    expect(css).toContain("border-bottom: 1px solid var(--inbox-border)");
  });
});

describe("Inbox Vinted UK Notifications Master Stack", () => {
  it("formats notification relative times", () => {
    const now = Date.parse("2026-07-23T12:00:00.000Z");
    expect(formatNotificationTime(new Date(now - 30_000).toISOString(), now)).toBe("now");
    expect(formatNotificationTime(new Date(now - 5 * 60_000).toISOString(), now)).toBe(
      "5 min ago",
    );
    expect(formatNotificationTime(new Date(now - 60 * 60_000).toISOString(), now)).toBe(
      "1 hour ago",
    );
    expect(formatNotificationTime(new Date(now - 24 * 60 * 60_000).toISOString(), now)).toBe(
      "yesterday",
    );
    expect(formatNotificationTime(new Date(now - 2 * 24 * 60 * 60_000).toISOString(), now)).toBe(
      "2 days ago",
    );
    expect(formatNotificationTime(new Date(now - 7 * 24 * 60 * 60_000).toISOString(), now)).toBe(
      "1 week ago",
    );
  });

  it("compacts notification copy to product · event · short description", () => {
    expect(
      resolveInboxNotificationDisplay({
        id: "1",
        type: "offer",
        title: "Offer accepted",
        subtitle: "Buyer offered £33.00",
        detail: "Camping Tent",
        avatarName: "Family Tent",
        createdAt: new Date().toISOString(),
        read: false,
        href: "/checkout/family-tent",
        icon: "offer",
      }),
    ).toEqual({
      productTitle: "Family Tent",
      eventTitle: "Offer accepted",
      description: "Buyer offered £33.00",
      title: "Offer accepted",
    });

    expect(
      resolveInboxNotificationDisplay({
        id: "2",
        type: "order",
        title: "Order paid",
        subtitle: "£35.00",
        avatarName: "Family Tent",
        createdAt: new Date().toISOString(),
        read: false,
        href: "/orders/abc",
        icon: "order",
      }),
    ).toEqual({
      productTitle: "Family Tent",
      eventTitle: "Order paid",
      description: "£35.00",
      title: "Order paid",
    });

    expect(
      resolveInboxNotificationDisplay({
        id: "3",
        type: "message",
        title: "New message",
        subtitle: "Hdjdhh",
        detail: "Camping Tent",
        avatarName: "Camping Tent",
        createdAt: new Date().toISOString(),
        read: false,
        href: "/inbox",
        icon: "message",
      }),
    ).toEqual({
      productTitle: "Camping Tent",
      eventTitle: "New message",
      description: "Hdjdhh",
      title: "New message",
    });

    expect(
      resolveInboxNotificationDisplay({
        id: "4",
        type: "system",
        title: "Trust score updated",
        subtitle: "Your trust score increased to 55 (Silver). Recalculated.",
        detail: "Visit Trust Center to see your progress.",
        createdAt: new Date().toISOString(),
        read: true,
        href: "/trust",
        icon: "system",
      }),
    ).toEqual({
      productTitle: "",
      eventTitle: "Trust score updated",
      description: "Silver Member",
      title: "Trust score updated",
    });
  });

  it("locks premium colored notification rows (Profile icon family)", () => {
    const page = readSource("features/inbox/components/InboxPage.tsx");
    const css = readSource("styles/rovexo/inbox-hub-v1.css");
    const icons = readSource("lib/inbox/notification-row-icon.ts");
    const thumbs = readSource("lib/inbox/notification-listing-thumb.ts");
    const official = readSource("lib/inbox/official-rovexo-avatar.ts");
    const brand = readSource("components/brand/RovexoLogo.tsx");
    expect(page).toContain("CanonicalMenuRow");
    expect(page).toContain("resolveInboxNotificationRowIcon");
    expect(page).toContain("inbox-hub__notif-icon");
    expect(page).toContain("inbox-hub__notif-thumb");
    expect(page).toContain("RovexoAppIconMark");
    expect(page).toContain("inbox-hub__rx-mark");
    expect(page).not.toContain("EARLIER");
    expect(page).not.toContain("inbox-hub__notif-card");
    expect(icons).toContain("funds pending");
    expect(icons).toContain("#22C55E");
    expect(icons).toContain("#F59E0B");
    expect(thumbs).toContain("resolveNotificationListingImageSrc");
    expect(official).toContain("resolveInboxMessageAvatar");
    expect(brand).toContain("OFFICIAL_BRAND_APP_ICON");
    expect(brand).toContain("RovexoAppIconMark");
    expect(css).toContain(".inbox-hub__notif-icon");
    expect(css).toContain(".inbox-hub__notif-thumb");
    expect(css).toContain(".inbox-hub__rx-mark");
    expect(css).toContain("border-radius: 12px");
    expect(css).toContain("--inbox-tab-list-gap: 8px");
    expect(css).toContain("--inbox-tab-underline-gap: 6px");
    expect(css).toContain("--inbox-section-row-gap: 8px");
    expect(css).toContain("padding-top: 12px !important");
  });
});
