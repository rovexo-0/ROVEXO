/**
 * Messages Final Cleanup (COD SÂNGE) — architecture lock.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isConversationRealtimeEnabled,
  isInboxRealtimeEnabled,
} from "@/lib/inbox";
import { MESSAGES_FINAL_CLEANUP_V1 } from "@/lib/inbox/messages-final-cleanup-v1";
import { resolveTransactionStatusCard } from "@/lib/inbox/transaction-status-card-v1";
import type { Order } from "@/lib/orders/types";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Messages Final Cleanup v1", () => {
  it("enables conversation + inbox realtime as live transport", () => {
    expect(isConversationRealtimeEnabled()).toBe(true);
    expect(isInboxRealtimeEnabled()).toBe(true);
    expect(MESSAGES_FINAL_CLEANUP_V1.realtimeIsSingleLiveTransport).toBe(true);
  });

  it("removes dead sheet components completely", () => {
    expect(existsSync(join(process.cwd(), "features/inbox/components/ConversationTrackingSheet.tsx"))).toBe(
      false,
    );
    expect(existsSync(join(process.cwd(), "features/inbox/components/ReviewTeaserSheet.tsx"))).toBe(false);
    const hub = read("features/inbox/components/ConversationHub.tsx");
    expect(hub).not.toContain("ReviewTeaserSheet");
    expect(hub).not.toContain("ConversationTrackingSheet");
    expect(hub).not.toContain("pullStartY");
  });

  it("wires realtime context + removes focus/pull data reload in Hub", () => {
    const hub = read("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("subscribeConversationRealtime");
    expect(hub).toContain("productId:");
    expect(hub).toContain("orderId:");
    expect(hub).toMatch(/Lifecycle data comes from realtime|realtime-driven/);
    expect(hub).not.toMatch(/onTouchEnd[\s\S]{0,200}reloadRelated/);
  });

  it("Inbox list uses realtime refresh without focus polling", () => {
    const inbox = read("features/inbox/components/InboxPage.tsx");
    expect(inbox).toContain("subscribeInboxRealtime");
    expect(inbox).toContain('data-inbox-realtime="v1"');
    expect(inbox).not.toContain("focusRefreshTimer");
    expect(inbox).not.toContain("pullStartY");
  });

  it("view model drops dead party/rail/attachments/typing fields", () => {
    const view = read("lib/inbox/conversation-view.ts");
    expect(view).not.toContain("showCounterpartyCard");
    expect(view).not.toContain("typingLabel");
    expect(view).not.toContain("ConversationAttachmentView");
    expect(view).not.toContain("buildAttachments");
    expect(view).not.toMatch(/statusSteps:/);
  });

  it("seller completed card never mentions Wallet / Withdraw / Balance", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: {
        id: "o1",
        orderNumber: "RVX1",
        status: "completed",
        createdAt: "2026-01-01T00:00:00.000Z",
        completedAt: "2026-01-02T00:00:00.000Z",
        disputesDisabled: false,
        totals: { itemPrice: 10, platformFee: 0.55, shipping: 0, total: 10.55 },
      } as unknown as Order,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(card?.title).toBe("Sale completed");
    expect(card?.description).not.toMatch(/Wallet|Withdraw|Balance|Pending|Available/i);
    expect(card?.primaryAction).toBeNull();
  });

  it("CSS drops dead party / offer-history / rail / done-summary", () => {
    const css = read("styles/rovexo/conversation-hub-v1.css");
    expect(css).not.toContain(".conv-hub__party");
    expect(css).not.toContain(".conv-hub__offer-history");
    expect(css).not.toContain(".conv-hub__rail {");
    expect(css).not.toContain(".conv-hub__done-summary");
  });
});
