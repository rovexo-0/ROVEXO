import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Messages offer bundle details + text visibility (Owner UX)", () => {
  it("offer card with bundle is interactive and opens Bundle Details sheet", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("OfferBundleDetailsSheet");
    expect(hub).toContain('"aria-label": "View bundle details"');
    expect(hub).toContain("setBundleDetailsOffer");
    expect(hub).toContain("conv-hub__offer--interactive");
    expect(hub).toContain('data-offer-bundle-open');
    expect(hub).toContain("bundleDetailsOffer");
  });

  it("Bundle Details sheet renders every bundle.lines entry with real imageUrl", () => {
    const sheet = readSource("features/inbox/components/OfferBundleDetailsSheet.tsx");
    expect(sheet).toContain("data-offer-bundle-details");
    expect(sheet).toContain("bundle.lines");
    expect(sheet).toContain("line.imageUrl");
    expect(sheet).toContain("isRenderableImageSrc");
    expect(sheet).toContain("SafeImage");
    expect(sheet).toContain("unitPrice");
    expect(sheet).toContain("Qty");
    expect(sheet).toContain("List total");
    expect(sheet).toContain("offer.amount");
    expect(sheet).toContain("Counter offer");
    expect(sheet).toContain('aria-label="Close"');
    expect(sheet).toContain("Escape");
    expect(existsSync(join(process.cwd(), "features/inbox/components/OfferBundleDetailsSheet.tsx"))).toBe(
      true,
    );
  });

  it("does not introduce a second Offer Composer or checkout path", () => {
    const sheet = readSource("features/inbox/components/OfferBundleDetailsSheet.tsx");
    expect(sheet).not.toContain("OfferComposerSheet");
    expect(sheet).not.toContain("/checkout");
    expect(sheet).not.toContain("executeBuyNow");
    expect(sheet).not.toContain("fetch(");
    expect(sheet).not.toContain("/api/");
  });

  it("list-price line-through is scoped; Bundle meta is not struck", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const css = readSource("styles/rovexo/conversation-hub-v1.css");
    expect(hub).toContain("conv-hub__offer-list--struck");
    expect(hub).toContain("conv-hub__offer-meta");
    expect(css).toContain(".conv-hub__offer-list--struck");
    expect(css).toMatch(/\.conv-hub__offer-list--struck[\s\S]*line-through/);
    expect(css).toMatch(/\.conv-hub__offer-meta[\s\S]*text-decoration:\s*none/);
    // Default offer-list must not force line-through on all muted text.
    const listBlockStart = css.indexOf(".conv-hub__offer-list {");
    const listBlockEnd = css.indexOf("}", listBlockStart);
    const listBlock = css.slice(listBlockStart, listBlockEnd + 1);
    expect(listBlock).not.toContain("line-through");
  });

  it("Dark Theme keeps composer + bubbles + offer text readable", () => {
    const theme = readSource("styles/rovexo/black-underground-theme-v1.css");
    expect(theme).toContain("html[data-theme=\"dark\"] .conv-hub__composer-field");
    expect(theme).toContain("caret-color");
    expect(theme).toContain("-webkit-text-fill-color: var(--rvx-text-primary)");
    expect(theme).toContain("html[data-theme=\"dark\"] .conv-hub__bubble--buyer");
    expect(theme).toContain("html[data-theme=\"dark\"] .conv-hub__offer-meta");
    expect(theme).toContain("html[data-theme=\"dark\"] .conv-hub__bundle-sheet-panel");
    expect(theme).toContain("html[data-theme=\"dark\"] .conv-hub__offer-list--struck");
  });
});
