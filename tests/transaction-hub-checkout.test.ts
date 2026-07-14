import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { groupCartItemsBySeller } from "@/lib/cart/group-by-seller";
import type { CartItem } from "@/lib/cart/store";
import {
  validateCheckoutAddress,
  validateProductPurchasable,
} from "@/lib/transaction-hub/checkout-validation";
import type { ProductDetail } from "@/lib/products/types";

const sampleItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: "line-1",
  productId: "prod-1",
  sellerId: "seller-1",
  slug: "widget-a",
  title: "Widget A",
  price: 20,
  imageUrl: "/placeholder-product.svg",
  quantity: 1,
  stock: 5,
  available: true,
  sellerName: "Alice",
  ...overrides,
});

const sampleProduct = {
  id: "prod-1",
  slug: "widget-a",
  title: "Widget A",
  price: 20,
  stock: 3,
  availability: "in_stock",
} as ProductDetail;

describe("transaction hub checkout document 2", () => {
  it("groups cart items by seller for multi-seller checkout", () => {
    const groups = groupCartItemsBySeller([
      sampleItem(),
      sampleItem({
        id: "line-2",
        productId: "prod-2",
        sellerId: "seller-2",
        slug: "widget-b",
        title: "Widget B",
        sellerName: "Bob",
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.sellerId).toBe("seller-1");
    expect(groups[1]?.sellerId).toBe("seller-2");
    expect(groups[0]?.platformFee).toBeGreaterThan(0);
  });

  it("validates purchasable product and address", () => {
    expect(validateProductPurchasable(sampleProduct).valid).toBe(true);
    expect(
      validateProductPurchasable({
        ...sampleProduct,
        availability: "out_of_stock",
        stock: 0,
      }).valid,
    ).toBe(false);

    expect(
      validateCheckoutAddress({
        deliveryOption: "",
        paymentMethod: "card",
        recipientName: "Mihai",
        addressLine: "1 High St",
        postcode: "SW1A 1AA",
        country: "United Kingdom",
        acceptedReturnPolicy: false,
      }).valid,
    ).toBe(true);
  });

  it("opens Buy Now on full-page listing checkout", () => {
    const actions = readFileSync(
      path.join(process.cwd(), "features/transaction-hub/TransactionHubBottomActions.tsx"),
      "utf8",
    );
    const hub = readFileSync(
      path.join(process.cwd(), "features/transaction-hub/CheckoutHubSheet.tsx"),
      "utf8",
    );

    expect(actions).toContain("/checkout/");
    expect(actions).toContain("conversationId");
    expect(actions).not.toContain("CheckoutHubSheet");
    expect(hub).toContain("data-transaction-hub-checkout=\"embedded\"");
  });

  it("returns payment cancel to the same conversation when opened from hub", () => {
    const checkout = readFileSync(
      path.join(process.cwd(), "lib/orders/checkout.ts"),
      "utf8",
    );
    expect(checkout).toContain("hubConversationId");
    expect(checkout).toContain("/checkout/${product.slug}/success?order_id=");
    expect(checkout).toContain("/inbox/conversation/${input.hubConversationId}?payment=cancelled");
  });
});
