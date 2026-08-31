import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INBOX_CONVERSATION_VIEWPORT_PREFETCH_CAP,
  LISTING_CARD_VIEWPORT_PREFETCH_CAP,
  resetViewportRoutePrefetchStateForTests,
} from "@/lib/navigation/viewport-route-prefetch-v1";
import { resolveNotificationOpenHrefSync } from "@/lib/notifications/resolve-notification-open-href";
import type { Notification } from "@/lib/notifications/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function stubNotification(partial: Partial<Notification> & Pick<Notification, "href">): Notification {
  return {
    id: "n1",
    title: "Test",
    subtitle: "",
    type: "message",
    read: false,
    createdAt: new Date().toISOString(),
    icon: "message",
    ...partial,
  };
}

describe("P0.2 Mobile navigation + Saved grid", () => {
  beforeEach(() => {
    resetViewportRoutePrefetchStateForTests();
  });

  it("keeps viewport prefetch caps and intent prefetch helpers", () => {
    expect(LISTING_CARD_VIEWPORT_PREFETCH_CAP).toBe(8);
    expect(INBOX_CONVERSATION_VIEWPORT_PREFETCH_CAP).toBe(4);
    const helper = readSource("lib/navigation/viewport-route-prefetch-v1.ts");
    expect(helper).toContain("prefetchRouteOnIntent");
    expect(helper).toContain("onPointerDown");
  });

  it("Listing page does not await self-heal before product fetch", () => {
    const page = readSource("app/(platform)/listing/[slug]/page.tsx");
    expect(page).toContain('void awaitCheckoutSessionSelfHeal("listing-view")');
    expect(page).not.toMatch(/await awaitCheckoutSessionSelfHeal\("listing-view"\)/);
  });

  it("listing loading shell exists for soft navigation", () => {
    const loading = readSource("app/(platform)/listing/[slug]/loading.tsx");
    expect(loading).toContain("ProductSkeleton");
  });

  it("Conversation route parallelizes profile + conversation fetch", () => {
    const page = readSource("app/(platform)/inbox/conversation/[conversationId]/page.tsx");
    expect(page).toContain("Promise.all");
    expect(page).toContain("fetchConversationById");
    expect(page).toContain("getProfile");
  });

  it("Saved mobile grid is exactly 2 columns via page-scoped listing-grid CSS", () => {
    const saved = readSource("features/account-module/components/SavedItemsV1.tsx");
    const css = readSource("styles/rovexo/listing-grid-v1.css");
    expect(saved).toContain('import "@/styles/rovexo/listing-grid-v1.css"');
    expect(saved).toContain('className="rx-listing-grid w-full"');
    expect(saved).toContain('data-saved-grid="mobile-2col"');
    expect(saved).toContain('surface="saved"');
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*repeat\(3/);
  });

  it("Bottom nav and Account Balance warm canonical /wallet (no /balance redirect hop)", () => {
    const nav = readSource("components/ui/BottomNavigation.tsx");
    const menu = readSource("lib/account-center/canonical-menu.ts");
    const badges = readSource("lib/account-center/badges.ts");
    expect(nav).toContain('"/wallet"');
    expect(menu).toContain('href: "/wallet"');
    expect(badges).toContain('"wallet-payout": "/wallet"');
  });

  it("notification open href is sync for conversation and order destinations", () => {
    const conversation = resolveNotificationOpenHrefSync(
      stubNotification({ href: "/inbox/conversation/abc-123" }),
    );
    expect(conversation).toContain("/inbox/conversation/abc-123");

    const order = resolveNotificationOpenHrefSync(
      stubNotification({
        href: "/orders/order-99",
        type: "payment",
        title: "Payment received",
      }),
    );
    expect(order).toContain("/inbox");
    expect(order).toContain("order=");

    const source = readSource("lib/notifications/resolve-notification-open-href.ts");
    expect(source).not.toContain('fetch("/api/orders"');
    expect(source).not.toContain('fetch("/api/messages"');
  });

  it("Inbox openNotification uses sync resolver (no await resolveNotificationOpenHref)", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    expect(inbox).toContain("resolveNotificationOpenHrefSync");
    expect(inbox).not.toContain("await resolveNotificationOpenHref(");
  });
});
