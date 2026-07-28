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
    ).toBe("/inbox?order=o1");
    expect(
      resolveCanonicalNotificationHref("buyer.tracking_updated", { orderId: "o2" }),
    ).toBe("/inbox?order=o2&focus=tracking");
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
    expect(
      resolveCanonicalNotificationHref("seller.offer_received", {
        conversationId: "c9",
        offerId: "off9",
      }),
    ).toBe("/inbox/conversation/c9?offerId=off9");

    expect(resolveSmartNotificationHref("order_shipped", { orderId: "o9" })).toBe(
      "/inbox?order=o9&focus=tracking",
    );
    expect(getCanonicalNotification("marketplace.security_alert").control).toBe("security");
  });

  it("recovers legacy /orders detail destinations to the Transaction Hub", async () => {
    const { recoverNotificationHref } = await import("@/lib/notifications/routing");
    expect(recoverNotificationHref("/orders/ord-abc")).toBe("/inbox?order=ord-abc");
    expect(recoverNotificationHref("/orders/ord-abc/tracking")).toBe(
      "/inbox?order=ord-abc&focus=tracking",
    );
    expect(recoverNotificationHref("/seller/orders/ord-abc")).toBe("/inbox?order=ord-abc");
    expect(recoverNotificationHref("/inbox/conversation/c1")).toBe("/inbox/conversation/c1");
  });

  it("never recovers Funds Pending wallet hub links to Balance", async () => {
    const {
      recoverNotificationHref,
      isFundsPendingNotificationFamily,
      isWalletHubNotificationHref,
      extractOrderRefFromNotificationSubtitle,
    } = await import("@/lib/notifications/routing");

    expect(recoverNotificationHref("/wallet")).toBe("/inbox");
    expect(recoverNotificationHref("/balance")).toBe("/inbox");
    expect(recoverNotificationHref("/seller/wallet")).toBe("/inbox");
    expect(recoverNotificationHref("/wallet?order=ord-1")).toBe("/inbox?order=ord-1");
    expect(isWalletHubNotificationHref("/wallet")).toBe(true);
    expect(isWalletHubNotificationHref("/wallet/transactions/t1")).toBe(false);
    expect(isFundsPendingNotificationFamily({ title: "Funds pending" })).toBe(true);
    expect(
      extractOrderRefFromNotificationSubtitle(
        "£12.00 from order #RVX-99 — waiting for successful delivery.",
      ),
    ).toBe("RVX-99");
    /* Withdrawal detail links stay on wallet transactions */
    expect(recoverNotificationHref("/wallet/transactions/tx-1")).toBe(
      "/wallet/transactions/tx-1",
    );
  });

  it("Funds pending emit targets Transaction Conversation, not Wallet", async () => {
    const source = readSource("lib/transaction-hub/seller-wallet-notifications.ts");
    expect(source).toContain('title: "Funds pending"');
    expect(source).toContain("NOTIFICATION_ROUTES.order(input.orderId)");
    expect(source).not.toMatch(
      /title:\s*"Funds pending"[\s\S]{0,400}NOTIFICATION_ROUTES\.wallet\b/,
    );
  });

  it("exposes the canonical Settings v1.0 user controls", () => {
    expect(NOTIFICATION_USER_CONTROLS.map((item) => item.id)).toEqual([
      "orders",
      "inbox",
      "wallet",
      "payments",
      "promotions",
      "reviews",
      "push",
      "email",
    ]);

    expect(readUserControl(baseSettings, "push")).toBe(true);
    expect(readUserControl(baseSettings, "email")).toBe(true);
    expect(readUserControl(baseSettings, "promotions")).toBe(false);
    expect(readUserControl(null, "orders")).toBe(false);

    expect(patchForUserControl("email", false)).toEqual({
      emailMessages: false,
      emailOrders: false,
      emailPromotions: false,
      emailMarketing: false,
    });
    expect(patchForUserControl("payments", true)).toEqual({ offers: true });
    expect(patchForUserControl("reviews", false)).toEqual({ reviews: false });
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
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    const settings = readSource("features/notifications/components/NotificationSettingsPage.tsx");
    const css = readSource("styles/rovexo/inbox-hub-v1.css");
    const route = readSource("app/notifications/page.tsx");

    expect(inbox).toContain("useRealtimeNotifications");
    expect(inbox).toContain("Mark all");
    expect(inbox).toContain("You&apos;re all caught up");
    expect(inbox).toContain("No conversations yet");
    expect(settings).toContain("NOTIFICATION_USER_CONTROLS");
    expect(css).toContain(".inbox-hub");
    expect(route).toContain("redirect");
  });

  it("documents the master specification", () => {
    const spec = readSource("docs/modules/notifications/MASTER_SPECIFICATION.md");
    expect(spec).toContain("CANONICAL_v1.0");
    expect(spec).toContain("Open tracking page");
    expect(spec).toContain("Open checkout");
  });
});
