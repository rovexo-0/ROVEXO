/**
 * Seller Resolution Lifecycle — maps existing Protection / Resolution IDs.
 * No parallel dispute/return/refund system. No Stripe / Sendcloud / Evri.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { canSubmitBuyerIssue } from "@/lib/inbox/buyer-issue-reason-v1";
import { resolveSprint1PaymentUi } from "@/lib/inbox/conversation-payment-sprint1";
import type { ConversationDisputeView } from "@/lib/inbox/conversation-view";
import { NON_DELIVERY_RESOLUTION_CASE_V1 } from "@/lib/inbox/non-delivery-resolution-case-v1";
import {
  SELLER_RESOLUTION_LIFECYCLE_V1,
  resolveSellerResolutionLifecycle,
  sellerResolutionDoesNotShowReturnForNonDelivery,
} from "@/lib/inbox/seller-resolution-lifecycle-v1";
import { resolveTransactionStatusCard } from "@/lib/inbox/transaction-status-card-v1";
import type { Order } from "@/lib/orders/types";
import { canAuthorizeBuyerRefund, canInventSellerCarrierPayout } from "@/lib/resolution-engine/lost-parcel-resolution-v1";
import { SENDCLOUD_SUPPORT_INTEGRATION_ENABLED } from "@/lib/shipping/sendcloud/support-investigation-contract-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "o1",
    orderNumber: "RX-1",
    status: "issue_open",
    product: {
      id: "p1",
      slug: "tent",
      title: "Tent",
      price: 10,
      imageUrl: "/placeholder-product.svg",
      condition: "Good",
    },
    buyer: { id: "b", name: "Buyer" },
    seller: { id: "s", name: "Seller" },
    totals: { itemPrice: 10, platformFee: 1, delivery: 0, total: 11 },
    deliveryCarrier: "Evri",
    trackingNumber: "AB1",
    createdAt: "2026-08-14T22:31:28.470Z",
    disputesDisabled: false,
    ...overrides,
  };
}

function dispute(overrides: Partial<ConversationDisputeView> = {}): ConversationDisputeView {
  return {
    id: "case-1",
    status: "open",
    caseType: "dispute",
    outcome: "pending",
    title: "buyer_reported_issue",
    updatedAt: "2026-08-14T22:31:28.470Z",
    ...overrides,
  };
}

function sellerCard(
  orderOverrides: Partial<Order> = {},
  extras: {
    dispute?: ConversationDisputeView | null;
    returnStatus?: string | null;
    lossState?: Parameters<typeof resolveTransactionStatusCard>[0]["lossState"];
  } = {},
) {
  return resolveTransactionStatusCard({
    viewerRole: "seller",
    order: order({ ...orderOverrides }),
    hasAcceptedOffer: true,
    hasShippingLabel: true,
    tracking: null,
    dispute: extras.dispute,
    returnStatus: extras.returnStatus,
    lossState: extras.lossState,
  });
}

describe("seller-resolution-lifecycle-v1", () => {
  it("Buyer Issue Open → Seller sees Issue Open", () => {
    const card = sellerCard();
    expect(card?.title).toBe("Issue");
    expect(card?.description).toBe("Your order is suspended");
    expect(card?.primaryAction).toEqual({
      id: "view_dispute",
      label: SELLER_RESOLUTION_LIFECYCLE_V1.viewDetailsLabel,
    });
    expect(card?.resolutionCase).toBeNull();
  });

  it("Seller Response Required → Seller can respond", () => {
    const card = sellerCard({}, { dispute: dispute({ status: "awaiting_seller" }) });
    expect(card?.title).toBe("Issue");
    expect(card?.description).toBe("Your order is suspended");
    expect(card?.primaryAction).toEqual({
      id: "view_dispute",
      label: SELLER_RESOLUTION_LIFECYCLE_V1.viewDetailsLabel,
    });
    expect(card?.title).not.toBe(SELLER_RESOLUTION_LIFECYCLE_V1.resolvedTitle);
    const mapped = resolveSellerResolutionLifecycle({
      orderStatus: "issue_open",
      protectionStatus: "awaiting_seller",
      hasProtectionCase: true,
    });
    expect(mapped?.allowsRespond).toBe(true);
    expect(mapped?.allowsRefundAction).toBe(false);
    expect(mapped?.readOnly).toBe(false);
  });

  it("Return Requested / In Progress / Received reuse existing IDs", () => {
    expect(sellerCard({}, { dispute: dispute({ caseType: "return" }) })?.title).toBe("Issue");
    expect(
      resolveSellerResolutionLifecycle({
        orderStatus: "issue_open",
        protectionCaseType: "return",
        hasProtectionCase: true,
      })?.title,
    ).toBe(SELLER_RESOLUTION_LIFECYCLE_V1.returnRequestedTitle);
    expect(
      resolveSellerResolutionLifecycle({
        orderStatus: "issue_open",
        returnStatus: "in_transit",
        hasProtectionCase: true,
      })?.title,
    ).toBe(SELLER_RESOLUTION_LIFECYCLE_V1.returnInProgressTitle);
    expect(
      resolveSellerResolutionLifecycle({
        orderStatus: "issue_open",
        returnStatus: "received",
        hasProtectionCase: true,
      })?.title,
    ).toBe(SELLER_RESOLUTION_LIFECYCLE_V1.returnReceivedTitle);
  });

  it("Refund Pending / Refunded / Resolved / Closed", () => {
    expect(sellerCard({ refundStatus: "processing" })?.title).toBe("Issue");
    expect(
      resolveSellerResolutionLifecycle({
        orderStatus: "issue_open",
        refundStatus: "processing",
        hasProtectionCase: true,
      })?.title,
    ).toBe(SELLER_RESOLUTION_LIFECYCLE_V1.refundPendingTitle);
    expect(sellerCard({ refundedAt: "2026-08-15T00:00:00.000Z" })?.title).toBe(
      SELLER_RESOLUTION_LIFECYCLE_V1.refundedTitle,
    );
    expect(sellerCard({}, { dispute: dispute({ status: "resolved" }) })?.title).toBe(
      SELLER_RESOLUTION_LIFECYCLE_V1.resolvedTitle,
    );
    expect(sellerCard({}, { dispute: dispute({ status: "closed" }) })?.title).toBe(
      SELLER_RESOLUTION_LIFECYCLE_V1.closedTitle,
    );
  });

  it("Non-delivery never shows Return Requested", () => {
    const shipped = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: order({ status: "shipped" }),
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: {
        courierName: "Evri",
        trackingNumber: "AB1",
        statusLabel: "In transit",
        latestScan: "Shipment handed to carrier",
        carrierUrl: null,
      },
      lossState: "WAITING_FOR_CARRIER",
      dispute: dispute({ caseType: "return" }),
    });
    expect(shipped?.title).toBe(NON_DELIVERY_RESOLUTION_CASE_V1.sellerNonDeliveryTitle);
    expect(shipped?.title).not.toBe(SELLER_RESOLUTION_LIFECYCLE_V1.returnRequestedTitle);
    expect(shipped?.description).not.toMatch(/return/i);
    expect(sellerResolutionDoesNotShowReturnForNonDelivery("WAITING_FOR_CARRIER")).toBe(true);
    expect(
      resolveSellerResolutionLifecycle({
        orderStatus: "issue_open",
        protectionCaseType: "return",
        hasProtectionCase: true,
        lossState: "WAITING_FOR_CARRIER",
      })?.title,
    ).toBe(SELLER_RESOLUTION_LIFECYCLE_V1.issueOpenTitle);
  });

  it("Damage / delivered issue stays on Protection dispute IDs", () => {
    const damaged = sellerCard({}, { dispute: dispute({ status: "open", caseType: "dispute" }) });
    expect(damaged?.title).toBe(SELLER_RESOLUTION_LIFECYCLE_V1.issueOpenTitle);
    expect(damaged?.primaryAction?.id).toBe("view_dispute");
    expect(damaged?.primaryAction?.id).not.toBe("report_issue");
  });

  it("Unauthorized refund action is never emitted", () => {
    const states = [
      sellerCard(),
      sellerCard({}, { dispute: dispute({ status: "awaiting_seller" }) }),
      sellerCard({ refundStatus: "processing" }),
      sellerCard({ refundedAt: "2026-08-15T00:00:00.000Z" }),
    ];
    for (const card of states) {
      expect(card?.primaryAction?.id).not.toBe("refund");
      expect(card?.secondaryAction?.id).not.toBe("refund");
    }
    expect(
      resolveSellerResolutionLifecycle({
        orderStatus: "issue_open",
        refundStatus: "processing",
      })?.allowsRefundAction,
    ).toBe(false);
  });

  it("Buyer regression — issue reason, damage photos, non-delivery, buyer copy", () => {
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
    const buyerIssue = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: order({ status: "issue_open" }),
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
      dispute: dispute({ status: "awaiting_seller" }),
    });
    expect(buyerIssue?.title).toBe("Issue");
    expect(buyerIssue?.description).toBe("Your order is suspended");
    expect(buyerIssue?.primaryAction).toEqual({ id: "view_dispute", label: "View Details" });
    const buyerDelivered = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: order({ status: "delivered" }),
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(buyerDelivered?.secondaryAction).toEqual({
      id: "report_issue",
      label: "I Have an Issue",
    });
  });

  it("Financial separation — seller never sees Buyer Platform Fee / Buyer total", () => {
    const payment = resolveSprint1PaymentUi({
      viewerRole: "seller",
      order: order(),
      listingPrice: 10,
    });
    expect(payment.buyerBreakdown).toBeNull();
    expect(payment.showBuyerFeeInfo).toBe(false);
    expect(payment.secondaryLabel).toBe("You will receive");
  });

  it("Duplicate prevention — one TransactionStatusCard, no parallel seller issue card", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub.split("resolveConversationHubTransactionCardView(").length - 1).toBe(2);
    expect(hub).not.toContain("SellerIssueCard");
    expect(hub).not.toContain("SellerResolutionCard");
    expect(hub).not.toContain("SellerDisputeCard");
    expect(sellerCard()?.resolutionCase).toBeNull();
  });

  it("Respond / View Details opens Resolution Details — never Order Details", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const block = hub.slice(hub.indexOf('if (actionId === "view_dispute")'), hub.indexOf('if (actionId === "view_dispute")') + 220);
    expect(block).toContain("setResolutionDetailsOpen(true)");
    expect(block).not.toContain("setOrderDetailsOpen(true)");
    expect(block).not.toContain("`/resolution/${encodeURIComponent(dispute.id)}`");
    expect(block).not.toContain("`/protection/${encodeURIComponent(dispute.id)}`");
    expect(hub).toContain('data-resolution-details-sheet="v1.0"');
    expect(hub).toContain('data-order-details-sheet="v1.0"');
  });

  it("No Stripe / Sendcloud / Evri / schema / Hub refund", () => {
    const lifecycle = readSource("lib/inbox/seller-resolution-lifecycle-v1.ts");
    const card = readSource("lib/inbox/transaction-status-card-v1.ts");
    expect(lifecycle.toLowerCase()).not.toContain("stripe");
    expect(lifecycle.toLowerCase()).not.toContain("sendcloud");
    expect(lifecycle).not.toContain("createOrderStripeRefund");
    expect(card).not.toContain("createOrderStripeRefund");
    expect(SENDCLOUD_SUPPORT_INTEGRATION_ENABLED).toBe(false);
    expect(canInventSellerCarrierPayout()).toBe(false);
    expect(canAuthorizeBuyerRefund("WAITING_FOR_CARRIER")).toBe(false);
  });
});
