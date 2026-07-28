import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Shipping Label Viewer v1.0", () => {
  it("provides a canonical viewer that embeds official labels without regenerating", () => {
    const viewer = readSource("features/shipping/components/ShippingLabelViewer.tsx");
    const css = readSource("styles/rovexo/shipping-label-viewer-v1.css");
    expect(viewer).toContain('data-shipping-label-viewer="v1.0"');
    expect(viewer).toContain("Official Carrier PDF");
    expect(viewer).toContain("Print / Share");
    expect(viewer).toContain("Download");
    expect(viewer).toContain("Loading shipping label...");
    expect(viewer).toContain("createObjectURL");
    expect(viewer).toContain("looksLikeHtml");
    expect(viewer).toContain('demo-label") ? "no-store"');
    expect(viewer).toContain("isSinglePage");
    expect(viewer).toContain("Shipping label unavailable.");
    expect(viewer).toContain("application/pdf");
    expect(viewer).toContain("view=Fit");
    expect(viewer).not.toContain("generateShippingLabel");
    expect(viewer).not.toContain('method: "POST"');
    expect(css).toContain(".slv-v1__shell");
    expect(css).toContain(".slv-v1__spinner");
    expect(css).toContain("background: #ffffff");
    expect(css).toContain("0 2px 10px rgba(0, 0, 0, 0.06)");
    expect(css).toContain("width: 96%");
    expect(css).not.toContain(".slv-v1__carrier");
    expect(viewer).not.toContain("slv-v1__carrier");
    expect(viewer).toContain('scrollPanel={false}');
    expect(css).toContain("content: none !important");
    expect(css).toContain("No decorative side rails");
  });

  it("opens the viewer from Conversation Hub View instead of raw PDF tabs", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("ShippingLabelViewer");
    expect(hub).toContain("setLabelViewer");
    expect(hub).toContain('"view_label"');
    const viewLabelBlock = hub.slice(hub.indexOf('if (actionId === "view_label")'), hub.indexOf('if (actionId === "print_label"'));
    expect(viewLabelBlock).not.toContain("window.open");
  });
});
