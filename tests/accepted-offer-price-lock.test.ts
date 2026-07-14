import { describe, expect, it } from "vitest";
import { resolveTransactionItemPrice } from "@/lib/offers/accepted-price";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import { validateCheckoutTotals } from "@/lib/transaction-hub/checkout-validation";
import type { ProductDetail } from "@/lib/products/types";

describe("accepted offer price lock", () => {
  it("uses accepted_offer_price instead of listing price", () => {
    expect(
      resolveTransactionItemPrice({
        listingPrice: 19.99,
        acceptedOfferPrice: 5,
      }),
    ).toBe(5);

    expect(
      resolveTransactionItemPrice({
        listingPrice: 19.99,
        acceptedOfferPrice: null,
      }),
    ).toBe(19.99);
  });

  it("builds checkout totals from locked offer price (never listing price)", () => {
    const itemPrice = resolveTransactionItemPrice({
      listingPrice: 19.99,
      acceptedOfferPrice: 5,
    });
    const totals = calculateOrderTotals(itemPrice, 2.38);

    expect(totals.itemPrice).toBe(5);
    expect(totals.platformFee).toBe(0.28); // 5.5% of £5
    expect(totals.delivery).toBe(2.38);
    expect(totals.total).toBe(7.66);
    expect(totals.itemPrice).not.toBe(19.99);
  });

  it("validateCheckoutTotals accepts locked offer price against listing product.price", () => {
    const product = { price: 19.99 } as ProductDetail;
    const totals = calculateOrderTotals(5, 2.38);

    expect(validateCheckoutTotals(product, totals).valid).toBe(false);
    expect(validateCheckoutTotals(product, totals, 5).valid).toBe(true);
  });
});
