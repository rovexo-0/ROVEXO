import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  CANONICAL_NOTIFICATION_CATALOG,
  getCanonicalNotification,
  listCanonicalKindsByAudience,
  resolveCanonicalNotificationHref,
} from "@/lib/notifications/catalog";
import {
  NOTIFICATION_USER_CONTROLS,
  patchForUserControl,
  readUserControl,
} from "@/lib/notifications/controls";
import {
  NOTIFICATIONS_MODULE_STATUS,
  NOTIFICATIONS_MODULE_VERSION,
  NOTIFICATIONS_ROUTES,
} from "@/lib/notifications/canonical";
import { resolveSmartNotificationHref } from "@/lib/notifications/routing";
import { buildNotificationGroupKey } from "@/lib/notifications/grouping";
import type { NotificationSettings } from "@/lib/notifications/types";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const baseSettings: NotificationSettings = {
  pushEnabled: true,
  browserPush: true,
  messages: true,
  orders: true,
  offers: true,
  reviews: true,
  promotions: false,
  marketing: false,
  system: true,
  emailMessages: true,
  emailOrders: true,
  emailPromotions: false,
  emailMarketing: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  sound: true,
  vibration: true,
};

describe("Notifications canonical v1.0", () => {
  it("locks module markers", () => {
    expect(NOTIFICATIONS_MODULE_STATUS).toBe("CANONICAL_v1.0");
    expect(NOTIFICATIONS_MODULE_VERSION).toBe("1.0");
    expect(NOTIFICATIONS_ROUTES.hub).toBe("/inbox?tab=notifications");
    expect(NOTIFICATIONS_ROUTES.settings).toBe("/notifications/settings");
  });

  it("ships complete buyer / seller / marketplace catalog", () => {
    expect(listCanonicalKindsByAudience("buyer").length).toBe(12);
    expect(listCanonicalKindsByAudience("seller").length).toBe(11);
    expect(listCanonicalKindsByAudience("marketplace").length).toBe(7);
    expect(CANONICAL_NOTIFICATION_CATALOG.length).toBe(30);

    for (const entry of CANONICAL_NOTIFICATION_CATALOG) {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.actionLabel.length).toBeGreaterThan(0);
      expect(entry.status.length).toBeGreaterThan(0);
      expect(entry.channels.length).toBeGreaterThan(0);
    }
  });

  it("resolves navigation actions for core examples", () => {
    expect(
      resolveCanonicalNotificationHref("seller.new_order", { orderId: "o1" }),
    ).toBe("/orders/o1");
    expect(
      resolveCanonicalNotificationHref("buyer.tracking_updated", { orderId: "o2" }),
    ).toBe("/orders/o2/tracking");
    expect(
      resolveCanonicalNotificationHref("buyer.offer_accepted", { offerId: "off1" }),
    ).toContain("/checkout?offerId=off1");
    expect(
      resolveCanonicalNotificationHref("buyer.offer_accepted", {
        offerId: "off1",
        productSlug: "vintage-jacket",
      }),
    ).toBe("/checkout/vintage-jacket?offerId=off1");
    expect(
      resolveCanonicalNotificationHref("seller.new_message", { conversationId: "c1" }),
    ).toBe("/inbox/conversation/c1");

    expect(resolveSmartNotificationHref("order_shipped", { orderId: "o9" })).toBe(
      "/orders/o9/tracking",
    );
    expect(getCanonicalNotification("marketplace.security_alert").control).toBe("security");
  });

  it("exposes the six canonical user controls", () => {
    expect(NOTIFICATION_USER_CONTROLS.map((item) => item.id)).toEqual([
      "push",
      "email",
      "orders",
      "offers",
      "marketing",
      "security",
    ]);

    expect(readUserControl(baseSettings, "push")).toBe(true);
    expect(readUserControl(baseSettings, "email")).toBe(true);
    expect(readUserControl(baseSettings, "marketing")).toBe(false);

    expect(patchForUserControl("email", false)).toEqual({
      emailMessages: false,
      emailOrders: false,
      emailPromotions: false,
      emailMarketing: false,
    });
    expect(patchForUserControl("security", false)).toEqual({ system: false });
  });

  it("uses idempotent grouping keys for zero-duplicate smart refresh", () => {
    const a = buildNotificationGroupKey({
      userId: "u1",
      type: "order",
      href: "/orders/1?view=tracking",
    });
    const b = buildNotificationGroupKey({
      userId: "u1",
      type: "order",
      href: "/orders/1",
    });
    expect(a).toBe("u1:order:/orders/1");
    expect(b).toBe("u1:order:/orders/1");
  });

  it("keeps canonical UI surfaces and empty states", () => {
    const inbox = readSource("features/notifications/components/NotificationsInboxV1.tsx");
    const empty = readSource("features/notifications/components/NotificationsEmptyState.tsx");
    const settings = readSource("features/notifications/components/NotificationSettingsPage.tsx");
    const page = readSource("features/notifications/components/NotificationsPage.tsx");
    const css = readSource("styles/rovexo/notifications-v1.css");
    const route = readSource("app/notifications/page.tsx");

    expect(inbox).toContain('data-notifications-version="v1.0"');
    expect(inbox).toContain('data-notifications-canonical="v1.0"');
    expect(inbox).toContain("Mark all read");
    expect(inbox).toContain("Load more");
    expect(inbox).toContain("Delete");
    expect(empty).toContain("No Notifications Yet");
    expect(empty).toContain("No Order Notifications");
    expect(settings).toContain("NOTIFICATION_USER_CONTROLS");
    expect(page).toContain("NotificationsInboxV1");
    expect(css).toContain(".notif-v1");
    expect(route).toContain("redirect");
  });

  it("documents the master specification", () => {
    const spec = readSource("docs/modules/notifications/MASTER_SPECIFICATION.md");
    expect(spec).toContain("CANONICAL_v1.0");
    expect(spec).toContain("Open tracking page");
    expect(spec).toContain("Open checkout");
  });
});
