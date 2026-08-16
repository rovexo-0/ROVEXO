/**
 * BLOOD IV — Order lifecycle SSOT lock (presentation + action mapping).
 * No engine rewrites. Certifies canonical Owner lifecycle ↔ ROVEXO mapping.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveTransactionStatusCard,
  type ResolveTransactionStatusCardInput,
} from "@/lib/inbox/transaction-status-card-v1";
import type { Order } from "@/lib/orders/types";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function baseOrder(status: Order["status"]): Order {
  return {
    id: "ord-blood-iv",
    orderNumber: "RVXBLOOD4",
    status,
    product: {
      id: "p1",
      slug: "slug",
      title: "Item",
      price: 24.99,
      imageUrl: "/x.png",
      condition: "new",
    },
    buyer: { id: "b1", name: "Buyer" },
    seller: { id: "s1", name: "Seller" },
    totals: { itemPrice: 24.99, platformFee: 1.37, delivery: 0, total: 26.36 },
    deliveryCarrier: "Royal Mail",
    createdAt: new Date().toISOString(),
    disputesDisabled: false,
  };
}

describe("BLOOD IV — Shipping / Order lifecycle SSOT", () => {
  it("maps Owner shipping_label_ready to LABEL_CREATED (order stays awaiting_shipment)", () => {
    const input: ResolveTransactionStatusCardInput = {
      viewerRole: "seller",
      order: baseOrder("awaiting_shipment"),
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    };
    const card = resolveTransactionStatusCard(input);
    expect(card?.status).toBe("LABEL_CREATED");
    expect(card?.title).toMatch(/Shipping Label Ready/i);
    expect(card?.primaryAction?.id).toBe("print_label");
  });

  it("seller awaiting_shipment without label → CREATE SHIPPING LABEL", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: baseOrder("awaiting_shipment"),
      hasAcceptedOffer: true,
      hasShippingLabel: false,
      tracking: null,
    });
    expect(card?.status).toBe("PAYMENT_COMPLETED");
    expect(card?.primaryAction?.label).toMatch(/CREATE SHIPPING LABEL/i);
  });

  it("shipped + tracking blob drives IN_TRANSIT / OUT_FOR_DELIVERY", () => {
    const inTransit = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: { ...baseOrder("shipped"), trackingNumber: "T1" },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "Royal Mail",
        trackingNumber: "T1",
        statusLabel: "In transit",
        latestScan: "Depot scan",
      },
    });
    expect(inTransit?.status).toBe("IN_TRANSIT");

    const ofd = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: { ...baseOrder("shipped"), trackingNumber: "T1" },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "Royal Mail",
        trackingNumber: "T1",
        statusLabel: "Out for delivery",
        latestScan: "With courier",
      },
    });
    expect(ofd?.status).toBe("OUT_FOR_DELIVERY");
  });

  it("delivered → buyer Everything OK path via status card DELIVERED", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: baseOrder("delivered"),
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: { courierName: "Royal Mail", trackingNumber: "T1", statusLabel: "Delivered" },
    });
    expect(card?.status).toBe("DELIVERED");
  });

  it("Hub dynamic actions never expose Mark as shipped sticky; Messages never Withdraw", () => {
    const view = read("lib/inbox/conversation-view.ts");
    const card = read("lib/inbox/transaction-status-card-v1.ts");
    expect(view).toContain('bottom sticky "Get Shipping Label" removed');
    expect(view).toContain("no Mark as Sent");
    expect(view).not.toMatch(/label:\s*"Mark as shipped"/);
    expect(view).not.toMatch(/label:\s*"Withdraw"/);
    /* COD SÂNGE — Everything OK / Leave Review live on Dynamic Transaction Card */
    expect(card).toContain('label: "Everything OK"');
    expect(card).toContain('label: "Leave Feedback"');
    expect(card).toContain('title: "Sale completed"');
    expect(card).not.toMatch(/label:\s*"WITHDRAW"/);
  });

  it("order status enum has no shipping_label_ready (UI-only)", () => {
    const types = read("lib/orders/types.ts");
    expect(types).toContain("awaiting_shipment");
    expect(types).toContain("shipped");
    expect(types).toContain("delivered");
    expect(types).toContain("completed");
    expect(types).not.toContain("shipping_label_ready");
  });

  it("notifications cover paid / shipped / delivered", () => {
    const notif = read("lib/orders/notifications.ts");
    expect(notif).toContain("export async function notifyOrderPaid");
    expect(notif).toContain("export async function notifyOrderShipped");
    expect(notif).toContain("export async function notifyOrderDelivered");
    expect(notif).toContain('title: "Order paid"');
    expect(notif).toContain('title: "Order shipped"');
    expect(notif).toContain('title: "Order delivered"');
  });
});
