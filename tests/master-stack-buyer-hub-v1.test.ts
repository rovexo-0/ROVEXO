import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MASTER_STACK_BUYER_HUB_V1,
  formatMasterStackActiveLabel,
  formatMasterStackLocation,
  formatMasterStackRatingLine,
} from "@/lib/inbox/master-stack-buyer-hub-v1";
import { MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1 } from "@/lib/inbox/master-buyer-conversation-hub-freeze-v1";
import { buyerPaysTotal } from "@/lib/inbox/conversation-payment-sprint1";
import { formatBuyNowLabel } from "@/lib/inbox/master-buyer-conversation-hub-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Master Stack — Buyer Conversation Hub v1.0", () => {
  it("locks Master Stack layers in Owner order", () => {
    expect(MASTER_STACK_BUYER_HUB_V1.stack).toEqual([
      "HEADER",
      "PRODUCT_CARD",
      "ORDER_STATUS_CARD",
      "SELLER_INFORMATION_AND_ORDER_SUMMARY",
      "OFFER_HISTORY",
      "CHAT_HISTORY",
      "MESSAGE_INPUT",
      "STICKY_BUY_NOW_BUTTON",
      "SAFE_AREA",
    ]);
    expect(MASTER_STACK_BUYER_HUB_V1.productCard.imagePx).toBe(72);
    expect(MASTER_STACK_BUYER_HUB_V1.stickyCta.alwaysTotalBuyerPays).toBe(true);
    expect(MASTER_STACK_BUYER_HUB_V1.stickyCta.forbiddenItemOnlyPrice).toBe(true);
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.uiOrder).toEqual(
      MASTER_STACK_BUYER_HUB_V1.stack,
    );
  });

  it("formats Active / location / rating for Master Stack", () => {
    expect(
      formatMasterStackActiveLabel({
        online: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }),
    ).toBe("Active 2h ago");
    expect(formatMasterStackLocation("Birmingham")).toBe("Birmingham, UK");
    expect(formatMasterStackRatingLine(4.9, 582)).toBe("4.9 (582 reviews)");
    expect(formatMasterStackRatingLine(0, 0)).toBe("New member");
  });

  it("forbids item-only sticky CTA — total buyer pays always", () => {
    const item = 6.5;
    const total = buyerPaysTotal(item);
    expect(total).not.toBe(item);
    expect(formatBuyNowLabel(total)).toBe(`BUY NOW • £${total.toFixed(2)}`);
    expect(formatBuyNowLabel(total)).not.toContain("£6.50");
  });

  it("keeps Canonical Negotiation UI stamps on Hub + Dynamic Action Card", () => {
    const hub = readSource(MASTER_STACK_BUYER_HUB_V1.component);
    const rule = readSource(".cursor/rules/master-stack-buyer-hub-v1.mdc");
    const doc = readSource("docs/modules/inbox/MASTER_STACK_BUYER_HUB_V1.md");
    expect(hub).toContain('data-conversation-hub-ui="v2-canonical"');
    expect(hub).toContain("conv-hub__header-centre--identity");
    expect(hub).toContain("conv-hub__product--compact");
    expect(hub).toContain("TransactionStatusCard");
    expect(hub).toContain("resolveConversationHubTransactionCardView");
    expect(hub).toContain("conv-hub__offer--timeline");
    expect(hub).toContain("TransactionActionBar");
    expect(hub).toContain("showBottomNav={false}");
    const actions = readSource("features/transaction-hub/TransactionHubBottomActions.tsx");
    const statusCard = readSource("lib/inbox/transaction-status-card-v1.ts");
    expect(hub).toContain("executeBuyNow");
    expect(hub).toContain("buildBuyNowCheckoutHref");
    expect(statusCard).toContain('status: "OFFER_ACCEPTED"');
    expect(statusCard).toContain('id: "buy_now"');
    expect(actions).toContain("Make Offer");
    expect(actions).toContain("Canonical Offer Accepted + BUY NOW = Transaction Status Card only");
    expect(actions).not.toContain("thub-v1__accept-card");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("TOTAL BUYER PAYS ALWAYS");
    expect(doc).toContain("BUYER CONVERSATION HUB v1.0 PASS");
  });
});
