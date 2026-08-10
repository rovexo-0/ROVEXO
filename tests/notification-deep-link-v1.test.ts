import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildNotificationDeepLinkData,
  fallbackNotificationDeepLinkHref,
  handleNotificationDeepLinkClick,
  isAllowedNotificationDeepLinkHref,
  parseNotificationDeepLinkDestination,
  resolveNotificationDeepLinkHref,
  serializeNotificationDeepLinkHref,
  stashPendingNotificationDeepLink,
  consumePendingNotificationDeepLink,
  PENDING_NOTIFICATION_DEEP_LINK_KEY,
} from "@/lib/notifications/notification-deep-link-v1";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("COD SÂNGE — Notification Deep-Link Engine", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("MESSAGE / OFFER / COUNTER / BUNDLE conversation destinations", () => {
    const message = resolveNotificationDeepLinkHref("/inbox/conversation/abc-123");
    expect(message).toContain("/inbox/conversation/abc-123");
    expect(parseNotificationDeepLinkDestination(message).params?.conversationId).toBe("abc-123");

    const offer = serializeNotificationDeepLinkHref({
      route: "/inbox/conversation/[conversationId]",
      params: { conversationId: "c1", eventId: "offer-1" },
    });
    expect(offer).toContain("/inbox/conversation/c1");
    expect(offer).toContain("eventId=offer-1");

    const bundle = buildNotificationDeepLinkData({
      href: "/inbox/conversation/c2?offerId=bundle-1",
      notificationId: "n1",
      type: "BUNDLE_OFFER",
    });
    expect(bundle.destination.route).toContain("/inbox/conversation/c2");
    expect(bundle.href).toContain("offerId=bundle-1");
    expect(bundle.type).toBe("BUNDLE_OFFER");
  });

  it("WALLET / WITHDRAW destinations use canonical wallet routes", () => {
    expect(isAllowedNotificationDeepLinkHref(WALLET_ROUTES.withdraw)).toBe(true);
    expect(isAllowedNotificationDeepLinkHref(WALLET_ROUTES.hub)).toBe(true);
    expect(isAllowedNotificationDeepLinkHref("/account/wallet")).toBe(true);
    /* Withdraw is never remapped — opens Wallet withdraw. */
    expect(
      serializeNotificationDeepLinkHref({ route: "/account/wallet/withdraw" }),
    ).toBe(WALLET_ROUTES.withdraw);
    expect(resolveNotificationDeepLinkHref(WALLET_ROUTES.withdraw)).toBe(WALLET_ROUTES.withdraw);
    /* Bare wallet hub still follows existing Funds Pending recover → Inbox. */
    expect(resolveNotificationDeepLinkHref(WALLET_ROUTES.hub)).toContain("/inbox");
  });

  it("ORDER / SHIPPING / FOLLOW / REVIEW allowlisted paths", () => {
    expect(isAllowedNotificationDeepLinkHref("/orders")).toBe(true);
    expect(isAllowedNotificationDeepLinkHref("/inbox?order=o1")).toBe(true);
    expect(isAllowedNotificationDeepLinkHref("/inbox/conversation/c1?focus=tracking")).toBe(true);
    expect(isAllowedNotificationDeepLinkHref("/store/seller1")).toBe(true);
    expect(isAllowedNotificationDeepLinkHref("/user/seller1")).toBe(true);
    expect(isAllowedNotificationDeepLinkHref("/account/reviews")).toBe(true);
    expect(fallbackNotificationDeepLinkHref("order")).toBe("/orders");
    expect(fallbackNotificationDeepLinkHref("wallet")).toBe(WALLET_ROUTES.hub);
  });

  it("FAIL-CLOSED: external URL / javascript / protocol injection BLOCKED", () => {
    expect(isAllowedNotificationDeepLinkHref("https://evil.example")).toBe(false);
    expect(isAllowedNotificationDeepLinkHref("javascript:alert(1)")).toBe(false);
    expect(isAllowedNotificationDeepLinkHref("data:text/html,hi")).toBe(false);
    expect(isAllowedNotificationDeepLinkHref("//evil.example")).toBe(false);
    expect(isAllowedNotificationDeepLinkHref("/admin/secret")).toBe(false);
    expect(resolveNotificationDeepLinkHref("https://evil.example")).toContain("/inbox");
  });

  it("Push payload includes destination data (no PII fields)", () => {
    const push = readSource("lib/push/service.ts");
    expect(push).toContain("buildNotificationDeepLinkData");
    expect(push).toContain("destination: deepLink.destination");
    expect(push).toContain("destination: data.destination");
    expect(push).not.toMatch(/data:\s*\{[\s\S]*email/);
    expect(push).not.toMatch(/fullName|full_name|bankAccount|cardNumber/);
  });

  it("SW notificationclick allowlists + forwards destination", () => {
    const sw = readSource("public/sw.js");
    expect(sw).toContain("isAllowedNotificationHref");
    expect(sw).toContain("destination");
    expect(sw).toContain('type: "notification-open"');
    expect(sw).toContain("clients.openWindow");
  });

  it("Auth next preserves query for protected deep-links", () => {
    const mw = readSource("lib/supabase/middleware.ts");
    expect(mw).toContain('sanitizeNextPath(`${pathname}${request.nextUrl.search || ""}`)');
  });

  it("Inbox Notification Center uses same deep-link handler as push", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    const provider = readSource(
      "features/notifications/components/RealtimeNotificationProvider.tsx",
    );
    expect(inbox).toContain("handleNotificationDeepLinkClick");
    expect(inbox).toContain("resolveNotificationDeepLinkHref");
    expect(provider).toContain("handleNotificationDeepLinkClick");
    expect(provider).toContain("consumePendingNotificationDeepLink");
  });

  it("Pending deep-link stash survives hydration (APP CLOSED path)", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        getItem: (k: string) => store.get(k) ?? null,
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
    });

    stashPendingNotificationDeepLink("/inbox/conversation/pending-1");
    expect(store.get(PENDING_NOTIFICATION_DEEP_LINK_KEY)).toContain("pending-1");
    const consumed = consumePendingNotificationDeepLink();
    expect(consumed).toContain("pending-1");
    expect(consumePendingNotificationDeepLink()).toBeNull();
  });

  it("handleNotificationDeepLinkClick marks read then navigates", async () => {
    const navigated: string[] = [];
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await handleNotificationDeepLinkClick({
      href: "/inbox/conversation/c-read",
      notificationId: "notif-1",
      markAsRead: true,
      navigate: (href) => navigated.push(href),
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/notifications");
    expect(navigated[0]).toContain("/inbox/conversation/c-read");
  });

  it("Does not create a second Notification Engine / no polling", () => {
    const deep = readSource("lib/notifications/notification-deep-link-v1.ts");
    expect(deep).toContain("NOT a second Notification Engine");
    expect(deep).not.toContain("setInterval");
    expect(deep).not.toContain("setTimeout");
  });
});
