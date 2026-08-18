import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isBuyerDeliveryConfirmationVisible,
  isTransactionStatusCardActive,
  resolveExistingShippingUiPhase,
  resolveTransactionStatusCard,
  TRANSACTION_STATUS_CARD_V1,
} from "@/lib/inbox/transaction-status-card-v1";
import type { Order } from "@/lib/orders/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

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
    expect(paidSeller?.secondaryAction).toEqual({
      id: "cancel_order",
      label: "CANCEL ORDER",
    });

    const paidBuyer = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: { ...baseOrder, status: "awaiting_shipment", paidAt: baseOrder.createdAt },
      hasAcceptedOffer: true,
      hasShippingLabel: false,
      tracking: null,
    });
    expect(paidBuyer?.status).toBe("PAYMENT_COMPLETED");
    expect(paidBuyer?.title).toBe("Payment Successful");
    expect(paidBuyer?.primaryAction).toEqual({ id: "view_order", label: "VIEW ORDER" });
    expect(paidBuyer?.secondaryAction).toBeNull();

    const labelSeller = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: { ...baseOrder, status: "awaiting_shipment", paidAt: baseOrder.createdAt },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(labelSeller?.status).toBe("LABEL_CREATED");
    expect(labelSeller?.primaryAction?.label).toBe("PRINT LABEL");
    expect(labelSeller?.secondaryAction).toEqual({
      id: "cancel_order",
      label: "CANCEL ORDER",
    });

    const collectedBlocksCancel = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: { ...baseOrder, status: "awaiting_shipment", paidAt: baseOrder.createdAt },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
      shippingRecordStatus: "collected",
    });
    expect(collectedBlocksCancel?.primaryAction?.label).toBe("PRINT LABEL");
    expect(collectedBlocksCancel?.secondaryAction).toBeNull();
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
    expect(collected?.title).toBe("Tracking Active");
    expect(collected?.description).toBe("Parcel collected");
    expect(collected?.primaryAction).toEqual({ id: "track_parcel", label: "TRACK PARCEL" });
    expect(collected?.secondaryAction).toEqual({
      id: "report_not_arrived",
      label: "My order hasn't arrived",
    });
    expect(collected?.trackingDetail?.activityTitle).toBe("Tracking Active");
    expect(collected?.trackingDetail?.activityDescription).toBe("Parcel collected");
    expect(collected?.trackingDetail?.carrierTracking).toBe("RM · AB1");

    const inTransit = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: {
        ...baseOrder,
        status: "shipped",
        trackingNumber: "H01XTA0004974486",
        deliveryCarrier: "Evri",
        shippedAt: baseOrder.createdAt,
      },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "Evri",
        trackingNumber: "H01XTA0004974486",
        statusLabel: "In transit",
        latestScan: "Shipment handed to carrier",
        carrierUrl: "https://www.evri.com/track-a-parcel/H01XTA0004974486",
      },
    });
    expect(inTransit?.status).toBe("IN_TRANSIT");
    expect(inTransit?.title).toBe("Tracking Active");
    expect(inTransit?.description).toBe("Shipment handed to carrier");
    expect(inTransit?.trackingDetail?.activityTitle).toBe("Tracking Active");
    expect(inTransit?.trackingDetail?.activityDescription).toBe("Shipment handed to carrier");
    expect(inTransit?.trackingDetail?.carrierTracking).toBe("Evri · H01XTA0004974486");
    expect(inTransit?.primaryAction).toEqual({ id: "track_parcel", label: "TRACK PARCEL" });
    expect(inTransit?.secondaryAction).toEqual({
      id: "report_not_arrived",
      label: "My order hasn't arrived",
    });

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
    expect(fundsSeller?.title).toBe("Issue");
    expect(fundsSeller?.description).toBe("Your order is suspended");
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
    expect(completedBuyer?.primaryAction?.label).toBe("Leave Feedback");
    expect(completedBuyer?.icon).not.toBe("wallet");
  });

  it("shipping status matrix — pre-delivery hides buyer confirm/issue; delivered shows them", () => {
    const shipped = {
      ...baseOrder,
      status: "shipped" as const,
      trackingNumber: "AB1",
      deliveryCarrier: "Evri",
      shippedAt: baseOrder.createdAt,
    };

    const collected = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: shipped,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "Evri",
        trackingNumber: "AB1",
        statusLabel: "Collected",
        latestScan: "Parcel collected",
        carrierUrl: null,
      },
    });
    expect(collected?.status).toBe("PARCEL_COLLECTED");
    expect(collected?.title).toBe("Tracking Active");
    expect(collected?.primaryAction).toEqual({ id: "track_parcel", label: "TRACK PARCEL" });
    expect(collected?.secondaryAction).toEqual({
      id: "report_not_arrived",
      label: "My order hasn't arrived",
    });

    const inTransit = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: shipped,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "Evri",
        trackingNumber: "AB1",
        statusLabel: "In transit",
        latestScan: "Shipment handed to carrier",
        carrierUrl: null,
      },
    });
    expect(inTransit?.status).toBe("IN_TRANSIT");
    expect(inTransit?.title).toBe("Tracking Active");
    expect(inTransit?.primaryAction).toEqual({ id: "track_parcel", label: "TRACK PARCEL" });
    expect(inTransit?.secondaryAction).toEqual({
      id: "report_not_arrived",
      label: "My order hasn't arrived",
    });

    const outForDelivery = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: shipped,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "Evri",
        trackingNumber: "AB1",
        statusLabel: "Out for delivery",
        latestScan: "Out for delivery",
        carrierUrl: null,
      },
    });
    expect(outForDelivery?.status).toBe("OUT_FOR_DELIVERY");
    expect(outForDelivery?.primaryAction).toEqual({ id: "track_parcel", label: "TRACK PARCEL" });
    expect(outForDelivery?.secondaryAction).toEqual({
      id: "report_not_arrived",
      label: "My order hasn't arrived",
    });

    const delivered = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: {
        ...baseOrder,
        status: "delivered",
        trackingNumber: "AB1",
        deliveryCarrier: "Evri",
        deliveredAt: baseOrder.createdAt,
        disputesDisabled: false,
      },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "Evri",
        trackingNumber: "AB1",
        statusLabel: "Delivered",
        latestScan: "En route to sorting center",
        carrierUrl: null,
      },
    });
    expect(isBuyerDeliveryConfirmationVisible(null, "delivered")).toBe(true);
    expect(isBuyerDeliveryConfirmationVisible(null, "shipped")).toBe(false);
    expect(delivered?.status).toBe("DELIVERED");
    expect(delivered?.title).toBe("Parcel Delivered");
    expect(delivered?.primaryAction).toEqual({ id: "confirm_received", label: "Everything OK" });
    expect(delivered?.secondaryAction).toEqual({ id: "report_issue", label: "I Have an Issue" });
    expect(resolveExistingShippingUiPhase(
      { courierName: "Evri", trackingNumber: "AB1", statusLabel: "In transit", latestScan: "En route" },
      "shipped",
    )).toBe("in_transit");
  });

  it("compact shipping card copy and layout remain dynamic", () => {
    const resolver = readSource("lib/inbox/transaction-status-card-v1.ts");
    const card = readSource("features/inbox/components/TransactionStatusCard.tsx");
    const css = readSource("styles/rovexo/conversation-hub-v1.css");
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const view = readSource("lib/inbox/conversation-view.ts");
    const store = readSource("lib/orders/store.ts");

    expect(resolver).toContain('if (order.status === "delivered")');
    expect(resolver).not.toContain("order.status === \"delivered\" && !showDeliveryConfirmation");
    expect(resolver).not.toContain("order.status === \"delivered\" && showDeliveryConfirmation");
    expect(resolver.indexOf('if (order.status === "shipped")')).toBeLessThan(
      resolver.indexOf("resolveExistingShippingUiPhase(tracking, order.status)"),
    );
    expect(resolver.indexOf("resolveExistingShippingUiPhase(tracking, order.status)")).toBeLessThan(
      resolver.indexOf('if (order.status === "delivered")'),
    );
    expect(resolver).not.toContain("Parcel In Transit");
    expect(resolver).not.toContain("Your parcel is on its way.");
    expect(card).toContain("conv-hub__tx-status--tracking-compact");
    expect(card).toContain("conv-hub__tx-status-action--compact");
    expect(css).toContain(".conv-hub__tx-status--tracking-compact");
    expect(css).toContain("grid-template-columns: 44px minmax(0, 1fr) auto");
    expect(css).not.toContain(".conv-hub__tx-status--tracking .conv-hub__tx-status-action {\n  width: 100%;");
    expect(hub).not.toContain("EVRI_PUBLIC_TRACK_PARCEL_URL");
    expect(hub).toContain("getTrackingUrl");
    expect(hub).toContain("window.location.assign(trackingUrl)");
    expect(hub).toContain("activeShippingLabel?.trackingNumber");
    expect(hub).not.toContain("/orders/${encodeURIComponent(order.id)}/tracking");
    expect(hub).not.toContain("H01XTA0004974486");
    expect(hub).not.toContain("<iframe");
    expect(hub).not.toContain('https://www.evri.com/track-a-parcel"');
    expect(view).not.toContain('label: "I Have an Issue"');
    expect(view).toContain("Tracking copy lives on the Dynamic Transaction Status Card only.");
    expect(store).toContain("if (existing.status !== \"delivered\" || existing.disputesDisabled)");
    expect(store).toContain('if (action === "confirm_ok")');
    expect(store).toContain('if (action === "report_issue")');
    expect(hub).toContain('action: "confirm_ok"');
    expect(hub).toContain('action: "report_issue"');
    expect(hub).not.toContain("executeAutomaticRefund");
  });

  it("ONE_TRANSACTION_CARD + no bottom tracking/issue panel", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const view = readSource("lib/inbox/conversation-view.ts");
    const card = readSource("features/inbox/components/TransactionStatusCard.tsx");
    const resolver = readSource("lib/inbox/transaction-status-card-v1.ts");

    expect(hub.match(/<TransactionStatusCard/g)?.length).toBe(1);
    expect(hub).not.toContain("View Tracking");
    expect(hub).not.toContain("I Have an Issue");
    expect(view).not.toContain('label: "View Tracking"');
    expect(view).not.toContain('label: "I Have an Issue"');
    expect(card).toContain("onAction");
    expect(resolver).toContain('label: "TRACK PARCEL"');
    expect(resolver).toContain('label: CANONICAL_BUYER_SELLER_RESOLUTION_V1.viewDetailsLabel');

    const issueBuyer = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: { ...baseOrder, status: "issue_open" },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(issueBuyer?.title).toBe("Issue");
    expect(issueBuyer?.description).toBe("Your order is suspended");
    expect(issueBuyer?.primaryAction).toEqual({ id: "view_dispute", label: "View Details" });

    const trackingBuyer = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: {
        ...baseOrder,
        status: "shipped",
        trackingNumber: "AB1",
        deliveryCarrier: "Evri",
        shippedAt: baseOrder.createdAt,
      },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "Evri",
        trackingNumber: "AB1",
        statusLabel: "In transit",
        latestScan: "Shipment handed to carrier",
        carrierUrl: null,
      },
    });
    expect(trackingBuyer?.primaryAction).toEqual({ id: "track_parcel", label: "TRACK PARCEL" });
  });
});
