import { describe, expect, it } from "vitest";
import {
  isTransactionStatusCardActive,
  resolveTransactionStatusCard,
  TRANSACTION_STATUS_CARD_V1,
} from "@/lib/inbox/transaction-status-card-v1";
import type { Order } from "@/lib/orders/types";

const baseOrder = {
  id: "o1",
  orderNumber: "RX-1",
  status: "awaiting_payment",
  product: {
    id: "p1",
    slug: "tent",
    title: "Tent",
    price: 31.5,
    imageUrl: "/placeholder-product.svg",
    condition: "Good",
  },
  buyer: { id: "b", name: "Buyer" },
  seller: { id: "s", name: "Seller" },
  totals: { itemPrice: 31.5, platformFee: 1.73, delivery: 0, total: 33.23 },
  deliveryCarrier: "Royal Mail",
  createdAt: new Date().toISOString(),
  disputesDisabled: false,
} as Order;

describe("Transaction Status Card — state content certification", () => {
  it("locks content certification without new engines", () => {
    expect(TRANSACTION_STATUS_CARD_V1.contentCertified).toBe(true);
    expect(TRANSACTION_STATUS_CARD_V1.presentationOnly).toBe(true);
  });

  it("STATE 01 OFFER_ACCEPTED — buyer ≠ seller wording", () => {
    const buyer = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: null,
      hasAcceptedOffer: true,
      hasShippingLabel: false,
      tracking: null,
    });
    expect(buyer?.status).toBe("OFFER_ACCEPTED");
    expect(buyer?.title).toBe("Offer Accepted");
    expect(buyer?.description).toBe("Your offer has been accepted.");
    expect(buyer?.primaryAction).toEqual({ id: "buy_now", label: "BUY NOW" });
    expect(buyer?.secondaryAction).toEqual({ id: "view_order", label: "View Details" });

    const seller = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: null,
      hasAcceptedOffer: true,
      hasShippingLabel: false,
      tracking: null,
    });
    expect(seller?.description).toBe("Waiting for the buyer to complete checkout.");
    expect(seller?.primaryAction).toEqual({ id: "view_order", label: "View Details" });
    expect(seller?.secondaryAction).toBeNull();
  });

  it("STATE 02–05 role copy + actions", () => {
    const checkoutBuyer = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: null,
      hasAcceptedOffer: true,
      hasShippingLabel: false,
      tracking: null,
      checkoutResumeAvailable: true,
    });
    expect(checkoutBuyer?.status).toBe("CHECKOUT_PENDING");
    expect(checkoutBuyer?.primaryAction?.label).toBe("CONTINUE CHECKOUT");

    const paySeller = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: baseOrder,
      hasAcceptedOffer: true,
      hasShippingLabel: false,
      tracking: null,
    });
    expect(paySeller?.title).toBe("Awaiting Payment");
    expect(paySeller?.primaryAction?.label).toBe("View Details");

    const paidSeller = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: { ...baseOrder, status: "awaiting_shipment", paidAt: baseOrder.createdAt },
      hasAcceptedOffer: true,
      hasShippingLabel: false,
      tracking: null,
    });
    expect(paidSeller?.status).toBe("PAYMENT_COMPLETED");
    expect(paidSeller?.primaryAction).toEqual({
      id: "print_label",
      label: "CREATE SHIPPING LABEL",
    });

    const labelSeller = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: { ...baseOrder, status: "awaiting_shipment", paidAt: baseOrder.createdAt },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(labelSeller?.status).toBe("LABEL_CREATED");
    expect(labelSeller?.primaryAction?.label).toBe("PRINT LABEL");
    expect(labelSeller?.secondaryAction).toBeNull();
  });

  it("STATE 05 LABEL_CREATED — buyer never gets VIEW LABEL", () => {
    const labelBuyer = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: { ...baseOrder, status: "awaiting_shipment", paidAt: baseOrder.createdAt },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "RM",
        trackingNumber: "AB1",
        statusLabel: "Label ready",
        latestScan: null,
        carrierUrl: null,
      },
    });
    expect(labelBuyer?.status).toBe("LABEL_CREATED");
    expect(labelBuyer?.primaryAction?.id).toBe("track_parcel");
    expect(labelBuyer?.primaryAction?.label).toBe("TRACK PARCEL");
  });

  it("STATE 06–11 tracking + funds content", () => {
    const collected = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: {
        ...baseOrder,
        status: "shipped",
        trackingNumber: "AB1",
        shippedAt: baseOrder.createdAt,
      },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "RM",
        trackingNumber: "AB1",
        statusLabel: "Collected",
        latestScan: "Parcel collected",
        carrierUrl: "https://example.com",
      },
    });
    expect(collected?.status).toBe("PARCEL_COLLECTED");
    expect(collected?.description).toBe("Your parcel is now with the carrier.");

    const deliveredBuyer = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: {
        ...baseOrder,
        status: "delivered",
        deliveredAt: baseOrder.createdAt,
        disputesDisabled: false,
      },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(deliveredBuyer?.title).toBe("Parcel Delivered");
    expect(deliveredBuyer?.description).toBe("Is everything OK?");
    expect(deliveredBuyer?.primaryAction?.label).toBe("Everything OK");
    expect(deliveredBuyer?.primaryAction?.id).toBe("confirm_received");
    expect(deliveredBuyer?.secondaryAction?.label).toBe("I Have an Issue");

    const deliveredSeller = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: {
        ...baseOrder,
        status: "delivered",
        deliveredAt: baseOrder.createdAt,
      },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(deliveredSeller?.title).toBe("Waiting for buyer confirmation...");
    expect(deliveredSeller?.primaryAction).toBeNull();

    const fundsSeller = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: { ...baseOrder, status: "issue_open" },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(fundsSeller?.status).toBe("FUNDS_PENDING_RELEASE");
    expect(fundsSeller?.title).toBe("Issue Open");
    expect(fundsSeller?.description).toBe("Resolution is in progress.");
    expect(fundsSeller?.icon).not.toBe("wallet");

    const releasedSeller = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: { ...baseOrder, status: "completed", completedAt: baseOrder.createdAt },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(releasedSeller?.title).toBe("Sale completed");
    expect(releasedSeller?.description).toBe("Thank you for selling on ROVEXO.");
    expect(releasedSeller?.primaryAction).toBeNull();
    expect(isTransactionStatusCardActive(releasedSeller)).toBe(true);

    const completedBuyer = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: { ...baseOrder, status: "completed", completedAt: baseOrder.createdAt },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(completedBuyer?.title).toBe("Completed");
    expect(completedBuyer?.primaryAction?.label).toBe("Leave Review");
    expect(completedBuyer?.icon).not.toBe("wallet");
  });
});
