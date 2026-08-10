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

  it("Master Hub freeze forbids new Hub surface components", () => {
    expect(BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.doNotCreateNewComponents).toBe(true);
    expect(
      existsSync(join(process.cwd(), "features/inbox/components/BundleOfferDetailsSheet.tsx")),
    ).toBe(false);
    expect(hub()).not.toContain("BundleOfferDetailsSheet");
    expect(hub()).not.toContain("setBundleDetailsOffer");
    expect(hub()).not.toContain("ConversationOfferBundleThumbs");
    expect(hub()).not.toContain("data-offer-bundle-thumbs");
    /* Compact in-card thumb is allowed; horizontal rail / sheet are not. */
    expect(hub()).toContain('data-offer-product-thumb="true"');
  });

  it("Offers API still exposes bundle.lines (engine unchanged; Hub does not add a sheet)", () => {
    const route = offersApi();
    expect(route).toContain("parseBundleMessageMeta");
    expect(route).toContain("lines: bundle.lines");
  });
});
