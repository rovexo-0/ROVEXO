import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Messages bundle data (no Hub thumbnail redesign)", () => {
  it("offers API already exposes bundle.lines with imageUrl (no new query)", () => {
    const route = readSource("app/api/offers/route.ts");
    expect(route).toContain("parseBundleMessageMeta");
    expect(route).toContain("lines: bundle.lines");
  });

  it("Conversation Hub does not introduce a horizontal bundle thumb rail (freeze)", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const css = readSource("styles/rovexo/conversation-hub-v1.css");

    expect(hub).not.toContain("ConversationOfferBundleThumbs");
    expect(hub).not.toContain("data-offer-bundle-thumbs");
    expect(css).not.toContain(".conv-hub__offer-bundle-thumbs");
    expect(css).not.toContain(".conv-hub__offer-bundle-more");
  });
});
