import { describe, expect, it } from "vitest";
import { askMarketplaceAssistant } from "@/lib/ai-assistant/marketplace";
import { listEnterpriseModules } from "@/lib/enterprise/registry";
import { MONETIZATION_PRODUCTS } from "@/lib/monetization/types";
import { TRUST_CENTER_SECTIONS, VERIFICATION_TYPES } from "@/lib/trust/types";
import { WHOLESALE_FEATURES } from "@/lib/wholesale/types";
import { detectHelpIntent } from "@/lib/help/intents";

describe("phase 8 enterprise platform", () => {
  it("registers enterprise modules for scalable integration", () => {
    const modules = listEnterpriseModules();
    expect(modules.length).toBeGreaterThanOrEqual(8);
    expect(modules.some((module) => module.id === "trust")).toBe(true);
    expect(modules.some((module) => module.id === "monetization")).toBe(true);
  });

  it("defines trust center sections and verification types", () => {
    expect(TRUST_CENTER_SECTIONS.length).toBeGreaterThanOrEqual(8);
    expect(VERIFICATION_TYPES.length).toBeGreaterThanOrEqual(8);
  });

  it("defines wholesale and monetization catalog", () => {
    expect(WHOLESALE_FEATURES.length).toBeGreaterThanOrEqual(5);
    expect(MONETIZATION_PRODUCTS.length).toBeGreaterThanOrEqual(6);
  });

  it("routes marketplace assistant to help and trust flows", () => {
    const intent = detectHelpIntent("wholesale rfq bulk order");
    expect(intent?.topicSlug).toBe("wholesale");

    const response = askMarketplaceAssistant("I can't withdraw my money", {
      pathname: "/seller/wallet",
      persona: "seller",
    });
    expect(response.matched).toBe(true);
    expect(response.guideHref).toContain("withdraw");
    expect(response.trustHref).toBeTruthy();
  });
});
