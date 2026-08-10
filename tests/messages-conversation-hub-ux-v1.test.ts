import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatInboxLastMessagePreview } from "@/lib/messages/utils";
import { encodeBundleMessageMeta, type BundlePayloadV1 } from "@/lib/bundle/bundle-payload-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Messages / Conversation Hub UX (safe functional only)", () => {
  it("does not redesign Offer History borders / thumbs in Hub CSS", () => {
    const css = readSource("styles/rovexo/conversation-hub-v1.css");
    expect(css).not.toMatch(/\.conv-hub__offer\s*\{[^}]*border:\s*none\s*!important/);
    expect(css).not.toContain(".conv-hub__offer-bundle-thumbs");
    expect(css).not.toContain("flex-direction: row !important");
  });

  it("makes Inbox unread preview styles real (not class-only)", () => {
    const css = readSource("styles/rovexo/inbox-hub-v1.css");
    const page = readSource("features/inbox/components/InboxPage.tsx");
    expect(css).toContain(".inbox-hub__preview--unread");
    expect(css).toContain(".inbox-hub__card--unread");
    expect(css).toContain(".inbox-hub__party-name--unread");
    expect(page).toContain("inbox-hub__card--unread");
    expect(page).toContain("formatInboxLastMessagePreview");
  });

  it("formats bundle meta last_message for Inbox preview without new fetch", () => {
    const payload: BundlePayloadV1 = {
      v: 1,
      sellerId: "00000000-0000-4000-8000-000000000001",
      sellerName: "seller",
      lines: [
        {
          productId: "00000000-0000-4000-8000-000000000002",
          slug: "a",
          title: "A",
          imageUrl: "https://example.com/a.jpg",
          unitPrice: 10,
          quantity: 1,
          maxStock: 1,
        },
        {
          productId: "00000000-0000-4000-8000-000000000003",
          slug: "b",
          title: "B",
          imageUrl: "https://example.com/b.jpg",
          unitPrice: 20,
          quantity: 1,
          maxStock: 1,
        },
      ],
      listSubtotal: 30,
      itemCount: 2,
      quantitySum: 2,
    };
    const encoded = encodeBundleMessageMeta(payload, null);
    const preview = formatInboxLastMessagePreview(encoded);
    expect(preview).toContain("Bundle offer");
    expect(preview).toContain("2 items");
    expect(preview).not.toContain("__RVX_BUNDLE");
  });
});
