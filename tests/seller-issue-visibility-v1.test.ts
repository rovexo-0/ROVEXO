/**
 * Seller read-only visibility of Buyer issue / non-delivery.
 * Reuses TransactionStatusCard. No Stripe / Sendcloud / Evri / schema writes.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConversationHubView } from "@/lib/inbox/conversation-view";
import { resolveTransactionStatusCard } from "@/lib/inbox/transaction-status-card-v1";
import {
  NON_DELIVERY_RESOLUTION_CASE_V1,
  isSellerBuyerReportedNonDelivery,
} from "@/lib/inbox/non-delivery-resolution-case-v1";
import { canSubmitBuyerIssue } from "@/lib/inbox/buyer-issue-reason-v1";
import type { Conversation } from "@/lib/messages/types";
import type { Order } from "@/lib/orders/types";
import { resolveSprint1PaymentUi } from "@/lib/inbox/conversation-payment-sprint1";
import { canAuthorizeBuyerRefund, canInventSellerCarrierPayout } from "@/lib/resolution-engine/lost-parcel-resolution-v1";
import { SENDCLOUD_SUPPORT_INTEGRATION_ENABLED } from "@/lib/shipping/sendcloud/support-investigation-contract-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const shippedOrder = {
  id: "o1",
  orderNumber: "RX-1",
  status: "shipped",
  product: {
    id: "p1",
    slug: "tent",
    title: "Tent",
    price: 0.1,
    imageUrl: "/placeholder-product.svg",
    condition: "Good",
  },
  buyer: { id: "b", name: "Buyer" },
  seller: { id: "s", name: "Seller" },
  totals: { itemPrice: 0.1, platformFee: 0.01, delivery: 0, total: 0.11 },
  deliveryCarrier: "Evri",
  trackingNumber: "AB1",
  createdAt: "2026-08-14T22:31:28.470Z",
  shippedAt: "2026-08-14T22:31:28.470Z",
  disputesDisabled: false,
} as Order;

const inTransitTracking = {
  courierName: "Evri",
  trackingNumber: "AB1",
  statusLabel: "In transit",
  latestScan: "Shipment handed to carrier",
  carrierUrl: null,
};

const conversation = {
  id: "c1",
  product: {
    id: "p1",
    slug: "tent",
    title: "Tent",
    price: 0.1,
    imageUrl: "/placeholder-product.svg",
    status: "sold",
  },
  participant: { id: "b", name: "Buyer", role: "buyer", online: false },
  messages: [],
} as unknown as Conversation;

describe("seller-issue-visibility-v1", () => {
  it("Seller + no Buyer issue → no Issue card", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: shippedOrder,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: inTransitTracking,
    });
    expect(card?.title).not.toBe("Issue Open");
    expect(card?.title).not.toBe(NON_DELIVERY_RESOLUTION_CASE_V1.sellerNonDeliveryTitle);
    expect(card?.resolutionCase).toBeNull();
    expect(isSellerBuyerReportedNonDelivery("DELAYED")).toBe(false);
    expect(isSellerBuyerReportedNonDelivery("NORMAL")).toBe(false);
  });

  it("Seller + Buyer issue OPEN → exactly one Issue status", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: { ...shippedOrder, status: "issue_open" },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(card?.title).toBe(NON_DELIVERY_RESOLUTION_CASE_V1.sellerIssueOpenTitle);
    expect(card?.description).toBe(NON_DELIVERY_RESOLUTION_CASE_V1.sellerIssueOpenBody);
    expect(card?.primaryAction).toEqual({
      id: "view_dispute",
      label: NON_DELIVERY_RESOLUTION_CASE_V1.sellerViewDetails,
    });
    expect(card?.resolutionCase).toBeNull();
    const view = buildConversationHubView({
      conversation,
      order: { ...shippedOrder, status: "issue_open" },
      hasShippingLabel: true,
    });
    expect(view.actionBarPanel).toBeNull();
    expect(view.dynamicActions.filter((action) => action.label === "View Details")).toHaveLength(0);
  });

  it("Seller + Buyer non-delivery → Delivery issue reported + View Details read-only", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: shippedOrder,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: inTransitTracking,
      lossState: "WAITING_FOR_CARRIER",
    });
    expect(card?.title).toBe(NON_DELIVERY_RESOLUTION_CASE_V1.sellerNonDeliveryTitle);
    expect(card?.description).toBe(NON_DELIVERY_RESOLUTION_CASE_V1.sellerNonDeliveryBody);
    expect(card?.primaryAction).toEqual({
      id: "view_order",
      label: NON_DELIVERY_RESOLUTION_CASE_V1.sellerViewDetails,
    });
    expect(card?.secondaryAction?.id).toBe("track_parcel");
    expect(card?.resolutionCase).toBeNull();
    expect(card?.description).not.toMatch(/I Have an Issue|Submit Issue|Why are you reporting/i);
  });

  it("Seller cannot access Buyer issue submission controls", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const report = hub.slice(hub.indexOf('if (actionId === "report_issue")'));
    expect(report.indexOf('view.viewerRole !== "buyer"')).toBeLessThan(
      report.indexOf("setIssueReasonOpen(true)"),
    );
    expect(hub).toContain('view.viewerRole === "buyer" &&');
    expect(hub).toContain("isBuyerIssueReasonFlowAvailable");
    const sellerDelivered = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: { ...shippedOrder, status: "delivered" },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(sellerDelivered?.secondaryAction?.id).not.toBe("report_issue");
    expect(sellerDelivered?.primaryAction?.id).not.toBe("report_issue");
  });

  it("Seller cannot see Buyer Platform Fee / Buyer total", () => {
    const payment = resolveSprint1PaymentUi({
      viewerRole: "seller",
      order: shippedOrder,
      listingPrice: 0.1,
    });
    expect(payment.buyerBreakdown).toBeNull();
    expect(payment.showBuyerFeeInfo).toBe(false);
    expect(payment.secondaryLabel).toBe("You will receive");
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain('view.viewerRole === "buyer"');
    expect(hub).toContain("incl. Platform Fee");
  });

  it("Buyer flow remains unchanged", () => {
    const delivered = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: { ...shippedOrder, status: "delivered" },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(delivered?.secondaryAction).toEqual({ id: "report_issue", label: "I Have an Issue" });
    const issue = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: { ...shippedOrder, status: "issue_open" },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(issue?.title).toBe("Issue");
    expect(issue?.description).toBe("Your order is suspended");
  });

  it("Damage Buyer flow remains unchanged", () => {
    expect(
      canSubmitBuyerIssue({
        reasonId: "item-damaged",
        description: "Torn strap",
        photoCount: 0,
      }),
    ).toBe(false);
    expect(
      canSubmitBuyerIssue({
        reasonId: "item-damaged",
        description: "Torn strap",
        photoCount: 1,
      }),
    ).toBe(true);
  });

  it("Non-delivery Buyer flow remains unchanged", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: shippedOrder,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: inTransitTracking,
      lossState: "WAITING_FOR_CARRIER",
    });
    expect(card?.resolutionCase?.title).toBe(NON_DELIVERY_RESOLUTION_CASE_V1.title);
    expect(card?.resolutionCase?.actions).toEqual(
      expect.arrayContaining([
        { id: "add_information", label: NON_DELIVERY_RESOLUTION_CASE_V1.addInformation },
        { id: "contact_seller", label: NON_DELIVERY_RESOLUTION_CASE_V1.contactSeller },
        { id: "track_parcel", label: NON_DELIVERY_RESOLUTION_CASE_V1.viewTracking },
      ]),
    );
  });

  it("No duplicate Issue card + tracking and composer remain", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: { ...shippedOrder, status: "issue_open" },
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(card?.resolutionCase).toBeNull();
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub.split('id="conv-hub-composer"').length - 1).toBe(1);
    expect(hub).toContain('if (actionId === "track_parcel")');
    expect(hub).toContain("EVRI_PUBLIC_TRACK_PARCEL_URL");
    expect(hub).not.toContain("ContactSellerCard");
    expect(hub).not.toContain("SellerIssueCard");
  });

  it("No external carrier/payment calls", () => {
    expect(SENDCLOUD_SUPPORT_INTEGRATION_ENABLED).toBe(false);
    expect(canInventSellerCarrierPayout()).toBe(false);
    expect(canAuthorizeBuyerRefund("WAITING_FOR_CARRIER")).toBe(false);
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const report = hub.slice(
      hub.indexOf('if (actionId === "report_issue")'),
      hub.indexOf('if (actionId === "add_information")'),
    );
    expect(report.toLowerCase()).not.toContain("stripe");
    expect(report).not.toContain("createLostInvestigationTicket");
    expect(report).not.toContain("sendcloud");
  });
});
