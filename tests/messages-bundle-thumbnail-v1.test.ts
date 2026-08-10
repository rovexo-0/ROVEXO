import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Messages offer card product thumbnail (no Hub redesign)", () => {
  it("offers API already exposes bundle.lines with imageUrl (no new query)", () => {
    const route = readSource("app/api/offers/route.ts");
    expect(route).toContain("parseBundleMessageMeta");
    expect(route).toContain("lines: bundle.lines");
  });

  it("Conversation Hub maps bundle.lines and renders compact offer thumb(s)", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const css = readSource("styles/rovexo/conversation-hub-v1.css");

    expect(hub).toContain("resolveOfferCardProductThumbUrls");
    expect(hub).toContain("lines: offer.bundle.lines");
    expect(hub).toContain('data-offer-product-thumb="true"');
    expect(hub).toContain("conv-hub__offer-thumb");
    expect(hub).toContain("conv-hub__offer-thumbs");
    expect(hub).toContain("view.product.imageUrl");
    expect(css).toContain(".conv-hub__offer-thumb");
    expect(css).toContain(".conv-hub__offer-thumbs");
    expect(css).toContain(".conv-hub__offer-thumb-img");
    expect(css).toMatch(/\.conv-hub__offer-thumb-img[\s\S]*filter:\s*none/);
  });

  it("does not introduce Hub redesign / parallel Offer Composer sheet", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const css = readSource("styles/rovexo/conversation-hub-v1.css");

    expect(hub).not.toContain("ConversationOfferBundleThumbs");
    expect(hub).not.toContain("data-offer-bundle-thumbs");
    expect(hub).not.toContain("BundleOfferDetailsSheet");
    expect(hub).toContain("OfferBundleDetailsSheet");
    expect(
      existsSync(join(process.cwd(), "features/inbox/components/BundleOfferDetailsSheet.tsx")),
    ).toBe(false);
    expect(
      existsSync(join(process.cwd(), "features/inbox/components/OfferBundleDetailsSheet.tsx")),
    ).toBe(true);
    expect(css).not.toContain(".conv-hub__offer-bundle-thumbs");
    expect(css).not.toContain(".conv-hub__offer-bundle-more");
  });

  it("thumb resolver prefers valid bundle line imageUrls then listing image", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const start = hub.indexOf("function resolveOfferCardProductThumbUrls");
    const end = hub.indexOf("function syncMessagesListAfterSend");
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const block = hub.slice(start, end);
    expect(block).toContain("line?.imageUrl");
    expect(block).toContain("isRenderableImageSrc");
    expect(block).toContain("productImageUrl");
    expect(block).toContain("OFFER_CARD_THUMB_MAX");
    expect(block).not.toContain("fetch(");
    expect(block).not.toContain("/api/");
  });
});
