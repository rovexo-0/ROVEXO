import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PHASE_A1_NAVIGATION_V1 } from "@/lib/performance/phase-a1-navigation-v1";
import { buildOrderConversationHref } from "@/lib/orders/order-conversation-href";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Phase A1 — Performance & Navigation", () => {
  it("locks performance-only scope", () => {
    expect(PHASE_A1_NAVIGATION_V1.ordersToConversationDirect).toBe(true);
    expect(PHASE_A1_NAVIGATION_V1.inboxOrderServerRedirect).toBe(true);
    expect(PHASE_A1_NAVIGATION_V1.inboxLoadingIsolatedToList).toBe(true);
    expect(PHASE_A1_NAVIGATION_V1.conversationPaintWithoutRelatedGate).toBe(true);
  });

  it("isolates Inbox list loading from Conversation routes", () => {
    expect(existsSync(join(process.cwd(), "app/(platform)/inbox/(list)/loading.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/(platform)/inbox/(list)/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/(platform)/inbox/loading.tsx"))).toBe(false);
    expect(
      existsSync(join(process.cwd(), "app/(platform)/inbox/conversation/[conversationId]/loading.tsx")),
    ).toBe(true);
  });

  it("server-redirects /inbox?order= to Conversation when resolvable", () => {
    const page = readSource("app/(platform)/inbox/(list)/page.tsx");
    expect(page).toContain("resolveOrderConversationHrefForUser");
    expect(page).toContain('href.includes("/inbox/conversation/")');
    expect(page).toContain("redirect(href)");
  });

  it("hydrates Conversation with parallel order on the server", () => {
    const page = readSource("app/(platform)/inbox/conversation/[conversationId]/page.tsx");
    expect(page).toContain("fetchOrderForUser");
    expect(page).toContain("Promise.all");
    expect(page).toContain("initialOrder");
  });

  it("Orders rows prefer direct Conversation href", () => {
    expect(buildOrderConversationHref({ orderId: "o1", conversationId: "c1" })).toBe(
      "/inbox/conversation/c1?order=o1",
    );
    const ordersPage = readSource("features/orders/components/OrdersPage.tsx");
    expect(ordersPage).toContain("router.prefetch");
    expect(ordersPage).toContain("order.conversationId");
  });

  it("ConversationHub paints without related-data skeleton gate", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("useState(true)");
    expect(hub).toContain("shareInflightJson");
    expect(hub).toContain("reloadGenerationRef");
  });
});
