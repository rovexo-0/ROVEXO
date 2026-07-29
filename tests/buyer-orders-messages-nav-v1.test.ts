import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getMessageHref, getOrderHubTrackHref } from "@/lib/orders/status";
import {
  buildOrderConversationHref,
  matchConversationIdForOrder,
} from "@/lib/orders/order-conversation-href";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Buyer Orders → Messages Hub navigation adaptation", () => {
  it("Bought and Sold rows open Conversation Hub via getMessageHref + conversationId", () => {
    const page = readSource("features/orders/components/OrdersPage.tsx");
    expect(page).toContain("getMessageHref");
    expect(page).toContain("order.conversationId");
    expect(page).not.toContain("`/seller/orders/${order.id}`");
    expect(page).not.toMatch(
      /tab === "sold" \? `\/seller\/orders\/\$\{order\.id\}` : `\/orders\/\$\{order\.id\}`/,
    );
  });

  it("getMessageHref prefers direct conversation when id known", () => {
    expect(getMessageHref("ord-abc", "buyer")).toBe("/inbox?order=ord-abc");
    expect(getMessageHref("ord-abc", "seller")).toBe("/inbox?order=ord-abc");
    expect(getMessageHref("ord-abc", "buyer", "conv-1")).toBe(
      "/inbox/conversation/conv-1?order=ord-abc",
    );
    expect(getOrderHubTrackHref("ord-abc", "conv-1")).toBe(
      "/inbox/conversation/conv-1?order=ord-abc&focus=tracking",
    );
  });

  it("does not rewrite Messages Hub / ConversationHub for this adaptation", () => {
    const page = readSource("features/orders/components/OrdersPage.tsx");
    expect(page).not.toContain("ConversationHub");
    expect(page).not.toContain("TransactionActionBar");
  });
});

describe("Order direct conversation routing Phase I", () => {
  it("order detail routes redirect to Conversation Hub", () => {
    const buyer = readSource("app/orders/[id]/page.tsx");
    const seller = readSource("app/seller/orders/[id]/page.tsx");
    const tracking = readSource("app/orders/[id]/tracking/page.tsx");
    expect(buyer).toContain("resolveOrderConversationHrefForUser");
    expect(buyer).toContain("redirect(");
    expect(buyer).not.toContain("OrderDetailPageShell");
    expect(seller).toContain("resolveOrderConversationHrefForUser");
    expect(seller).not.toContain("OrderDetailPageShell");
    expect(tracking).toContain('focus: "tracking"');
  });

  it("matches conversation ids for order products", () => {
    expect(
      matchConversationIdForOrder({
        productId: "p1",
        productSlug: "shoe",
        conversations: [
          { id: "c1", product: { id: "other", slug: "x" } },
          { id: "c2", product: { id: "p1", slug: "shoe" } },
        ],
      }),
    ).toBe("c2");
    expect(
      buildOrderConversationHref({ orderId: "o1", conversationId: "c2" }),
    ).toBe("/inbox/conversation/c2?order=o1");
  });
});
