import { describe, expect, it } from "vitest";
import { calculateOrderTotals, calculatePlatformFee, PLATFORM_FEE_RATE } from "@/lib/orders/pricing";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { isPurchasable } from "@/lib/inventory/service";
import { canPerformOrderAction } from "@/lib/orders/role";
import type { Order } from "@/lib/orders/types";

describe("order pricing", () => {
  it("uses a single platform fee at 5.5% within bounds", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.055);
    expect(calculatePlatformFee(10)).toBe(0.55);
    expect(calculatePlatformFee(500)).toBe(27.5);
  });

  it("calculates checkout totals", () => {
    const totals = calculateOrderTotals(50, 4.99);
    expect(totals.platformFee).toBe(2.75);
    expect(totals.total).toBe(57.74);
    expect(totals.deliveryPending).toBe(false);
  });

  it("excludes unresolved delivery from checkout total", () => {
    const totals = calculateOrderTotals(50, null);
    expect(totals.deliveryPending).toBe(true);
    expect(totals.delivery).toBe(0);
    expect(totals.total).toBe(52.75);
  });
});

describe("seller wallet math", () => {
  it("pays the seller the full item price (single buyer-paid platform fee)", () => {
    const { platformFee, sellerAmount } = calculateSellerNetAmount(100);
    expect(platformFee).toBe(5.5);
    expect(sellerAmount).toBe(100);
  });
});

describe("inventory guards", () => {
  it("allows published in-stock products only", () => {
    expect(isPurchasable(3, "published")).toBe(true);
    expect(isPurchasable(0, "published")).toBe(false);
    expect(isPurchasable(1, "sold")).toBe(false);
  });
});

describe("order action authorization", () => {
  const order: Order = {
    id: "1",
    orderNumber: "RVX123",
    status: "shipped",
    product: {
      id: "p1",
      slug: "item",
      title: "Item",
      price: 10,
      imageUrl: "",
      condition: "new",
    },
    buyer: { id: "buyer", name: "Buyer" },
    seller: { id: "seller", name: "Seller" },
    totals: { itemPrice: 10, platformFee: 0.99, delivery: 4.99, total: 15.98 },
    deliveryCarrier: "Royal Mail",
    createdAt: new Date().toISOString(),
    disputesDisabled: false,
  };

  it("restricts seller actions to sellers", () => {
    expect(canPerformOrderAction("mark_delivered", order, "seller")).toBe(true);
    expect(canPerformOrderAction("mark_delivered", order, "buyer")).toBe(false);
    expect(canPerformOrderAction("add_tracking", order, "buyer")).toBe(false);
  });

  it("allows buyer confirmation on delivered orders", () => {
    const delivered = { ...order, status: "delivered" as const };
    expect(canPerformOrderAction("confirm_ok", delivered, "buyer")).toBe(true);
  });
});

describe("commerce module exports", () => {
  it("exposes checkout and cart services", async () => {
    const checkout = await import("@/lib/orders/checkout");
    const cart = await import("@/lib/cart/store");
    expect(checkout.createOrderCheckoutSession).toBeTypeOf("function");
    expect(cart.addToCart).toBeTypeOf("function");
  });
});
