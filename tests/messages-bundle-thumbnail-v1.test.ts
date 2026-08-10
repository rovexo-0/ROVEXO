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

  it("Conversation Hub maps bundle.lines and renders compact non-overlapping offer thumbs", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const css = readSource("styles/rovexo/conversation-hub-v1.css");

    expect(hub).toContain("resolveOfferCardProductThumbs");
    expect(hub).toContain("line?.imageUrl");
    expect(hub).toContain('data-offer-product-thumb="true"');
    expect(hub).toContain("conv-hub__offer-thumb");
    expect(hub).toContain("conv-hub__offer-thumbs");
    expect(hub).toContain("conv-hub__offer-thumb--more");
    expect(hub).toContain("view.product.imageUrl");
    expect(css).toContain(".conv-hub__offer-thumb");
    expect(css).toContain(".conv-hub__offer-thumbs");
    expect(css).toContain(".conv-hub__offer-thumb-img");
    expect(css).toContain(".conv-hub__offer-thumb--more");
    expect(css).toMatch(/\.conv-hub__offer-thumb-img[\s\S]*object-fit:\s*cover/);
    expect(css).toMatch(/\.conv-hub__offer-thumb-img[\s\S]*filter:\s*none/);
    /* Overlap stack forbidden */
    expect(css).not.toMatch(/margin-left:\s*-/);
    expect(css).toMatch(/\.conv-hub__offer-thumbs[\s\S]*gap:\s*4px/);
    expect(css).toMatch(/\.conv-hub__offer-thumbs[\s\S]*overflow:\s*hidden/);
    /* Card height must grow with content — never clip status/price/meta via max-height. */
    expect(css).toMatch(/\.conv-hub__offer\s*\{[^}]*max-height:\s*none/);
    expect(css).not.toMatch(/\.conv-hub__offer\s*\{[^}]*max-height:\s*56px/);
    expect(css).toMatch(/\.conv-hub__offer-copy[\s\S]*gap:\s*2px/);
    expect(css).toMatch(/\.conv-hub__offer-label[\s\S]*position:\s*static/);
    expect(css).toMatch(/\.conv-hub__offer-thumb\s*\{[^}]*width:\s*36px/);
    expect(css).toMatch(/\.conv-hub__offer-thumb\s*\{[^}]*height:\s*36px/);
    expect(css).toMatch(/\.conv-hub__offer\s*\{[^}]*padding:\s*7px\s+10px/);
    expect(css).toMatch(/\.conv-hub__offer-row\s*\{[^}]*margin-top:\s*6px/);
    expect(css).not.toMatch(/margin-left:\s*-/);
    expect(hub).toContain("width={36}");
    expect(hub).toContain("height={36}");
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

  it("thumb resolver prefers valid bundle line imageUrls then listing image; +N when >3", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const start = hub.indexOf("function resolveOfferCardProductThumbs");
    const end = hub.indexOf("function syncMessagesListAfterSend");
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const block = hub.slice(start, end);
    expect(block).toContain("line?.imageUrl");
    expect(block).toContain("isRenderableImageSrc");
    expect(block).toContain("productImageUrl");
    expect(block).toContain("OFFER_CARD_THUMB_MAX");
    expect(block).toContain("moreCount");
    expect(block).toContain("itemCount");
    expect(block).toContain("allUrls.slice(0, 2)");
    expect(block).not.toContain("fetch(");
    expect(block).not.toContain("/api/");
  });
});
