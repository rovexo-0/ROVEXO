/**
 * ROVEXO Messages Master Rewrite (COD SÂNGE) — UI lock.
 * Messages is conversation + transaction status — never a Wallet / Invoice / Order Summary.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveTransactionStatusCard } from "@/lib/inbox/transaction-status-card-v1";
import type { Order } from "@/lib/orders/types";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const baseOrder = {
  id: "ord-1",
  orderNumber: "RVX1",
  status: "completed",
  createdAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-02T00:00:00.000Z",
  disputesDisabled: false,
  totals: { itemPrice: 10, platformFee: 0.55, shipping: 0, total: 10.55 },
} as unknown as Order;

describe("Messages Master Rewrite — role separation + wallet isolation", () => {
  it("never mounts Order Summary / done-summary / Withdraw CTA in ConversationHub", () => {
    const hub = read("features/inbox/components/ConversationHub.tsx");
    expect(hub).not.toContain("conv-hub__done-summary");
    expect(hub).not.toMatch(/SellerOrderSummary|OrderSummaryTotals|ORDER_SUMMARY/);
    expect(hub).not.toMatch(/label:\s*[\"']Withdraw[\"']/);
  });

  it("seller completed card is Sale completed — never WITHDRAW", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: baseOrder,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(card?.title).toBe("Sale completed");
    expect(card?.description).toBe("Thank you for selling on ROVEXO.");
    expect(card?.primaryAction).toBeNull();
  });

  it("buyer delivered card is Parcel Delivered with Everything OK / I Have an Issue", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: { ...baseOrder, status: "delivered", completedAt: null, deliveredAt: baseOrder.createdAt },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(card?.title).toBe("Parcel Delivered");
    expect(card?.primaryAction?.id).toBe("confirm_received");
    expect(card?.secondaryAction?.id).toBe("report_issue");
  });

  it("conversation-view never emits seller Withdraw dynamic action", () => {
    const view = read("lib/inbox/conversation-view.ts");
    expect(view).not.toMatch(/label:\s*[\"']Withdraw[\"']/);
    expect(view).toContain("never Withdraw");
  });

  it("status card resolver never emits wallet icon for completed/issue states", () => {
    const sellerDone = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: baseOrder,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    const buyerIssue = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: { ...baseOrder, status: "issue_open", completedAt: null },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(sellerDone?.icon).not.toBe("wallet");
    expect(buyerIssue?.icon).not.toBe("wallet");
  });
});
