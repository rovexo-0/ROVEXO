import { describe, expect, it } from "vitest";
import { resolveProductOfferActionView } from "@/lib/transaction-hub/dynamic-offer-action-engine-v1";

describe("Dynamic Offer Action Engine v1 — product page UI", () => {
  it("idle shows Buy Now + Make Offer only", () => {
    const view = resolveProductOfferActionView({ outOfStock: false, offers: [] });
    expect(view.mode).toBe("idle");
    expect(view.showBuyNow).toBe(true);
    expect(view.showMakeOffer).toBe(true);
    expect(view.showAccept).toBe(false);
    expect(view.showCancelOffer).toBe(false);
  });

  it("buyer pending hides Buy Now / Make Offer / Accept", () => {
    const view = resolveProductOfferActionView({
      outOfStock: false,
      offers: [
        {
          id: "o1",
          amount: 25,
          status: "pending",
          fromRole: "buyer",
          createdAt: "2026-07-26T10:00:00.000Z",
        },
      ],
    });
    expect(view.mode).toBe("buyer_pending");
    expect(view.showCancelOffer).toBe(true);
    expect(view.showBuyNow).toBe(false);
    expect(view.showMakeOffer).toBe(false);
    expect(view.showAccept).toBe(false);
  });

  it("seller counter shows Accept / Counter / Decline only", () => {
    const view = resolveProductOfferActionView({
      outOfStock: false,
      offers: [
        {
          id: "o2",
          amount: 30,
          status: "pending",
          fromRole: "seller",
          createdAt: "2026-07-26T11:00:00.000Z",
        },
      ],
    });
    expect(view.mode).toBe("seller_counter");
    expect(view.showAccept).toBe(true);
    expect(view.showDecline).toBe(true);
    expect(view.showCounterOffer).toBe(true);
    expect(view.showBuyNow).toBe(false);
    expect(view.showMakeOffer).toBe(false);
  });

  it("accepted locks Buy Now at negotiated price", () => {
    const view = resolveProductOfferActionView({
      outOfStock: false,
      offers: [
        {
          id: "o3",
          amount: 28,
          status: "accepted",
          fromRole: "seller",
          createdAt: "2026-07-26T12:00:00.000Z",
        },
      ],
    });
    expect(view.mode).toBe("accepted");
    expect(view.showBuyNow).toBe(true);
    expect(view.buyUsesNegotiatedPrice).toBe(true);
    expect(view.showMakeOffer).toBe(false);
    expect(view.showAccept).toBe(false);
  });

  it("out of stock hides every negotiation action", () => {
    const view = resolveProductOfferActionView({
      outOfStock: true,
      offers: [
        {
          id: "o4",
          amount: 20,
          status: "pending",
          fromRole: "buyer",
          createdAt: "2026-07-26T10:00:00.000Z",
        },
      ],
    });
    expect(view.mode).toBe("out_of_stock");
    expect(view.showBuyNow).toBe(false);
    expect(view.showMakeOffer).toBe(false);
    expect(view.showAccept).toBe(false);
  });

  it("declined and expired reset to Buy Now + Make Offer", () => {
    expect(
      resolveProductOfferActionView({
        outOfStock: false,
        offers: [
          {
            id: "d1",
            amount: 10,
            status: "rejected",
            fromRole: "buyer",
            createdAt: "2026-07-26T09:00:00.000Z",
          },
        ],
      }).mode,
    ).toBe("declined");
    expect(
      resolveProductOfferActionView({
        outOfStock: false,
        offers: [
          {
            id: "e1",
            amount: 10,
            status: "expired",
            fromRole: "buyer",
            createdAt: "2026-07-26T09:00:00.000Z",
          },
        ],
      }).mode,
    ).toBe("expired");
  });
});
