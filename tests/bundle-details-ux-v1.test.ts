import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1 } from "@/lib/inbox/buyer-conversation-hub-master-ui-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("COD SÂNGE — Bundle Details UX (Hub freeze preserved)", () => {
  const hub = () => readSource("features/inbox/components/ConversationHub.tsx");
  const offersApi = () => readSource("app/api/offers/route.ts");

  it("forbids parallel BundleOfferDetailsSheet; canonical OfferBundleDetailsSheet is required", () => {
    expect(BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.doNotCreateNewComponents).toBe(true);
    /* Forbidden parallel / legacy names */
    expect(
      existsSync(join(process.cwd(), "features/inbox/components/BundleOfferDetailsSheet.tsx")),
    ).toBe(false);
    expect(hub()).not.toContain("BundleOfferDetailsSheet");
    expect(hub()).not.toContain("ConversationOfferBundleThumbs");
    expect(hub()).not.toContain("data-offer-bundle-thumbs");
    /* Owner-authorized canonical Bundle Details (Messages Offer/Bundle UX) */
    expect(hub()).toContain("OfferBundleDetailsSheet");
    expect(hub()).toContain("setBundleDetailsOffer");
    expect(
      existsSync(join(process.cwd(), "features/inbox/components/OfferBundleDetailsSheet.tsx")),
    ).toBe(true);
    /* Compact in-card thumb remains */
    expect(hub()).toContain('data-offer-product-thumb="true"');
  });

  it("Offers API still exposes bundle.lines (engine unchanged; Hub sheet reads payload only)", () => {
    const route = offersApi();
    expect(route).toContain("parseBundleMessageMeta");
    expect(route).toContain("lines: bundle.lines");
  });
});
