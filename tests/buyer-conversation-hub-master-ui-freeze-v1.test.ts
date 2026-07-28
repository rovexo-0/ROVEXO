import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1,
  isOwnerLawPassForBuyerHub,
  resolveBuyerConversationHubProductPass,
} from "@/lib/inbox/buyer-conversation-hub-master-ui-freeze-v1";
import { MASTER_STACK_BUYER_HUB_V1 } from "@/lib/inbox/master-stack-buyer-hub-v1";
import { MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1 } from "@/lib/inbox/master-buyer-conversation-hub-freeze-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Buyer Conversation Hub Master UI Freeze v1.0 (1:1)", () => {
  it("locks Absolute Master Approved markers", () => {
    expect(BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.status).toBe(
      "ABSOLUTE_MASTER_APPROVED",
    );
    expect(BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.onlySourceOfTruth).toBe(
      "OWNER_APPROVED_MASTER_IMAGE",
    );
    expect(BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.doNotRedesign).toBe(true);
    expect(BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.doNotImprovise).toBe(true);
    expect(BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.doNotCreateNewComponents).toBe(
      true,
    );
    expect(BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.stickyCta.forbiddenItemOnlyPrice).toBe(
      true,
    );
    expect(MASTER_STACK_BUYER_HUB_V1.status).toBe("ABSOLUTE_MASTER_APPROVED");
  });

  it("resolves Product PASS only with Owner visual certification", () => {
    const base = {
      headerPass: true,
      productCardPass: true,
      orderStatusPass: true,
      sellerInformationPass: true,
      orderSummaryPass: true,
      offerHistoryPass: true,
      chatPass: true,
      messageInputPass: true,
      stickyCtaPass: true,
      responsivePass: true,
      whiteScreenPass: true,
      ownerVisualCertificationPass: true,
    };
    expect(resolveBuyerConversationHubProductPass(base)).toBe("PRODUCT_PASS_100");
    expect(
      resolveBuyerConversationHubProductPass({
        ...base,
        ownerVisualCertificationPass: false,
      }),
    ).toBe("PRODUCT_FAIL");
    expect(isOwnerLawPassForBuyerHub([...BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.ownerLawMust])).toBe(
      true,
    );
    expect(isOwnerLawPassForBuyerHub(["SEE", "SCROLL"])).toBe(false);
  });

  it("wires into Master Buyer, Absolute Master Freeze, Constitution", () => {
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.childLaws).toMatchObject({
      masterUiFreeze: "lib/inbox/buyer-conversation-hub-master-ui-freeze-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      buyerConversationHubMasterUi:
        "lib/inbox/buyer-conversation-hub-master-ui-freeze-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      buyerConversationHubMasterUi:
        "lib/inbox/buyer-conversation-hub-master-ui-freeze-v1.ts",
    });
  });

  it("keeps Hub stamp, always-apply rule, and doc in sync", () => {
    const hub = readSource(BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.component);
    const rule = readSource(".cursor/rules/buyer-conversation-hub-master-ui-freeze-v1.mdc");
    const doc = readSource(
      "docs/modules/inbox/BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.md",
    );
    expect(hub).toContain("data-master-ui-freeze");
    expect(hub).toContain("BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1");
    expect(hub).toContain("ConversationSkeleton");
    expect(hub).not.toContain("ROVEXO logo");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("ABSOLUTE MASTER APPROVED");
    expect(doc).toContain("PERMANENT FREEZE");
    expect(doc).toContain("Owner-approved master image");
  });
});
