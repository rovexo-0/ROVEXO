import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1,
  formatBuyNowLabel,
  formatPayNowLabel,
} from "@/lib/inbox/master-buyer-conversation-hub-freeze-v1";
import { CONVERSATION_HUB_SPRINT1_FREEZE } from "@/lib/inbox/conversation-hub-sprint1-freeze-v1";
import { PRIORITY_0_V1 } from "@/lib/priority-0-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Master Buyer Conversation Hub Freeze v1.0", () => {
  it("locks permanent freeze markers", () => {
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.status).toBe("PERMANENT_FREEZE_APPROVED");
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.approvedByOwner).toBe(true);
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.permanent).toBe(true);
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.absoluteLaws.codePassIsNotProductPass).toBe(
      true,
    );
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.absoluteLaws.whiteScreenProductFail).toBe(true);
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.stickyCta.labelPrefix).toBe("BUY NOW");
  });

  it("formats BUY NOW • final total (never item-only as the intended total example)", () => {
    expect(formatBuyNowLabel(7.53)).toBe("BUY NOW • £7.53");
    expect(formatPayNowLabel(7.53)).toBe("BUY NOW • £7.53");
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.stickyCta.alwaysFinalBuyerTotal).toBe(true);
  });

  it("locks UI order and seller forbidden money surfaces", () => {
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.uiOrder[0]).toBe("HEADER");
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.uiOrder.at(-1)).toBe("SAFE_AREA");
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.uiOrder).toContain("STICKY_BUY_NOW_BUTTON");
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.sellerMustNeverSee).toContain("PLATFORM_FEE");
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.sellerMustNeverSee).toContain("TOTAL_BUYER_PAYS");
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.buyerMustSee).toContain("BUY_NOW_FINAL_TOTAL");
  });

  it("parents Sprint 1 freeze and Priority 0 child wiring", () => {
    expect(CONVERSATION_HUB_SPRINT1_FREEZE.parent).toBe(
      MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.ssot.code,
    );
    expect(PRIORITY_0_V1.childLaws).toMatchObject({
      masterBuyerConversationHub: "lib/inbox/master-buyer-conversation-hub-freeze-v1.ts",
    });
  });

  it("keeps ConversationHub stamped and rule/doc in sync", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const rule = readSource(".cursor/rules/master-buyer-conversation-hub-freeze-v1.mdc");
    const doc = readSource("docs/modules/inbox/MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.md");
    expect(hub).toContain("MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1");
    expect(hub).toContain("data-master-buyer-hub");
    expect(rule).toContain("BUY NOW • £final_total");
    expect(doc).toContain("PERMANENT FREEZE APPROVED");
    expect(doc).toContain("the product does not exist");
  });
});
