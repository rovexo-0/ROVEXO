import { describe, expect, it } from "vitest";
import { askMarketplaceAssistant } from "@/lib/ai-assistant/marketplace";
import { findNavigationTarget } from "@/lib/ai-assistant/navigation";
import { explainFeature } from "@/lib/ai-assistant/features";
import { ASSISTANT_PERSONAS } from "@/lib/ai-assistant/personas";
import { cacheGet, cacheSet } from "@/lib/cache/memory";
import { userHasPremiumFeature } from "@/lib/monetization/service";
import { MONETIZATION_PRODUCTS } from "@/lib/monetization/types";
import { auditPermissions } from "@/lib/security/permissions-audit";

describe("pass 4-6 enterprise systems", () => {
  it("pass 4: supports persona assistants and platform navigation", () => {
    expect(ASSISTANT_PERSONAS.length).toBe(5);
    expect(findNavigationTarget("open my wallet")?.href).toBe("/wallet");
    expect(explainFeature("purchase protection")?.id).toBe("buyer-protection");

    const response = askMarketplaceAssistant("how do I promote listings", {
      pathname: "/seller/listings",
      persona: "seller",
    });
    expect(response.matched).toBe(true);
    expect(response.persona).toBe("seller");
    expect(response.trustHref).toBe("/trust");
  });

  it("pass 5: monetization catalog and premium feature gates", () => {
    expect(MONETIZATION_PRODUCTS.length).toBeGreaterThanOrEqual(8);
    expect(
      userHasPremiumFeature(
        { id: "1", userId: "u", planSlug: "enterprise", planName: "Enterprise", status: "active", currentPeriodEnd: null },
        "premium_ai",
      ),
    ).toBe(true);
  });

  it("pass 6: launch cache and permission audit surfaces", () => {
    cacheSet("test:key", { ok: true }, 1000);
    expect(cacheGet<{ ok: boolean }>("test:key")?.ok).toBe(true);
    expect(auditPermissions().total).toBeGreaterThan(5);
  });
});
