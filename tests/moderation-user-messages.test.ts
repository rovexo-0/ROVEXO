import { describe, expect, it } from "vitest";
import { analyzeMessageContent } from "@/lib/moderation/analyzer";
import { buildModerationUserMessage } from "@/lib/moderation/user-messages";

describe("moderation user messages", () => {
  it("returns user-friendly blocked message for scams", () => {
    const result = analyzeMessageContent("Pay me outside the app via bank transfer only");
    const message = buildModerationUserMessage(result);
    expect(message).toContain("ROVEXO");
    expect(message.toLowerCase()).not.toContain("rule group");
  });

  it("warns about whatsapp contact attempts", () => {
    const result = analyzeMessageContent("Message me on whatsapp");
    const message = buildModerationUserMessage(result);
    expect(message.toLowerCase()).toContain("whatsapp");
  });
});
