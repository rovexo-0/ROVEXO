import { describe, expect, it } from "vitest";
import { buildConversationHubView } from "@/lib/inbox/conversation-view";
import {
  CONVERSATION_MOCKUP_DEMO_ID,
  getConversationMockupDemoBundle,
  isConversationMockupDemoEnabled,
  isConversationMockupDemoId,
} from "@/lib/inbox/demo/conversation-mockup-demo-fixture-v1";

describe("conversation-mockup-demo-fixture-v1", () => {
  it("uses a reserved demo id that never equals empty", () => {
    expect(isConversationMockupDemoId(CONVERSATION_MOCKUP_DEMO_ID)).toBe(true);
    expect(isConversationMockupDemoId("1373fc00-d79a-464b-aea7-1b87effd13ab")).toBe(false);
  });

  it("is enabled in development / vitest only", () => {
    expect(isConversationMockupDemoEnabled()).toBe(true);
  });

  it("builds the Owner mockup timeline: messages, offers, accept system, buyer accepted panel data", () => {
    const { conversation, offers } = getConversationMockupDemoBundle();
    expect(conversation.id).toBe(CONVERSATION_MOCKUP_DEMO_ID);
    expect(conversation.messages.map((m) => m.content)).toEqual([
      "Hi! Is this still available?",
      "Yes, it's available.",
      "Could you do £31?",
      "I can do £31.50",
    ]);
    expect(offers.map((o) => ({ amount: o.amount, fromRole: o.fromRole, state: o.state }))).toEqual([
      { amount: 30, fromRole: "buyer", state: "countered" },
      { amount: 32.5, fromRole: "seller", state: "countered" },
      { amount: 31.5, fromRole: "buyer", state: "accepted" },
    ]);

    const view = buildConversationHubView({ conversation, offers, order: null });
    expect(view.viewerRole).toBe("buyer");
    expect(view.hasOrder).toBe(false);

    const kinds = view.timeline.map((item) => item.kind);
    expect(kinds.filter((k) => k === "message")).toHaveLength(4);
    expect(kinds.filter((k) => k === "offer")).toHaveLength(3);
    /* Offer Accepted is Transaction Status Card only — no duplicate system card in chat. */
    const acceptedSystem = view.timeline.find(
      (item) => item.kind === "system" && item.event === "offer_accepted",
    );
    expect(acceptedSystem).toBeUndefined();

    const accepted = offers.find((o) => o.state === "accepted");
    expect(accepted?.amount).toBe(31.5);
  });
});
